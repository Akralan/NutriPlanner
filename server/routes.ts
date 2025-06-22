import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertGroceryListSchema, insertListItemSchema, insertMealSchema, insertUserSchema, loginSchema, updateProfileSchema } from "@shared/schema";
import { setupSession, requireAuth } from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup session middleware
  app.use(setupSession());

  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ message: "Un utilisateur avec cet email existe déjà" });
      }

      const user = await storage.createUser(validatedData);
      req.session.userId = user.id;
      
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(400).json({ message: "Données d'inscription invalides" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const validatedData = loginSchema.parse(req.body);
      const user = await storage.validateUser(validatedData.email, validatedData.password);
      
      if (!user) {
        return res.status(401).json({ message: "Email ou mot de passe invalide" });
      }

      req.session.userId = user.id;
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(400).json({ message: "Données de connexion invalides" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Erreur lors de la déconnexion" });
      }
      res.json({ message: "Déconnexion réussie" });
    });
  });

  app.get("/api/auth/user", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "Session invalide" });
      }
      
      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(401).json({ message: "Utilisateur non trouvé" });
      }
      
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération du profil" });
    }
  });

  app.put("/api/auth/profile", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "Session invalide" });
      }
      
      const validatedData = updateProfileSchema.parse(req.body);
      const user = await storage.updateUser(userId, validatedData);
      
      if (!user) {
        return res.status(404).json({ message: "Utilisateur non trouvé" });
      }
      
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(400).json({ message: "Données de profil invalides" });
    }
  });

  // Grocery Lists
  app.get("/api/grocery-lists", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "Session invalide" });
      }
      
      const lists = await storage.getGroceryLists(userId);
      res.json(lists);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch grocery lists" });
    }
  });

  app.post("/api/grocery-lists", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "Session invalide" });
      }
      
      const validatedData = insertGroceryListSchema.parse({
        ...req.body,
        userId,
      });
      const list = await storage.createGroceryList(validatedData);
      res.json(list);
    } catch (error) {
      res.status(400).json({ message: "Invalid grocery list data" });
    }
  });

  app.get("/api/grocery-lists/:id", async (req, res) => {
    try {
      const listId = parseInt(req.params.id);
      const list = await storage.getGroceryList(listId);
      
      if (!list) {
        return res.status(404).json({ message: "Grocery list not found" });
      }
      
      res.json(list);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch grocery list" });
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

  // Food Categories
  app.get("/api/food-categories", async (req, res) => {
    try {
      const items = await storage.getFoodItems();
      
      // Group items by category and count them
      const categoryMap = new Map();
      
      items.forEach(item => {
        const count = categoryMap.get(item.category) || 0;
        categoryMap.set(item.category, count + 1);
      });
      
      // Convert to array with proper display names and emojis
      const categories = Array.from(categoryMap.entries()).map(([id, count]) => {
        const displayNames: { [key: string]: { name: string; emoji: string } } = {
          'fruits': { name: 'Fruits', emoji: '🍎' },
          'legumes': { name: 'Légumes', emoji: '🥦' },
          'legumineuses': { name: 'Légumineuses', emoji: '🥫' },
          'cereales-et-pseudo-cereales': { name: 'Céréales et pseudo-céréales', emoji: '🌾' },
          'pains-et-farines': { name: 'Pains et farines', emoji: '🍞' },
          'proteines-animales-et-alternatives': { name: 'Protéines animales et alternatives', emoji: '🍗' },
          'produits-laitiers-et-substituts': { name: 'Produits laitiers et substituts', emoji: '🥛' },
          'noix-et-graines': { name: 'Noix et graines', emoji: '🥜' },
          'huiles-et-graisses-saines': { name: 'Huiles et graisses saines', emoji: '🫒' },
          'epices-herbes-et-condiments': { name: 'Épices, herbes et condiments', emoji: '🌶️' },
          'produits-fermentes': { name: 'Produits fermentés', emoji: '🥬' },
          'snacks-et-encas-sains': { name: 'Snacks et encas sains', emoji: '🍫' },
          'boissons-sans-sucre-ajoute': { name: 'Boissons sans sucre ajouté', emoji: '🥤' },
          'supplements-et-complements': { name: 'Suppléments et compléments', emoji: '💊' },
        };
        
        const display = displayNames[id] || { name: id, emoji: '📦' };
        
        return {
          id,
          name: display.name,
          emoji: display.emoji,
          count
        };
      }).sort((a, b) => a.name.localeCompare(b.name));
      
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch food categories" });
    }
  });

  // Food Items
  app.get("/api/food-items", async (req, res) => {
    try {
      const items = await storage.getFoodItems();
      const { season, category } = req.query;
      
      let filteredItems = items;
      
      if (season && season !== "all" && typeof season === 'string') {
        filteredItems = filteredItems.filter(item => {
          if (typeof item.season === 'string') {
            return item.season.includes(season) || item.season.includes("toute-saisons");
          }
          return false;
        });
      }
      
      if (category && typeof category === 'string') {
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

  app.delete("/api/grocery-lists/:listId/items/:itemId", async (req, res) => {
    try {
      const itemId = parseInt(req.params.itemId);
      const deleted = await storage.removeItemFromList(itemId);
      if (!deleted) {
        return res.status(404).json({ message: "List item not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete list item" });
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
      console.log("Updating meal", id, "with data:", req.body);
      const meal = await storage.updateMeal(id, req.body);
      if (!meal) {
        return res.status(404).json({ message: "Meal not found" });
      }
      res.json(meal);
    } catch (error: any) {
      console.error("Error updating meal:", error);
      res.status(500).json({ message: "Failed to update meal", error: error?.message || error });
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

  app.post("/api/meal-ingredients", async (req, res) => {
    try {
      const { mealId, foodItemId, quantity, unit } = req.body;
      
      if (!mealId || !foodItemId || !quantity || !unit) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const updatedMeal = await storage.addIngredientToMeal(mealId, {
        foodItemId,
        quantity,
        unit
      });

      if (!updatedMeal) {
        return res.status(404).json({ message: "Meal or food item not found" });
      }

      res.json(updatedMeal);
    } catch (error) {
      res.status(500).json({ message: "Failed to add ingredient to meal" });
    }
  });

  // Nutrition Logs
  app.get("/api/nutrition-logs/:period?", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "Session invalide" });
      }
      
      const period = req.params.period || "7d";
      const days = period === "30d" ? 30 : 7;
      
      const logs = await storage.getNutritionLogs(userId, days);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch nutrition logs" });
    }
  });

  app.post("/api/nutrition-logs", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "Session invalide" });
      }
      
      const log = await storage.updateTodayNutritionLog(userId, req.body);
      res.json(log);
    } catch (error) {
      res.status(500).json({ message: "Failed to update nutrition log" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
