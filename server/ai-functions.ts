import axios from 'axios';
import { db } from './db';
import { meals, groceryLists, foodItems } from '../shared/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

// Schéma de validation pour les ingrédients
const ingredientSchema = z.object({
  foodItemId: z.number().int().positive(),
  quantity: z.number().int().positive(),
  unit: z.string().min(1).max(20)
});

// Schéma de validation pour les arguments de la fonction addMeal
const addMealArgsSchema = z.object({
  listId: z.number().int().positive(),
  name: z.string().min(1).max(255),
  calories: z.number().int().nonnegative(),
  protein: z.number().int().nonnegative(),
  fat: z.number().int().nonnegative(),
  carbs: z.number().int().nonnegative(),
  ingredients: z.array(ingredientSchema).min(0)
});

// Interface pour les arguments de la fonction addMeal
interface AddMealArgs {
  listId: number;
  name: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  ingredients: Array<{
    foodItemId: number;
    quantity: number;
    unit: string;
  }>;
}

// Schéma de validation pour les aliments
const foodItemSchema = z.object({
  name: z.string().min(1).max(255),
  category: z.string().min(1).max(100),
  emoji: z.string().min(1).max(10),
  season: z.string().default('all'),
  nutrition: z.object({
    calories: z.number().nonnegative(),
    protein: z.number().nonnegative(),
    carbs: z.number().nonnegative(),
    fat: z.number().nonnegative(),
    averageWeight: z.number().nonnegative().optional()
  })
});

// Interface pour les arguments de la fonction addFoodItem
interface AddFoodItemArgs {
  name: string;
  category: string;
  emoji: string;
  season?: string;
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    averageWeight?: number;
  };
}

// Interface pour les arguments de la fonction report_api_status
interface ReportApiStatusArgs {
  addMeal_failed: boolean;
  addFoodItem_failed: boolean;
  nothing_to_do: boolean;
}

// Schéma de validation pour les arguments de la fonction getUserInfos
const getUserInfosArgsSchema = z.object({
  meal: z.boolean().default(false),
  foodItem: z.boolean().default(false)
});

// Interface pour les arguments de la fonction getUserInfos
interface GetUserInfosArgs {
  meal: boolean;
  foodItem: boolean;
}

