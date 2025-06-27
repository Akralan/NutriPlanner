import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { body, validationResult } from "express-validator";
import { storage } from "./storage";
import { insertGroceryListSchema, insertListItemSchema, insertMealSchema, insertUserSchema, loginSchema, updateProfileSchema, weightEntrySchema } from "@shared/schema";
import { generateToken, requireAuth } from "./auth";
import { aiMealRequestSchema, checkAiRateLimit } from "./security";
import { AiVoiceService } from "./ai-service";
import multer from "multer";
import path from "path";
import fs from "fs";
import os from "os";
import { customNormalizeEmail } from "./utils";
import lamejs from "lamejs";
import { z } from 'zod';

// Configuration de multer pour utiliser uniquement le stockage en mémoire
const upload = multer({
  storage: multer.memoryStorage(), // Stockage explicitement en mémoire
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
  fileFilter: (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // Accepter uniquement les fichiers audio
    const allowedMimes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/wave', 'audio/x-wav'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Format de fichier non supporté. Veuillez utiliser MP3 ou WAV.'));
    }
  }
});

interface AuthRequest extends Request {
  userId?: number;
}

export async function registerRoutes(app: Express): Promise<Server> {

  // Input validation middleware
  const validateRegistration = [
    body('email').isEmail().customSanitizer(customNormalizeEmail).withMessage('Valid email required'),
    body('firstName').trim().isLength({ min: 1, max: 50 }).withMessage('First name required (1-50 chars)'),
    body('lastName').trim().isLength({ min: 1, max: 50 }).withMessage('Last name required (1-50 chars)'),
    body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must be 8+ chars with uppercase, lowercase, and number'),
  ];

  const validateLogin = [
    body('email').isEmail().customSanitizer(customNormalizeEmail).withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password required'),
  ];

  // Auth routes
  app.post("/api/auth/register", validateRegistration, async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: "Validation errors", errors: errors.array() });
      }

      const validatedData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(409).json({ message: "Un utilisateur avec cet email existe déjà" });
      }

      const user = await storage.createUser(validatedData);
      const token = generateToken(user.id, user.email);
      
      const { password, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword, token });
    } catch (error) {
      res.status(400).json({ message: "Données d'inscription invalides" });
    }
  });

  app.post("/api/auth/login", validateLogin, async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: "Validation errors", errors: errors.array() });
      }

      const validatedData = loginSchema.parse(req.body);
      const user = await storage.validateUser(validatedData.email, validatedData.password);
      
      if (!user) {
        return res.status(401).json({ message: "Email ou mot de passe invalide" });
      }

      const token = generateToken(user.id, user.email);
      const { password, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword, token });
    } catch (error) {
      res.status(400).json({ message: "Données de connexion invalides" });
    }
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    // With JWT, logout is handled client-side by removing the token
    res.json({ message: "Déconnexion réussie" });
  });

  app.get("/api/auth/user", requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ message: "Token invalide" });
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

  app.put("/api/auth/profile", requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ message: "Token invalide" });
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
  app.get("/api/grocery-lists", requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ message: "Token invalide" });
      }
      
      const lists = await storage.getGroceryLists(userId);
      res.json(lists);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch grocery lists" });
    }
  });

  app.post("/api/grocery-lists", requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ message: "Token invalide" });
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
      
      // Récupérer tous les items de la liste en une seule requête
      const items = await storage.getListItems(listId);
      
      if (items.length === 0) {
        return res.json([]);
      }
      
      // Récupérer tous les foodItems nécessaires en une seule requête
      const foodItemIds = items.map(item => item.foodItemId);
      const foodItems = await storage.getFoodItemsByIds(foodItemIds);
      
      // Créer un map pour un accès rapide
      const foodItemMap = new Map();
      foodItems.forEach(item => {
        foodItemMap.set(item.id, item);
      });
      
      // Enrichir les items avec les détails des aliments
      const enrichedItems = items.map(item => ({
        ...item,
        foodItem: foodItemMap.get(item.foodItemId)
      }));
      
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
      
      // Récupérer tous les repas en une seule requête
      const meals = await storage.getMeals(listId);
      
      if (meals.length === 0) {
        return res.json([]);
      }
      
      // Collecter tous les IDs des aliments nécessaires
      const foodItemIds = new Set();
      meals.forEach(meal => {
        (meal.ingredients as any[]).forEach(ingredient => {
          foodItemIds.add(ingredient.foodItemId);
        });
      });
      
      // Récupérer tous les aliments en une seule requête
      const foodItems = await storage.getFoodItemsByIds(Array.from(foodItemIds) as number[]);
      
      // Créer un map pour un accès rapide
      const foodItemMap = new Map();
      foodItems.forEach(item => {
        foodItemMap.set(item.id, item);
      });
      
      // Enrichir les repas avec les détails des aliments
      const enrichedMeals = meals.map(meal => {
        const enrichedIngredients = (meal.ingredients as any[]).map(ingredient => ({
          ...ingredient,
          foodItem: foodItemMap.get(ingredient.foodItemId)
        }));
        
        return {
          ...meal,
          ingredients: enrichedIngredients
        };
      });
      
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

  app.post("/api/meals/:id/duplicate", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const duplicatedMeal = await storage.duplicateMeal(id);
      
      if (!duplicatedMeal) {
        return res.status(404).json({ message: "Meal not found" });
      }
      
      res.json(duplicatedMeal);
    } catch (error) {
      console.error("Error duplicating meal:", error);
      res.status(500).json({ message: "Failed to duplicate meal" });
    }
  });

  // Nutrition Logs
  app.get("/api/nutrition-logs/:period?", requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ message: "Token invalide" });
      }
      
      const period = req.params.period || "7d";
      const days = period === "30d" ? 30 : 7;
      
      const logs = await storage.getNutritionLogs(userId, days);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch nutrition logs" });
    }
  });

  app.post("/api/nutrition-logs", requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ message: "Token invalide" });
      }
      
      const log = await storage.updateTodayNutritionLog(userId, req.body);
      res.json(log);
    } catch (error) {
      res.status(500).json({ message: "Failed to update nutrition log" });
    }
  });

  // Routes pour l'IA vocale
  const aiVoiceService = new AiVoiceService();

  // Route pour la transcription audio
  app.post("/api/transcribe-audio", upload.single('audio'), async (req: Request, res: Response) => {
    // Fichier temporaire pour stocker les données du buffer
    let tempFilePath = "";
    
    try {
      console.log("Début de la transcription audio");
      
      if (!req.file) {
        console.log("Aucun fichier audio fourni");
        return res.status(400).json({ success: false, error: 'Aucun fichier audio fourni' });
      }
      
      console.log(`Fichier reçu: ${req.file.originalname}, taille: ${req.file.size} bytes, type: ${req.file.mimetype}`);
      
      // Créer un fichier temporaire pour stocker les données du buffer
      tempFilePath = path.join(os.tmpdir(), `audio-${Date.now()}.${req.file.originalname.split('.').pop()}`);
      console.log(`Écriture du fichier temporaire: ${tempFilePath}`);
      fs.writeFileSync(tempFilePath, req.file.buffer);
      console.log("Fichier temporaire créé avec succès");
      
      // Transcrire l'audio
      console.log("Appel de l'API OpenAI pour la transcription...");
      const transcription = await aiVoiceService.transcribeAudio(tempFilePath);
      console.log("Transcription terminée avec succès");
      
      // Répondre avec la transcription
      res.json({ success: true, transcription });
    } catch (error: any) {
      console.error('Erreur détaillée de transcription:', error);
      if (error.stack) {
        console.error('Stack trace:', error.stack);
      }
      res.status(500).json({ success: false, error: error.message });
    } finally {
      // Supprimer le fichier temporaire si créé
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        console.log(`Suppression du fichier temporaire: ${tempFilePath}`);
        fs.unlinkSync(tempFilePath);
        console.log("Fichier temporaire supprimé");
      }
    }
  });

  // Route pour le traitement audio vers repas
  app.post("/api/audio-to-meal", requireAuth, upload.single('audio'), async (req: AuthRequest, res: Response) => {
    // Vérifier si un fichier a été envoyé
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Aucun fichier audio fourni' });
    }
    
    // Obtenir l'extension du fichier
    const fileExtension = req.file.originalname.split('.').pop()?.toLowerCase() || 'wav';
    
    // Créer un chemin temporaire pour le fichier audio
    const tempFilePath = path.join(os.tmpdir(), `audio-${Date.now()}.${fileExtension}`);
    
    // Écrire le fichier dans le répertoire temporaire
    fs.writeFileSync(tempFilePath, req.file.buffer);
    console.log(`Fichier audio temporaire créé: ${tempFilePath}`);
    
    try {
      // Traiter l'audio et générer un repas directement avec le fichier original
      // OpenAI accepte les formats WAV, pas besoin de conversion
      const result = await aiVoiceService.audioToMeal(tempFilePath, req.userId || 1, parseInt(req.body.listId || '1'));
      
      res.json(result);
    } catch (error) {
      console.error('Erreur lors du traitement audio-to-meal:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      return res.status(500).json({ success: false, error: `Échec de la transcription audio: ${errorMessage}` });
    } finally {
      // Nettoyer le fichier temporaire
      try {
        //fs.unlinkSync(tempFilePath);
        //console.log(`Fichier temporaire supprimé: ${tempFilePath}`);
      } catch (cleanupError) {
        console.error('Erreur lors du nettoyage du fichier temporaire:', cleanupError);
      }
    }
  });

  // Route pour le traitement audio vers aliment (version non protégée pour les tests)
  app.post("/api/test/audio-to-fooditem", upload.single('audio'), async (req: Request, res: Response) => {
    // Vérifier si un fichier a été envoyé
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Aucun fichier audio fourni' });
    }
    
    // Obtenir l'extension du fichier
    const fileExtension = req.file.originalname.split('.').pop()?.toLowerCase() || 'wav';
    
    // Créer un chemin temporaire pour le fichier audio
    const tempFilePath = path.join(os.tmpdir(), `audio-food-test-${Date.now()}.${fileExtension}`);
    
    try {
      // Écrire le fichier dans le répertoire temporaire
      fs.writeFileSync(tempFilePath, req.file.buffer);
      console.log(`[TEST] Fichier audio temporaire créé: ${tempFilePath}`);
      
      // Traiter l'audio pour ajouter un aliment
      const result = await aiVoiceService.audioToFood(tempFilePath);
      
      // Retourner le résultat
      res.json(result);
    } catch (error) {
      console.error('[TEST] Erreur lors du traitement audio-to-food:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      res.status(500).json({ 
        success: false, 
        error: `Échec du traitement audio: ${errorMessage}` 
      });
    } finally {
      // Nettoyer le fichier temporaire
      try {
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
          console.log(`[TEST] Fichier temporaire supprimé: ${tempFilePath}`);
        }
      } catch (cleanupError) {
        console.error('[TEST] Erreur lors du nettoyage du fichier temporaire:', cleanupError);
      }
    }
  });

  // Route pour le traitement audio vers aliment
  app.post("/api/audio-to-fooditem", requireAuth, upload.single('audio'), async (req: AuthRequest, res: Response) => {
    // Vérifier si un fichier a été envoyé
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Aucun fichier audio fourni' });
    }
    
    // Obtenir l'extension du fichier
    const fileExtension = req.file.originalname.split('.').pop()?.toLowerCase() || 'wav';
    
    // Créer un chemin temporaire pour le fichier audio
    const tempFilePath = path.join(os.tmpdir(), `audio-food-${Date.now()}.${fileExtension}`);
    
    try {
      // Écrire le fichier dans le répertoire temporaire
      fs.writeFileSync(tempFilePath, req.file.buffer);
      console.log(`Fichier audio temporaire créé: ${tempFilePath}`);
      
      // Traiter l'audio pour ajouter un aliment
      const result = await aiVoiceService.audioToFood(tempFilePath); //##ATTENTION
      
      // Retourner le résultat
      res.json(result);
    } catch (error) {
      console.error('Erreur lors du traitement audio-to-food:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      res.status(500).json({ 
        success: false, 
        error: `Échec du traitement audio: ${errorMessage}` 
      });
    } finally {
      // Nettoyer le fichier temporaire
      try {
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
      } catch (cleanupError) {
        console.error('Erreur lors du nettoyage du fichier temporaire:', cleanupError);
      }
    }
  });

  // Routes pour la gestion du poids
  app.post('/api/weight', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ message: "Token invalide" });
      }
      
      // Valider les données avec le schéma (sans conversion de date)
      const validatedData = weightEntrySchema.parse({
        ...req.body,
        userId,
      });
      
      // Convertir la date en objet Date si elle est fournie sous forme de chaîne
      const entryToSave = {
        ...validatedData,
        date: validatedData.date ? new Date(validatedData.date) : new Date()
      };
      
      const entry = await storage.addWeightEntry(entryToSave);
      res.status(201).json(entry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: 'Données invalides', 
          details: error.errors 
        });
      }
      console.error('Error adding weight entry:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  });

  app.get('/api/weight/history', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ message: "Token invalide" });
      }
      
      const history = await storage.getWeightHistory(userId);
      res.json(history);
    } catch (error) {
      console.error('Error fetching weight history:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  });

  app.get('/api/weight/current', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ message: "Token invalide" });
      }
      
      const currentWeight = await storage.getCurrentWeight(userId);
      
      if (!currentWeight) {
        return res.status(404).json({ error: 'Aucune donnée de poids trouvée' });
      }
      
      res.json(currentWeight);
    } catch (error) {
      console.error('Error fetching current weight:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  });

  app.put('/api/weight/:id', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ message: "Token invalide" });
      }
      
      const entryId = parseInt(req.params.id);
      
      if (isNaN(entryId)) {
        return res.status(400).json({ error: 'ID invalide' });
      }
      
      const data = weightEntrySchema.partial().parse(req.body);
      
      // Vérifier que l'entrée appartient bien à l'utilisateur
      const existingEntry = await storage.getCurrentWeight(userId);
      if (!existingEntry || existingEntry.id !== entryId) {
        return res.status(404).json({ error: 'Entrée non trouvée' });
      }
      
      const updatedEntry = await storage.updateWeightEntry(entryId, data);
      if (!updatedEntry) {
        return res.status(404).json({ error: 'Entrée non trouvée' });
      }
      
      res.json(updatedEntry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Données invalides', details: error.errors });
      }
      console.error('Error updating weight entry:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  });

  app.delete('/api/weight/:id', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ message: "Token invalide" });
      }
      
      const entryId = parseInt(req.params.id);
      
      if (isNaN(entryId)) {
        return res.status(400).json({ error: 'ID invalide' });
      }
      
      // Vérifier que l'entrée appartient bien à l'utilisateur
      const existingEntry = await storage.getCurrentWeight(userId);
      if (!existingEntry || existingEntry.id !== entryId) {
        return res.status(404).json({ error: 'Entrée non trouvée' });
      }
      
      const success = await storage.deleteWeightEntry(entryId);
      if (!success) {
        return res.status(404).json({ error: 'Entrée non trouvée' });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting weight entry:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
