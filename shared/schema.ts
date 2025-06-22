import { pgTable, text, serial, integer, boolean, jsonb, varchar, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// User tables
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  firstName: varchar("first_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),
  height: real("height"), // in cm
  weight: real("weight"), // in kg
  weeklyWorkouts: integer("weekly_workouts").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const sessions = pgTable("sessions", {
  sid: varchar("sid").primaryKey(),
  sess: jsonb("sess").notNull(),
  expire: timestamp("expire").notNull(),
});

export const groceryLists = pgTable("grocery_lists", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
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

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  groceryLists: many(groceryLists),
}));

export const groceryListsRelations = relations(groceryLists, ({ one, many }) => ({
  user: one(users, {
    fields: [groceryLists.userId],
    references: [users.id],
  }),
  listItems: many(listItems),
  meals: many(meals),
}));

export const listItemsRelations = relations(listItems, ({ one }) => ({
  groceryList: one(groceryLists, {
    fields: [listItems.listId],
    references: [groceryLists.id],
  }),
  foodItem: one(foodItems, {
    fields: [listItems.foodItemId],
    references: [foodItems.id],
  }),
}));

export const mealsRelations = relations(meals, ({ one }) => ({
  groceryList: one(groceryLists, {
    fields: [meals.listId],
    references: [groceryLists.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  email: z.string().email("Email invalide"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
  firstName: z.string().min(1, "Le prénom est requis").optional(),
  lastName: z.string().min(1, "Le nom est requis").optional(),
  height: z.number().min(100).max(250).optional(),
  weight: z.number().min(30).max(300).optional(),
  weeklyWorkouts: z.number().min(0).max(20).optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(1, "Le mot de passe est requis"),
});

export const updateProfileSchema = createInsertSchema(users).omit({
  id: true,
  email: true,
  password: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  firstName: z.string().min(1, "Le prénom est requis").optional(),
  lastName: z.string().min(1, "Le nom est requis").optional(),
  height: z.number().min(100).max(250).optional(),
  weight: z.number().min(30).max(300).optional(),
  weeklyWorkouts: z.number().min(0).max(20).optional(),
});

export const insertGroceryListSchema = createInsertSchema(groceryLists).omit({
  id: true,
  createdAt: true,
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

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginData = z.infer<typeof loginSchema>;
export type UpdateProfile = z.infer<typeof updateProfileSchema>;

export type GroceryList = typeof groceryLists.$inferSelect;
export type InsertGroceryList = z.infer<typeof insertGroceryListSchema>;

export type FoodItem = typeof foodItems.$inferSelect;
export type InsertFoodItem = z.infer<typeof insertFoodItemSchema>;

export type ListItem = typeof listItems.$inferSelect;
export type InsertListItem = z.infer<typeof insertListItemSchema>;

export type Meal = typeof meals.$inferSelect;
export type InsertMeal = z.infer<typeof insertMealSchema>;
