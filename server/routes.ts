import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertGroceryListSchema, insertListItemSchema, insertMealSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Grocery Lists
  app.get("/api/grocery-lists", async (req, res) => {
    try {
      const lists = await storage.getGroceryLists();
      res.json(lists);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch grocery lists" });
    }
  });

  app.post("/api/grocery-lists", async (req, res) => {
    try {
      const validatedData = insertGroceryListSchema.parse(req.body);
      const list = await storage.createGroceryList(validatedData);
      res.json(list);
    } catch (error) {
      res.status(400).json({ message: "Invalid grocery list data" });
    }
  });

  app.get("/api/grocery-lists/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const list = await storage.getGroceryList(id);
      if (!list) {
        return res.status(404).json({ message: "Grocery list not found" });
      }
      res.json(list);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch grocery list" });
    }
  });

  // Food Items
  app.get("/api/food-items", async (req, res) => {
    try {
      const items = await storage.getFoodItems();
      const { season, category } = req.query;
      
      let filteredItems = items;
      
      if (season && season !== "all") {
        filteredItems = filteredItems.filter(item => 
          item.season === season || item.season === "all"
        );
      }
      
      if (category) {
        filteredItems = filteredItems.filter(item => item.category === category);
      }
      
      res.json(filteredItems);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch food items" });
    }
  });

  app.get("/api/food-items/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const item = await storage.getFoodItem(id);
      if (!item) {
        return res.status(404).json({ message: "Food item not found" });
      }
      res.json(item);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch food item" });
    }
  });

  // List Items
  app.post("/api/list-items", async (req, res) => {
    try {
      const validatedData = insertListItemSchema.parse(req.body);
      const item = await storage.addItemToList(validatedData);
      res.json(item);
    } catch (error) {
      res.status(400).json({ message: "Invalid list item data" });
    }
  });

  app.get("/api/grocery-lists/:listId/items", async (req, res) => {
    try {
      const listId = parseInt(req.params.listId);
      const items = await storage.getListItems(listId);
      
      // Enrich with food item details
      const enrichedItems = await Promise.all(
        items.map(async (item) => {
          const foodItem = await storage.getFoodItem(item.foodItemId);
          return { ...item, foodItem };
        })
      );
      
      res.json(enrichedItems);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch list items" });
    }
  });

  // Meals
  app.post("/api/meals", async (req, res) => {
    try {
      const validatedData = insertMealSchema.parse(req.body);
      const meal = await storage.createMeal(validatedData);
      res.json(meal);
    } catch (error) {
      res.status(400).json({ message: "Invalid meal data" });
    }
  });

  app.get("/api/grocery-lists/:listId/meals", async (req, res) => {
    try {
      const listId = parseInt(req.params.listId);
      const meals = await storage.getMeals(listId);
      
      // Enrich with food item details for ingredients
      const enrichedMeals = await Promise.all(
        meals.map(async (meal) => {
          const enrichedIngredients = await Promise.all(
            (meal.ingredients as any[]).map(async (ingredient) => {
              const foodItem = await storage.getFoodItem(ingredient.foodItemId);
              return { ...ingredient, foodItem };
            })
          );
          return { ...meal, ingredients: enrichedIngredients };
        })
      );
      
      res.json(enrichedMeals);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch meals" });
    }
  });

  app.patch("/api/meals/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const meal = await storage.updateMeal(id, req.body);
      if (!meal) {
        return res.status(404).json({ message: "Meal not found" });
      }
      res.json(meal);
    } catch (error) {
      res.status(500).json({ message: "Failed to update meal" });
    }
  });

  app.delete("/api/meals/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteMeal(id);
      if (!deleted) {
        return res.status(404).json({ message: "Meal not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete meal" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