// Fonctions disponibles pour l'IA
const availableFunctions = {

  // Ajout d'un repas à la base de données
  addMeal: async (args: AddMealArgs) => {
    try {
      console.log('Arguments reçus pour addMeal:', JSON.stringify(args, null, 2));
      
      // Validation et nettoyage des données avec Zod
      try {
        // Valider les données d'entrée
        const validatedData = addMealArgsSchema.parse(args);
        
        // Utiliser les données validées et nettoyées
        const { 
          listId,
          name, 
          calories, 
          protein, 
          fat, 
          carbs, 
          ingredients
        } = validatedData;
        
        if (!name) {
          throw new Error("Le nom du repas est requis");
        }

        if (!listId) {
          throw new Error("L'ID de la liste est requis");
        }
        
        // Préparation des données pour insertion dans la base de données
        const mealData = {
          listId,
          name,
          calories,
          protein,
          fat,
          carbs,
          completed: false,
          ingredients: JSON.stringify(ingredients),
        };
        
        console.log('Données validées à insérer dans la base de données:', JSON.stringify(mealData, null, 2));
        
        // Insertion dans la base de données avec Drizzle ORM
        const result = await db.insert(meals).values(mealData).returning();
        
        console.log('Repas ajouté avec succès:', JSON.stringify(result, null, 2));

        try {
          // Mettre à jour le compteur de repas dans la liste
          console.log(`[addMeal] Updating meal count for list ${listId}`);
          
          // Compter les repas dans la liste
          const mealsList = await db
            .select()
            .from(meals)
            .where(eq(meals.listId, listId));
          
          const mealCount = mealsList.length;
          console.log(`[addMeal] Counted ${mealCount} meals for list ${listId}`);
          
          // Mettre à jour le compteur dans la liste
          const [updatedList] = await db
            .update(groceryLists)
            .set({ mealCount })
            .where(eq(groceryLists.id, listId))
            .returning();
          
          console.log(`[addMeal] Updated list ${listId} with meal count ${updatedList.mealCount}`);
        } catch (updateError) {
          // Ne pas faire échouer l'ajout si la mise à jour du compteur échoue
          console.error("[addMeal] Error updating meal count:", updateError);
        }

        return {
          success: true,
          message: "Repas ajouté avec succès",
          meal: result[0]
        };
      } catch (validationError: any) {
        console.error('Erreur de validation des données:', validationError);
        return {
          success: false,
          message: `Erreur de validation des données: ${validationError.message}`,
          error: validationError.errors || validationError.message
        };
      }
    } catch (error: any) {
      console.error('Erreur lors de l\'ajout du repas:', error);
      return {
        success: false,
        message: `Erreur lors de l'ajout du repas: ${error.message}`,
        error: error.message
      };
    }
  },

  // Ajout d'un aliment à la base de données
  addFoodItem: async (args: AddFoodItemArgs) => {
    try {
      console.log('Arguments reçus pour addFoodItem:', JSON.stringify(args, null, 2));
      
      // Validation et nettoyage des données avec Zod
      try {
        // Valider les données d'entrée
        const validatedData = foodItemSchema.parse(args);
        
        // Vérifier si l'aliment existe déjà
        const existingFood = await db.query.foodItems.findFirst({
          where: (foodItems, { eq }) => eq(foodItems.name, validatedData.name)
        });
        
        if (existingFood) {
          return {
            success: true,
            message: "Cet aliment existe déjà",
            foodItem: existingFood
          };
        }
        
        // Préparer les données pour l'insertion
        const foodItemData = {
          ...validatedData,
          nutrition: JSON.stringify(validatedData.nutrition),
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        console.log('Données validées à insérer dans la base de données:', JSON.stringify(foodItemData, null, 2));
        
        // Insertion dans la base de données
        const result = await db.insert(foodItems).values(foodItemData).returning();
        
        console.log('Aliment ajouté avec succès:', JSON.stringify(result, null, 2));
        
        return {
          success: true,
          message: "Aliment ajouté avec succès",
          foodItem: result[0]
        };
      } catch (validationError: any) {
        console.error('Erreur de validation des données:', validationError);
        return {
          success: false,
          message: `Erreur de validation des données: ${validationError.message}`,
          error: validationError.errors || validationError.message
        };
      }
    } catch (error: any) {
      console.error('Erreur lors de l\'ajout de l\'aliment:', error);
      return {
        success: false,
        message: `Erreur lors de l'ajout de l'aliment: ${error.message}`,
        error: error.message
      };
    }
  },

  // Fonction pour récupérer les informations utilisateur
  getUserInfos: async (args: GetUserInfosArgs) => {
    try {
      console.log('Arguments reçus pour getUserInfos:', JSON.stringify(args, null, 2));
      
      // Validation des arguments
      const validatedArgs = getUserInfosArgsSchema.parse(args);
      const result: any = {};
      
      // Récupérer les aliments si demandé
      if (validatedArgs.foodItem) {
        console.log('Récupération des aliments...');
        const foodItemsList = await db.query.foodItems.findMany({
          orderBy: (foodItems, { asc }) => [asc(foodItems.name)],
          columns: {
            id: true,
            name: true
          }
        });
        
        result.foodItems = foodItemsList;
        
        console.log(`${result.foodItems.length} aliments récupérés avec succès`);
      }
      
      // Récupérer les repas si demandé (pour l'instant non implémenté)
      if (validatedArgs.meal) {
        console.log('La récupération des repas n\'est pas encore implémentée');
        result.meals = [];
      }
      
      return {
        success: true,
        message: "Informations récupérées avec succès",
        ...result
      };
      
    } catch (error: any) {
      console.error('Erreur lors de la récupération des informations:', error);
      return {
        success: false,
        message: `Erreur lors de la récupération des informations: ${error.message}`,
        error: error.message
      };
    }
  },

  // Nouvelle fonction pour rapporter le statut des opérations API
  report_api_status: async (args: ReportApiStatusArgs) => {
    try {
      console.log('Rapport de statut API reçu:', JSON.stringify(args, null, 2));
      
      // Logique de traitement du statut
      if (args.addMeal_failed) {
        console.warn("L'opération addMeal a échoué");
      }
      
      if (args.addFoodItem_failed) {
        console.warn("L'opération addFoodItem a échoué");
      }
      
      if (args.nothing_to_do) {
        console.log("Aucune action nécessaire");
      }
      
      return {
        success: true,
        message: "Statut des opérations API enregistré avec succès"
      };
      
    } catch (error: any) {
      console.error('Erreur lors du traitement du rapport de statut:', error);
      return {
        success: false,
        message: `Erreur lors du traitement du rapport de statut: ${error.message}`,
        error: error.message
      };
    }
  }
};

export default availableFunctions;
