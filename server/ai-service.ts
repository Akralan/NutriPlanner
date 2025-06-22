import OpenAI from "openai";
import { validateTextInput, aiMealResponseSchema, type AiMealResponse } from "./security";
import { storage } from "./storage";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || "" 
});

export class AiMealService {
  async createMealFromDescription(description: string, userId: number): Promise<AiMealResponse> {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OpenAI API key not configured");
    }

    // Sanitize input
    const sanitizedDescription = validateTextInput(description, 500);
    
    // Get available food items for context
    const foodItems = await storage.getFoodItems();
    const foodContext = foodItems.map(item => {
      const nutrition = item.nutrition as any;
      return `ID: ${item.id}, Name: ${item.name}, Category: ${item.category}, Protein: ${nutrition?.protein || 0}g, Carbs: ${nutrition?.carbs || 0}g, Fat: ${nutrition?.fat || 0}g, Calories: ${nutrition?.calories || 0}`;
    }).join('\n');

    const prompt = `Tu es un nutritionniste expert qui aide à créer des repas équilibrés.

Contexte des aliments disponibles:
${foodContext}

Description du repas souhaité: "${sanitizedDescription}"

Crée un repas basé uniquement sur les aliments disponibles ci-dessus. Réponds en JSON avec cette structure exacte:
{
  "name": "Nom du repas",
  "description": "Description détaillée du repas",
  "ingredients": [
    {
      "foodItemId": 123,
      "quantity": 150,
      "unit": "g"
    }
  ],
  "estimatedCalories": 450,
  "estimatedProtein": 25,
  "estimatedCarbs": 45,
  "estimatedFat": 15
}

Règles importantes:
- Utilise UNIQUEMENT les IDs des aliments fournis
- Les quantités doivent être réalistes (50-300g pour la plupart des aliments)
- Les unités doivent être "g", "ml", "unité" ou "cuillère"
- Calcule les macros en fonction des quantités et des valeurs nutritionnelles
- Maximum 8 ingrédients par repas
- Le repas doit être équilibré nutritionnellement`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "Tu es un nutritionniste expert. Réponds uniquement en JSON valide sans formatage markdown."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 1000,
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error("Empty response from AI");
      }

      // Parse and validate response
      const parsedResponse = JSON.parse(content);
      const validatedResponse = aiMealResponseSchema.parse(parsedResponse);

      // Verify all food item IDs exist
      const validFoodIds = new Set(foodItems.map(item => item.id));
      for (const ingredient of validatedResponse.ingredients) {
        if (!validFoodIds.has(ingredient.foodItemId)) {
          throw new Error(`Invalid food item ID: ${ingredient.foodItemId}`);
        }
      }

      return validatedResponse;
    } catch (error) {
      console.error("AI meal creation error:", error);
      throw new Error("Failed to create meal with AI assistance");
    }
  }

  async generateMealSuggestions(preferences: string, userId: number): Promise<string[]> {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OpenAI API key not configured");
    }

    const sanitizedPreferences = validateTextInput(preferences, 200);
    
    const prompt = `Basé sur ces préférences: "${sanitizedPreferences}"
    
Suggère 5 idées de repas simples et équilibrés. Réponds en JSON avec cette structure:
{
  "suggestions": [
    "Idée de repas 1",
    "Idée de repas 2",
    "Idée de repas 3",
    "Idée de repas 4",
    "Idée de repas 5"
  ]
}

Les suggestions doivent être courtes (max 50 caractères) et réalisables.`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "Tu es un chef cuisinier. Réponds uniquement en JSON valide."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.8,
        max_tokens: 500,
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error("Empty response from AI");
      }

      const parsedResponse = JSON.parse(content);
      return parsedResponse.suggestions || [];
    } catch (error) {
      console.error("AI suggestions error:", error);
      throw new Error("Failed to generate meal suggestions");
    }
  }
}