import { 
  users,
  groceryLists, 
  foodItems, 
  listItems, 
  meals,
  nutritionLogs,
  type User,
  type InsertUser,
  type UpdateProfile,
  type GroceryList, 
  type InsertGroceryList,
  type FoodItem,
  type InsertFoodItem,
  type ListItem,
  type InsertListItem,
  type Meal,
  type InsertMeal,
  type NutritionLog,
  type InsertNutritionLog
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte } from "drizzle-orm";
import bcrypt from "bcryptjs";

export interface IStorage {
  // Users
  createUser(user: InsertUser): Promise<User>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserById(id: number): Promise<User | undefined>;
  updateUser(id: number, updates: UpdateProfile): Promise<User | undefined>;
  validateUser(email: string, password: string): Promise<User | null>;
  
  // Grocery Lists
  createGroceryList(list: InsertGroceryList): Promise<GroceryList>;
  getGroceryLists(userId: number): Promise<GroceryList[]>;
  getGroceryList(id: number): Promise<GroceryList | undefined>;
  updateGroceryList(id: number, updates: Partial<GroceryList>): Promise<GroceryList | undefined>;
  
  // Food Items
  getFoodItems(): Promise<FoodItem[]>;
  getFoodItem(id: number): Promise<FoodItem | undefined>;
  createFoodItem(item: InsertFoodItem): Promise<FoodItem>;
  
  // List Items
  addItemToList(item: InsertListItem): Promise<ListItem>;
  getListItems(listId: number): Promise<ListItem[]>;
  removeItemFromList(id: number): Promise<boolean>;
  
  // Meals
  createMeal(meal: InsertMeal): Promise<Meal>;
  getMeals(listId: number): Promise<Meal[]>;
  updateMeal(id: number, updates: Partial<Meal>): Promise<Meal | undefined>;
  deleteMeal(id: number): Promise<boolean>;
  addIngredientToMeal(mealId: number, ingredient: { foodItemId: number; quantity: number; unit: string }): Promise<Meal | undefined>;
  
