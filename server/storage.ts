import { 
  users,
  groceryLists, 
  foodItems, 
  listItems, 
  meals,
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
  type InsertMeal
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
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

  // Initialize food items in database
  async initializeFoodItems() {
    const existingItems = await db.select().from(foodItems);
    if (existingItems.length > 0) return; // Already initialized

    const initialFoodItems: InsertFoodItem[] = [
      // Vegetables
      { name: "Carottes", emoji: "🥕", category: "vegetables", season: "autumn", nutrition: { calories: 41, carbs: 9.6, protein: 0.9, fat: 0.2, vitaminA: 835 } },
      { name: "Brocolis", emoji: "🥦", category: "vegetables", season: "winter", nutrition: { calories: 34, carbs: 7, protein: 2.8, fat: 0.4, vitaminC: 89 } },
      { name: "Tomates", emoji: "🍅", category: "vegetables", season: "summer", nutrition: { calories: 18, carbs: 3.9, protein: 0.9, fat: 0.2, vitaminC: 14 } },
      { name: "Épinards", emoji: "🥬", category: "vegetables", season: "spring", nutrition: { calories: 23, carbs: 3.6, protein: 2.9, fat: 0.4, iron: 2.7 } },
      { name: "Courgettes", emoji: "🥒", category: "vegetables", season: "summer", nutrition: { calories: 17, carbs: 3.1, protein: 1.2, fat: 0.3, vitaminC: 17 } },
      { name: "Poivrons", emoji: "🫑", category: "vegetables", season: "summer", nutrition: { calories: 31, carbs: 7, protein: 1, fat: 0.3, vitaminC: 190 } },
      
      // Fruits
      { name: "Bananes", emoji: "🍌", category: "fruits", season: "all", nutrition: { calories: 89, carbs: 23, protein: 1.1, fat: 0.3, potassium: 358 } },
      { name: "Fraises", emoji: "🍓", category: "fruits", season: "spring", nutrition: { calories: 32, carbs: 7.7, protein: 0.7, fat: 0.3, vitaminC: 59 } },
      { name: "Pommes", emoji: "🍎", category: "fruits", season: "autumn", nutrition: { calories: 52, carbs: 14, protein: 0.3, fat: 0.2, fiber: 2.4 } },
      { name: "Oranges", emoji: "🍊", category: "fruits", season: "winter", nutrition: { calories: 47, carbs: 12, protein: 0.9, fat: 0.1, vitaminC: 53 } },
      
      // Proteins
      { name: "Saumon", emoji: "🐟", category: "proteins", season: "all", nutrition: { calories: 208, carbs: 0, protein: 20, fat: 13, omega3: 2.3 } },
      { name: "Œufs", emoji: "🥚", category: "proteins", season: "all", nutrition: { calories: 155, carbs: 1.1, protein: 13, fat: 11, vitaminB12: 0.9 } },
      { name: "Poulet", emoji: "🐔", category: "proteins", season: "all", nutrition: { calories: 165, carbs: 0, protein: 31, fat: 3.6, niacin: 8.5 } },
      { name: "Bœuf", emoji: "🥩", category: "proteins", season: "all", nutrition: { calories: 250, carbs: 0, protein: 26, fat: 15, iron: 2.6 } },
      
      // Starches
      { name: "Riz", emoji: "🍚", category: "starches", season: "all", nutrition: { calories: 130, carbs: 28, protein: 2.7, fat: 0.3, fiber: 0.4 } },
      { name: "Pommes de terre", emoji: "🥔", category: "starches", season: "autumn", nutrition: { calories: 77, carbs: 17, protein: 2, fat: 0.1, vitaminC: 20 } },
      { name: "Pâtes", emoji: "🍝", category: "starches", season: "all", nutrition: { calories: 131, carbs: 25, protein: 5, fat: 1.1, fiber: 1.8 } },
      { name: "Quinoa", emoji: "🌾", category: "starches", season: "all", nutrition: { calories: 120, carbs: 22, protein: 4.4, fat: 1.9, fiber: 2.8 } },
    ];

    await db.insert(foodItems).values(initialFoodItems);
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
    return result.rowCount > 0;
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

  async updateMeal(id: number, updates: Partial<Meal>): Promise<Meal | undefined> {
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
    return result.rowCount > 0;
  }
}

export const storage = new DatabaseStorage();

// Initialize food items on startup
storage.initializeFoodItems().catch(console.error);
