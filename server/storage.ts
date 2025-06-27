import { 
  users,
  groceryLists, 
  foodItems, 
  listItems, 
  meals,
  nutritionLogs,
  weightEntries,
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
  type InsertNutritionLog,
  type WeightEntry,
  type InsertWeightEntry
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, inArray, desc } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { sql } from "drizzle-orm";

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
  getFoodItemsByIds(ids: number[]): Promise<FoodItem[]>;
  createFoodItem(item: InsertFoodItem): Promise<FoodItem>;
  
  // List Items
  addItemToList(item: InsertListItem): Promise<ListItem>;
  getListItems(listId: number): Promise<ListItem[]>;
  removeItemFromList(id: number): Promise<boolean>;
  
  // Meals
  createMeal(meal: InsertMeal): Promise<Meal>;
  getMeals(listId: number): Promise<Meal[]>;
  updateMeal(id: number, updates: any): Promise<Meal | undefined>;
  deleteMeal(id: number): Promise<boolean>;
  addIngredientToMeal(mealId: number, ingredient: { foodItemId: number; quantity: number; unit: string }): Promise<Meal | undefined>;
  duplicateMeal(id: number): Promise<Meal | undefined>;
  
  // Nutrition Logs
  createNutritionLog(log: InsertNutritionLog): Promise<NutritionLog>;
  getNutritionLogs(userId: number, days?: number): Promise<NutritionLog[]>;
  updateTodayNutritionLog(userId: number, updates: Partial<NutritionLog>): Promise<NutritionLog>;
  
  // Weight Tracking
  addWeightEntry(entry: InsertWeightEntry): Promise<WeightEntry>;
  getWeightHistory(userId: number): Promise<WeightEntry[]>;
  getCurrentWeight(userId: number): Promise<WeightEntry | undefined>;
  updateWeightEntry(id: number, updates: Partial<WeightEntry>): Promise<WeightEntry | undefined>;
  deleteWeightEntry(id: number): Promise<boolean>;
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
    console.log(`Recherche de l'utilisateur avec l'email: ${email}`);
    
    // Récupérer tous les utilisateurs pour le débogage
    const allUsers = await db.select().from(users);
    console.log(`Nombre total d'utilisateurs dans la base de données: ${allUsers.length}`);
    console.log(`Liste des emails dans la base de données:`, allUsers.map(u => u.email));
    
    const [user] = await db.select().from(users).where(eq(users.email, email));
    
    if (user) {
      console.log(`Utilisateur trouvé: ${user.id} (${user.email})`);
    } else {
      console.log(`Aucun utilisateur trouvé avec l'email: ${email}`);
    }
    
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
    console.log(`Tentative de connexion pour l'email: ${email}`);
    
    const user = await this.getUserByEmail(email);
    if (!user) {
      console.log(`Aucun utilisateur trouvé avec l'email: ${email}`);
      return null;
    }
    
    console.log(`Utilisateur trouvé avec l'ID: ${user.id}`);
    console.log(`Comparaison du mot de passe fourni avec le hash stocké`);
    
    try {
      const isValid = await bcrypt.compare(password, user.password);
      console.log(`Résultat de la comparaison: ${isValid ? 'Valide' : 'Invalide'}`);
      return isValid ? user : null;
    } catch (error) {
      console.error(`Erreur lors de la comparaison du mot de passe:`, error);
      return null;
    }
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
      const averageWeight = parseFloat(columns[8]) || 0; 
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
          fat,
          averageWeight 
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
  
  async getFoodItemsByIds(ids: number[]): Promise<FoodItem[]> {
    if (ids.length === 0) return [];
    
    return await db
      .select()
      .from(foodItems)
      .where(
        // Utiliser la clause "in" pour récupérer tous les aliments dont l'ID est dans la liste
        inArray(foodItems.id, ids)
      );
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
    // Filtrer les champs valides pour éviter les erreurs SQL
    const validFields = ['name', 'calories', 'protein', 'fat', 'carbs', 'completed', 'completedAt', 'ingredients'];
    
    // Créer un nouvel objet avec uniquement les champs valides
    const filteredUpdates: any = {};
    for (const field of validFields) {
      if (updates[field] !== undefined) {
        filteredUpdates[field] = updates[field];
      }
    }
    
    // Gestion spéciale pour completedAt
    if (updates.completed !== undefined) {
      if (updates.completed === true && !updates.completedAt) {
        // Si le repas est marqué comme complété et qu'aucune date n'est fournie, utiliser la date actuelle
        filteredUpdates.completedAt = new Date();
      } else if (updates.completed === false) {
        // Si le repas est marqué comme non complété, effacer la date de complétion
        filteredUpdates.completedAt = null;
      }
    }
    
    // Si completedAt est une chaîne, la convertir en Date
    if (filteredUpdates.completedAt && typeof filteredUpdates.completedAt === 'string') {
      filteredUpdates.completedAt = new Date(filteredUpdates.completedAt);
    }
    
    console.log("Filtered updates:", filteredUpdates);
    
    const [meal] = await db
      .update(meals)
      .set(filteredUpdates)
      .where(eq(meals.id, id))
      .returning();
    return meal;
  }

  async deleteMeal(id: number): Promise<boolean> {
    try {
      // Récupérer le repas pour connaître sa liste associée avant de le supprimer
      const [meal] = await db
        .select()
        .from(meals)
        .where(eq(meals.id, id));
      
      if (!meal) {
        return false;
      }
      
      const listId = meal.listId;
      
      // Supprimer le repas
      const result = await db
        .delete(meals)
        .where(eq(meals.id, id));
      
      if ((result.rowCount || 0) > 0) {
        try {
          // Mettre à jour le compteur de repas dans la liste
          console.log(`[deleteMeal] Updating meal count for list ${listId}`);
          
          // Compter les repas restants dans la liste
          const mealsList = await db
            .select()
            .from(meals)
            .where(eq(meals.listId, listId));
          
          const mealCount = mealsList.length;
          console.log(`[deleteMeal] Counted ${mealCount} meals for list ${listId}`);
          
          // Mettre à jour le compteur dans la liste
          const [updatedList] = await db
            .update(groceryLists)
            .set({ mealCount })
            .where(eq(groceryLists.id, listId))
            .returning();
          
          console.log(`[deleteMeal] Updated list ${listId} with meal count ${updatedList.mealCount}`);
        } catch (updateError) {
          // Ne pas faire échouer la suppression si la mise à jour du compteur échoue
          console.error("[deleteMeal] Error updating meal count:", updateError);
        }
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("[deleteMeal] Error deleting meal:", error);
      return false;
    }
  }

  async addIngredientToMeal(mealId: number, ingredient: { foodItemId: number; quantity: number; unit: string }): Promise<Meal | undefined> {
    try {
      // Get current meal
      const [meal] = await db.select().from(meals).where(eq(meals.id, mealId));
      if (!meal) return undefined;

      // Get food item for nutrition calculations
      const [foodItem] = await db.select().from(foodItems).where(eq(foodItems.id, ingredient.foodItemId));
      if (!foodItem) return undefined;

      console.log(`[addIngredientToMeal] Adding ${ingredient.quantity} ${ingredient.unit} of ${foodItem.name} (ID: ${foodItem.id})`);

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
      console.log(`[addIngredientToMeal] Food item nutrition:`, JSON.stringify(nutrition));
      
      // Calcul du multiplicateur en fonction de l'unité
      let multiplier;
      if (ingredient.unit === "kg") {
        multiplier = ingredient.quantity;
        console.log(`[addIngredientToMeal] Unit is kg, multiplier = ${multiplier}`);
      } else if (ingredient.unit === "pieces") {
        // Récupérer le poids moyen de l'aliment et calculer le multiplicateur
        const averageWeight = nutrition.averageWeight || 0; // en grammes
        multiplier = (ingredient.quantity * averageWeight) / 1000; // convertir en kg
        console.log(`[addIngredientToMeal] Unit is pieces, averageWeight = ${averageWeight}g, multiplier = ${multiplier}`);
      } else {
        // Par défaut, on considère que c'est en grammes
        multiplier = ingredient.quantity / 1000;
        console.log(`[addIngredientToMeal] Unit is grams, multiplier = ${multiplier}`);
      }
      
      const additionalCalories = Math.round((nutrition.calories || 0) * multiplier);
      const additionalProtein = Math.round((nutrition.protein || 0) * multiplier);
      const additionalFat = Math.round((nutrition.fat || 0) * multiplier);
      const additionalCarbs = Math.round((nutrition.carbs || 0) * multiplier);

      console.log(`[addIngredientToMeal] Additional macros: calories=${additionalCalories}, protein=${additionalProtein}, fat=${additionalFat}, carbs=${additionalCarbs}`);
      console.log(`[addIngredientToMeal] Current meal macros: calories=${meal.calories}, protein=${meal.protein}, fat=${meal.fat}, carbs=${meal.carbs}`);
      
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

  async duplicateMeal(id: number): Promise<Meal | undefined> {
    try {
      console.log(`[duplicateMeal] Starting duplication of meal ${id}`);
      
      // Récupérer le repas à dupliquer
      const [originalMeal] = await db
        .select()
        .from(meals)
        .where(eq(meals.id, id));
      
      if (!originalMeal) {
        console.log(`[duplicateMeal] Meal ${id} not found`);
        return undefined;
      }
      
      console.log(`[duplicateMeal] Found original meal: ${originalMeal.name}`);
      
      // Créer une copie du repas
      const [duplicatedMeal] = await db
        .insert(meals)
        .values({
          listId: originalMeal.listId,
          name: originalMeal.name,
          calories: originalMeal.calories,
          protein: originalMeal.protein,
          fat: originalMeal.fat,
          carbs: originalMeal.carbs,
          completed: false, // Le repas dupliqué n'est pas complété
          completedAt: null, // Pas de date de complétion
          ingredients: originalMeal.ingredients,
          createdAt: new Date()
        })
        .returning();
      
      console.log(`[duplicateMeal] Created duplicated meal: ${duplicatedMeal.id}`);
      
      try {
        // Mettre à jour le compteur de repas dans la liste
        const listId = originalMeal.listId;
        
        console.log(`[duplicateMeal] Updating meal count for list ${listId}`);
        
        // Méthode alternative pour compter les repas
        const mealsList = await db
          .select()
          .from(meals)
          .where(eq(meals.listId, listId));
        
        const mealCount = mealsList.length;
        console.log(`[duplicateMeal] Counted ${mealCount} meals for list ${listId}`);
        
        // Mettre à jour le compteur dans la liste
        const [updatedList] = await db
          .update(groceryLists)
          .set({ mealCount })
          .where(eq(groceryLists.id, listId))
          .returning();
        
        console.log(`[duplicateMeal] Updated list ${listId} with meal count ${updatedList.mealCount}`);
      } catch (updateError) {
        // Ne pas faire échouer la duplication si la mise à jour du compteur échoue
        console.error("[duplicateMeal] Error updating meal count:", updateError);
      }
      
      return duplicatedMeal;
    } catch (error) {
      console.error("[duplicateMeal] Error duplicating meal:", error);
      return undefined;
    }
  }

  // Nutrition Logs
  async createNutritionLog(log: InsertNutritionLog): Promise<NutritionLog> {
    const [newLog] = await db
      .insert(nutritionLogs)
      .values(log)
      .returning();
    return newLog;
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

  // Weight Entries
  async addWeightEntry(entry: InsertWeightEntry): Promise<WeightEntry> {
    const [newEntry] = await db.insert(weightEntries).values(entry).returning();
    return newEntry;
  }

  async getWeightHistory(userId: number): Promise<WeightEntry[]> {
    return db
      .select()
      .from(weightEntries)
      .where(eq(weightEntries.userId, userId))
      .orderBy(desc(weightEntries.date));
  }

  async getCurrentWeight(userId: number): Promise<WeightEntry | undefined> {
    const [entry] = await db
      .select()
      .from(weightEntries)
      .where(eq(weightEntries.userId, userId))
      .orderBy(desc(weightEntries.date))
      .limit(1);
    return entry;
  }

  async updateWeightEntry(id: number, updates: Partial<WeightEntry>): Promise<WeightEntry | undefined> {
    const [updated] = await db
      .update(weightEntries)
      .set(updates)
      .where(eq(weightEntries.id, id))
      .returning();
    return updated;
  }

  async deleteWeightEntry(id: number): Promise<boolean> {
    const [deleted] = await db
      .delete(weightEntries)
      .where(eq(weightEntries.id, id))
      .returning({ id: weightEntries.id });
    return !!deleted;
  }
}

export const storage = new DatabaseStorage();

// Initialize food items on startup
storage.initializeFoodItems().catch(console.error);