  // Nutrition Logs
  createNutritionLog(log: InsertNutritionLog): Promise<NutritionLog>;
  getNutritionLogs(userId: number, days?: number): Promise<NutritionLog[]>;
  updateTodayNutritionLog(userId: number, updates: Partial<NutritionLog>): Promise<NutritionLog>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async createUser(userData: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const [user] = await db
      .insert(users)
      .values({
        ...userData,
        password: hashedPassword,
      })
      .returning();
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserById(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async updateUser(id: number, updates: UpdateProfile): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.getUserByEmail(email);
    if (!user) return null;
    
    const isValid = await bcrypt.compare(password, user.password);
    return isValid ? user : null;
  }

  // Initialize food items in database using CSV data
  async initializeFoodItems() {
    const existingItems = await db.select().from(foodItems);
    if (existingItems.length > 0) return; // Already initialized

    // Read and parse CSV file directly
    const fs = await import('fs');
    const path = await import('path');
    
    const csvPath = path.join(process.cwd(), 'aliments_sains_unifie.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split('\n').filter(line => line.trim());
    
    // Skip header line
    const dataLines = lines.slice(1);
    
    const foodItemsToInsert: InsertFoodItem[] = [];
    
    for (const line of dataLines) {
      if (!line.trim()) continue;
      
      const columns = this.parseCSVLine(line);
      if (columns.length < 10) continue;
      
      const name = columns[0];
      const category = this.normalizeCategoryName(columns[1]);
      const emoji = columns[3];
      const protein = parseFloat(columns[4]) || 0;
      const carbs = parseFloat(columns[5]) || 0;
      const fat = parseFloat(columns[6]) || 0;
      const calories = parseFloat(columns[7]) || 0;
      const season = this.normalizeSeasonName(columns[9]);
      
      foodItemsToInsert.push({
        name,
        emoji,
        category,
        season,
        nutrition: {
          calories,
          protein,
          carbs,
          fat
        }
      });
    }

    await db.insert(foodItems).values(foodItemsToInsert);
    console.log(`Initialized ${foodItemsToInsert.length} food items from CSV data`);
  }

  private normalizeCategoryName(category: string): string {
    return category
      .toLowerCase()
      .replace(/[éèê]/g, 'e')
      .replace(/[àâ]/g, 'a')
      .replace(/[ç]/g, 'c')
      .replace(/[,\s]+/g, '-')
      .replace(/[^\w-]/g, '');
  }

  private normalizeSeasonName(season: string): string {
    const seasonMap: { [key: string]: string } = {
      'autumn': 'autumn',
      'automne': 'autumn',
      'winter': 'winter',
      'hiver': 'winter',
      'spring': 'spring',
      'printemps': 'spring',
      'summer': 'summer',
      'été': 'summer',
      'ete': 'summer',
      'toute-saisons': 'all',
      'toute': 'all',
      'all': 'all'
    };
    
    // Handle compound seasons
    if (season.includes('-')) {
      const parts = season.split('-');
      return parts.map(part => seasonMap[part.trim()] || part.trim()).join(',');
    }
    
    return seasonMap[season.toLowerCase()] || 'all';
  }

  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  }

  // Grocery Lists
  async createGroceryList(listData: InsertGroceryList): Promise<GroceryList> {
    const [list] = await db
      .insert(groceryLists)
      .values(listData)
      .returning();
    return list;
  }

  async getGroceryLists(userId: number): Promise<GroceryList[]> {
    return await db
      .select()
      .from(groceryLists)
      .where(eq(groceryLists.userId, userId))
      .orderBy(groceryLists.createdAt);
  }

  async getGroceryList(id: number): Promise<GroceryList | undefined> {
    const [list] = await db.select().from(groceryLists).where(eq(groceryLists.id, id));
    return list;
  }

  async updateGroceryList(id: number, updates: Partial<GroceryList>): Promise<GroceryList | undefined> {
    const [list] = await db
      .update(groceryLists)
      .set(updates)
      .where(eq(groceryLists.id, id))
      .returning();
    return list;
  }

  // Food Items
  async getFoodItems(): Promise<FoodItem[]> {
    return await db.select().from(foodItems);
  }

  async getFoodItem(id: number): Promise<FoodItem | undefined> {
    const [item] = await db.select().from(foodItems).where(eq(foodItems.id, id));
    return item;
  }

  async createFoodItem(itemData: InsertFoodItem): Promise<FoodItem> {
    const [item] = await db
      .insert(foodItems)
      .values(itemData)
      .returning();
    return item;
  }

  // List Items
  async addItemToList(itemData: InsertListItem): Promise<ListItem> {
    const [item] = await db
      .insert(listItems)
      .values(itemData)
      .returning();
    return item;
  }

  async getListItems(listId: number): Promise<ListItem[]> {
    return await db
      .select()
      .from(listItems)
      .where(eq(listItems.listId, listId));
  }

  async removeItemFromList(id: number): Promise<boolean> {
    const result = await db
      .delete(listItems)
      .where(eq(listItems.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Meals
  async createMeal(mealData: InsertMeal): Promise<Meal> {
    const [meal] = await db
      .insert(meals)
      .values(mealData)
      .returning();

    // Update meal count in grocery list
    await db
      .update(groceryLists)
      .set({ 
        mealCount: db.$count(meals, eq(meals.listId, mealData.listId))
      })
      .where(eq(groceryLists.id, mealData.listId));

    return meal;
  }

  async getMeals(listId: number): Promise<Meal[]> {
    return await db
      .select()
      .from(meals)
      .where(eq(meals.listId, listId));
  }

  async updateMeal(id: number, updates: any): Promise<Meal | undefined> {
    // Convert ISO string to Date object if completedAt is provided
    if (updates.completedAt && typeof updates.completedAt === 'string') {
      updates.completedAt = new Date(updates.completedAt);
    }
    
    const [meal] = await db
      .update(meals)
      .set(updates)
      .where(eq(meals.id, id))
      .returning();
    return meal;
  }

  async deleteMeal(id: number): Promise<boolean> {
    const result = await db
      .delete(meals)
      .where(eq(meals.id, id));
    return (result.rowCount || 0) > 0;
  }

  async addIngredientToMeal(mealId: number, ingredient: { foodItemId: number; quantity: number; unit: string }): Promise<Meal | undefined> {
    try {
      // Get current meal
      const [meal] = await db.select().from(meals).where(eq(meals.id, mealId));
      if (!meal) return undefined;

      // Get food item for nutrition calculations
      const [foodItem] = await db.select().from(foodItems).where(eq(foodItems.id, ingredient.foodItemId));
      if (!foodItem) return undefined;

      // Update ingredients array
      const currentIngredients = meal.ingredients as any[] || [];
      const newIngredient = {
        foodItemId: ingredient.foodItemId,
        quantity: ingredient.quantity,
        unit: ingredient.unit,
        foodItem: foodItem // Include food item data for display
      };
      const updatedIngredients = [...currentIngredients, newIngredient];

      // Calculate new nutrition totals
      const nutrition = foodItem.nutrition as any;
      const multiplier = ingredient.unit === "kg" ? ingredient.quantity : ingredient.quantity / 1000;
      
      const additionalCalories = Math.round((nutrition.calories || 0) * multiplier);
      const additionalProtein = Math.round((nutrition.protein || 0) * multiplier);
      const additionalFat = Math.round((nutrition.fat || 0) * multiplier);
      const additionalCarbs = Math.round((nutrition.carbs || 0) * multiplier);

      // Update meal with new totals and ingredients
      const [updatedMeal] = await db
        .update(meals)
        .set({
          ingredients: updatedIngredients,
          calories: meal.calories + additionalCalories,
          protein: meal.protein + additionalProtein,
          fat: meal.fat + additionalFat,
          carbs: meal.carbs + additionalCarbs,
        })
        .where(eq(meals.id, mealId))
        .returning();

      return updatedMeal;
    } catch (error) {
      console.error("Error adding ingredient to meal:", error);
      return undefined;
    }
  }

  // Nutrition Logs
  async createNutritionLog(logData: InsertNutritionLog): Promise<NutritionLog> {
    const [log] = await db
      .insert(nutritionLogs)
      .values(logData)
      .returning();
    return log;
  }

  async getNutritionLogs(userId: number, days: number = 30): Promise<NutritionLog[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const logs = await db
      .select()
      .from(nutritionLogs)
      .where(eq(nutritionLogs.userId, userId))
      .orderBy(nutritionLogs.date);
    
    return logs;
  }

  async updateTodayNutritionLog(userId: number, updates: Partial<NutritionLog>): Promise<NutritionLog> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Calculate actual totals from completed meals today
    const completedMealsToday = await db
      .select()
      .from(meals)
      .innerJoin(groceryLists, eq(meals.listId, groceryLists.id))
      .where(
        and(
          eq(groceryLists.userId, userId),
          eq(meals.completed, true),
          gte(meals.completedAt, today)
        )
      );
    
    const actualTotals = completedMealsToday.reduce((acc, { meals: meal }) => ({
      totalCalories: acc.totalCalories + (meal.calories || 0),
      totalProtein: acc.totalProtein + (meal.protein || 0),
      totalFat: acc.totalFat + (meal.fat || 0),
      totalCarbs: acc.totalCarbs + (meal.carbs || 0),
      mealsCompleted: acc.mealsCompleted + 1,
    }), {
      totalCalories: 0,
      totalProtein: 0,
      totalFat: 0,
      totalCarbs: 0,
      mealsCompleted: 0,
    });
    
    // Try to find existing log for today
    const [existingLog] = await db
      .select()
      .from(nutritionLogs)
      .where(
        and(
          eq(nutritionLogs.userId, userId),
          eq(nutritionLogs.date, today)
        )
      )
      .limit(1);
    
    if (existingLog) {
      // Update with actual calculated totals
      const [updatedLog] = await db
        .update(nutritionLogs)
        .set({
          totalCalories: actualTotals.totalCalories,
          totalProtein: actualTotals.totalProtein,
          totalFat: actualTotals.totalFat,
          totalCarbs: actualTotals.totalCarbs,
          mealsCompleted: actualTotals.mealsCompleted,
          targetCalories: updates.targetCalories || existingLog.targetCalories,
        })
        .where(eq(nutritionLogs.id, existingLog.id))
        .returning();
      return updatedLog;
    } else {
      // Create new log for today with actual totals
      const [newLog] = await db
        .insert(nutritionLogs)
        .values({
          userId,
          date: today,
          totalCalories: actualTotals.totalCalories,
          totalProtein: actualTotals.totalProtein,
          totalFat: actualTotals.totalFat,
          totalCarbs: actualTotals.totalCarbs,
          targetCalories: updates.targetCalories || 2000,
          mealsCompleted: actualTotals.mealsCompleted,
        })
        .returning();
      return newLog;
    }
  }
}

export const storage = new DatabaseStorage();

// Initialize food items and sample nutrition data on startup
storage.initializeFoodItems().catch(console.error);

// Create sample nutrition logs for testing
async function createSampleNutritionLogs() {
  try {
    // Check if we already have nutrition logs
    const existingLogs = await storage.getNutritionLogs(2, 7); // User ID 2
    if (existingLogs.length > 0) return;

    // Create sample data for the last 7 days
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const targetCalories = 2200;
      const consumed = 1800 + Math.random() * 600; // Random between 1800-2400
      const protein = 80 + Math.random() * 40; // Random between 80-120g
      const fat = 60 + Math.random() * 30; // Random between 60-90g
      const carbs = 200 + Math.random() * 100; // Random between 200-300g
      const meals = Math.floor(2 + Math.random() * 3); // 2-4 meals

      await storage.createNutritionLog({
        userId: 2,
        date,
        totalCalories: Math.round(consumed),
        totalProtein: Math.round(protein),
        totalFat: Math.round(fat),
        totalCarbs: Math.round(carbs),
        targetCalories,
        mealsCompleted: meals,
      });
    }
    console.log("Sample nutrition logs created");
  } catch (error) {
    console.error("Error creating sample nutrition logs:", error);
  }
}

// Initialize sample data with a delay to ensure user exists
setTimeout(createSampleNutritionLogs, 2000);
