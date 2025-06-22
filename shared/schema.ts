import { pgTable, text, serial, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const groceryLists = pgTable("grocery_lists", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: text("created_at").notNull(),
  mealCount: integer("meal_count").notNull().default(0),
  status: text("status").notNull().default("active"), // "active" | "completed"
});

export const foodItems = pgTable("food_items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  emoji: text("emoji").notNull(),
  category: text("category").notNull(), // "vegetables" | "fruits" | "proteins" | "starches"
  season: text("season").notNull(), // "spring" | "summer" | "autumn" | "winter" | "all"
  nutrition: jsonb("nutrition").notNull(), // { calories, carbs, protein, fat, vitamins }
});

export const listItems = pgTable("list_items", {
  id: serial("id").primaryKey(),
  listId: integer("list_id").notNull(),
  foodItemId: integer("food_item_id").notNull(),
  quantity: integer("quantity").notNull(),
  unit: text("unit").notNull(), // "kg" | "g" | "pieces"
});

export const meals = pgTable("meals", {
  id: serial("id").primaryKey(),
  listId: integer("list_id").notNull(),
  name: text("name").notNull(),
  completed: boolean("completed").notNull().default(false),
  ingredients: jsonb("ingredients").notNull(), // Array of { foodItemId, quantity, unit }
});

export const insertGroceryListSchema = createInsertSchema(groceryLists).omit({
  id: true,
});

export const insertFoodItemSchema = createInsertSchema(foodItems).omit({
  id: true,
});

export const insertListItemSchema = createInsertSchema(listItems).omit({
  id: true,
});

export const insertMealSchema = createInsertSchema(meals).omit({
  id: true,
});

export type GroceryList = typeof groceryLists.$inferSelect;
export type InsertGroceryList = z.infer<typeof insertGroceryListSchema>;

export type FoodItem = typeof foodItems.$inferSelect;
export type InsertFoodItem = z.infer<typeof insertFoodItemSchema>;

export type ListItem = typeof listItems.$inferSelect;
export type InsertListItem = z.infer<typeof insertListItemSchema>;

export type Meal = typeof meals.$inferSelect;
export type InsertMeal = z.infer<typeof insertMealSchema>;
