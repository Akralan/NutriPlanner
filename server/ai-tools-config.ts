import { FunctionDefinition } from 'openai/resources/shared';

/**
 * Configuration des outils (fonctions) disponibles pour l'assistant OpenAI
 */
const toolsConfig: FunctionDefinition[] = [
  {
    name: "addMeal",
    description: "Ajoute un nouveau repas à la base de données",
    parameters: {
      type: "object",
      properties: {
        listId: {
          type: "integer",
          description: "ID de la liste de courses associée au repas"
        },
        name: {
          type: "string",
          description: "Nom du repas"
        },
        calories: {
          type: "integer",
          description: "Nombre de calories du repas"
        },
        protein: {
          type: "integer",
          description: "Quantité de protéines en grammes"
        },
        fat: {
          type: "integer",
          description: "Quantité de lipides en grammes"
        },
        carbs: {
          type: "integer",
          description: "Quantité de glucides en grammes"
        },
        ingredients: {
          type: "array",
          description: "Liste des ingrédients du repas",
          items: {
            type: "object",
            properties: {
              foodItemId: {
                type: "integer",
                description: "ID de l'aliment"
              },
              quantity: {
                type: "integer",
                description: "Quantité de l'ingrédient"
              },
              unit: {
                type: "string",
                description: "Unité de mesure (kg, g, pieces)"
              }
            },
            required: ["foodItemId", "quantity", "unit"]
          }
        }
      },
      required: ["listId", "name", "calories", "protein", "fat", "carbs", "ingredients"]
    }
  }
];

export default toolsConfig;
