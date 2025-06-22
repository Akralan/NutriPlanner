import { 
  groceryLists, 
  foodItems, 
  listItems, 
  meals,
  type GroceryList, 
  type InsertGroceryList,
  type FoodItem,
  type InsertFoodItem,
  type ListItem,
  type InsertListItem,
  type Meal,
  type InsertMeal
} from "@shared/schema";

export interface IStorage {
  // Grocery Lists
  createGroceryList(list: InsertGroceryList): Promise<GroceryList>;
  getGroceryLists(): Promise<GroceryList[]>;
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

export class MemStorage implements IStorage {
  private groceryLists: Map<number, GroceryList>;
  private foodItems: Map<number, FoodItem>;
  private listItems: Map<number, ListItem>;
  private meals: Map<number, Meal>;
  private currentListId: number;
  private currentFoodId: number;
  private currentListItemId: number;
  private currentMealId: number;

  constructor() {
    this.groceryLists = new Map();
    this.foodItems = new Map();
    this.listItems = new Map();
    this.meals = new Map();
    this.currentListId = 1;
    this.currentFoodId = 1;
    this.currentListItemId = 1;
    this.currentMealId = 1;
    
    this.initializeFoodItems();
  }

  private initializeFoodItems() {
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

    initialFoodItems.forEach(item => {
      this.createFoodItem(item);
    });
  }

  async createGroceryList(insertList: InsertGroceryList): Promise<GroceryList> {
    const id = this.currentListId++;
    const list: GroceryList = { ...insertList, id };
    this.groceryLists.set(id, list);
    return list;
  }

  async getGroceryLists(): Promise<GroceryList[]> {
    return Array.from(this.groceryLists.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getGroceryList(id: number): Promise<GroceryList | undefined> {
    return this.groceryLists.get(id);
  }

  async updateGroceryList(id: number, updates: Partial<GroceryList>): Promise<GroceryList | undefined> {
    const list = this.groceryLists.get(id);
    if (!list) return undefined;
    
    const updatedList = { ...list, ...updates };
    this.groceryLists.set(id, updatedList);
    return updatedList;
  }

  async getFoodItems(): Promise<FoodItem[]> {
    return Array.from(this.foodItems.values());
  }

  async getFoodItem(id: number): Promise<FoodItem | undefined> {
    return this.foodItems.get(id);
  }

  async createFoodItem(insertItem: InsertFoodItem): Promise<FoodItem> {
    const id = this.currentFoodId++;
    const item: FoodItem = { ...insertItem, id };
    this.foodItems.set(id, item);
    return item;
  }

  async addItemToList(insertItem: InsertListItem): Promise<ListItem> {
    const id = this.currentListItemId++;
    const item: ListItem = { ...insertItem, id };
    this.listItems.set(id, item);
    return item;
  }

  async getListItems(listId: number): Promise<ListItem[]> {
    return Array.from(this.listItems.values()).filter(item => item.listId === listId);
  }

  async removeItemFromList(id: number): Promise<boolean> {
    return this.listItems.delete(id);
  }

  async createMeal(insertMeal: InsertMeal): Promise<Meal> {
    const id = this.currentMealId++;
    const meal: Meal = { ...insertMeal, id };
    this.meals.set(id, meal);
    
    // Update meal count in grocery list
    const list = this.groceryLists.get(insertMeal.listId);
    if (list) {
      this.updateGroceryList(insertMeal.listId, { mealCount: list.mealCount + 1 });
    }
    
    return meal;
  }

  async getMeals(listId: number): Promise<Meal[]> {
    return Array.from(this.meals.values()).filter(meal => meal.listId === listId);
  }

  async updateMeal(id: number, updates: Partial<Meal>): Promise<Meal | undefined> {
    const meal = this.meals.get(id);
    if (!meal) return undefined;
    
    const updatedMeal = { ...meal, ...updates };
    this.meals.set(id, updatedMeal);
    return updatedMeal;
  }

  async deleteMeal(id: number): Promise<boolean> {
    const meal = this.meals.get(id);
    if (!meal) return false;
    
    // Update meal count in grocery list
    const list = this.groceryLists.get(meal.listId);
    if (list) {
      this.updateGroceryList(meal.listId, { mealCount: Math.max(0, list.mealCount - 1) });
    }
    
    return this.meals.delete(id);
  }
}

export const storage = new MemStorage();
