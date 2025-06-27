import OpenAI from "openai";
import fs from "fs";
import { validateTextInput } from "./security";
import openAIService from "./ai-openai-service";
import { z } from "zod";

// Initialisation de l'API OpenAI
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || "" 
});

// Schéma de validation pour les paramètres de transcription
const transcriptionParamsSchema = z.object({
  audioFilePath: z.string().min(1),
  model: z.string().default("whisper-1")  
});

// Schéma de validation pour les paramètres audioToMeal
const audioToMealParamsSchema = z.object({
  audioFilePath: z.string().min(1),
  userId: z.number().int().positive(),
  listId: z.number().int().positive().default(1)
});

export class AiVoiceService {
  /**
   * Transcrit un fichier audio en texte en utilisant l'API OpenAI
   * @param audioFilePath Chemin vers le fichier audio à transcrire
   * @param model Modèle de transcription à utiliser (par défaut: whisper-1)
   * @returns Transcription du fichier audio
   */
  async transcribeAudio(audioFilePath: string, model: string = "whisper-1"): Promise<string> {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OpenAI API key not configured");
    }

    try {
      console.log("Début de la transcription audio avec OpenAI");
      // Validation des paramètres
      const validParams = transcriptionParamsSchema.parse({ audioFilePath, model });
      console.log(`Paramètres validés: modèle=${validParams.model}`);
      
      // Vérification que le fichier existe
      if (!fs.existsSync(validParams.audioFilePath)) {
        console.error(`Fichier introuvable: ${validParams.audioFilePath}`);
        throw new Error(`Le fichier audio n'existe pas: ${validParams.audioFilePath}`);
      }
      console.log(`Fichier audio trouvé: ${validParams.audioFilePath}`);

      // Création d'un stream de lecture pour le fichier audio
      const audioStream = fs.createReadStream(validParams.audioFilePath);
      console.log("Stream de lecture créé");

      // Ajout d'un timeout pour l'appel API
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Timeout: L'API OpenAI n'a pas répondu dans le délai imparti")), 30000);
      });

      console.log("Appel de l'API OpenAI pour la transcription...");
      // Appel à l'API OpenAI pour la transcription avec timeout
      const transcriptionPromise = openai.audio.transcriptions.create({
        file: audioStream,
        model: validParams.model, // Utilisation du modèle spécifié
        language: "fr", // Langue française
        response_format: "text" // Format de réponse en texte
      });

      // Race entre la transcription et le timeout
      const transcription = await Promise.race([transcriptionPromise, timeoutPromise]) as string;
      console.log("Transcription reçue avec succès");

      return transcription;
    } catch (error: any) {
      console.error("Erreur détaillée lors de la transcription audio:", error);
      if (error.stack) {
        console.error("Stack trace:", error.stack);
      }
      if (error.response) {
        console.error("Réponse d'erreur OpenAI:", error.response.data);
      }
      throw new Error(`Échec de la transcription audio: ${error.message}`);
    }
  }

  /**
   * Traitement direct d'un fichier audio pour générer un repas
   * @param audioFilePath Chemin vers le fichier audio
   * @param userId ID de l'utilisateur
   * @param listId ID de la liste de courses associée (par défaut: 1)
   * @returns Résultat de la génération du repas
   */
  async audioToMeal(audioFilePath: string, userId: number, listId: number = 1): Promise<any> {
    try {
      // Validation des paramètres
      const validParams = audioToMealParamsSchema.parse({ audioFilePath, userId, listId });
      
      // Transcription de l'audio
      const transcription = await this.transcribeAudio(validParams.audioFilePath);
      console.log("########Transcription reçue:", transcription);
      
      // Enrichir la description avec l'ID de liste
      const enrichedDescription = `Analyse cette transcription audio et génère un repas approprié: "${transcription}". Utilise l'ID de liste: ${validParams.listId}.`;
      console.log("########Description enrichie:", enrichedDescription);
      
      // Envoi direct à l'assistant pour générer un repas
      const result = await openAIService.generateAndAddMeal(enrichedDescription);
      
      return {
        success: true,
        transcription,
        meal: result
      };
    } catch (error: any) {
      console.error("Erreur lors du traitement audio-to-meal:", error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Traitement d'un fichier audio pour ajouter un aliment
   * @param audioFilePath Chemin vers le fichier audio
   * @returns Résultat de l'ajout de l'aliment
   */
  async audioToFood(audioFilePath: string): Promise<any> {
    try {
      // Transcrire l'audio
      const transcription = await this.transcribeAudio(audioFilePath);
      console.log("Transcription pour ajout d'aliment:", transcription);
      
      // Enrichir la description pour l'assistant
      const enrichedDescription = `Analyse cette transcription et ajoute un nouvel aliment à la base de données: "${transcription}". 
        Fournis les informations nécessaires pour la fonction addFoodItem.`;
      
      // Envoyer à l'assistant pour traiter la demande
      const result = await openAIService.processFoodRequest(enrichedDescription);
      
      return {
        success: true,
        transcription,
        foodItem: result
      };
    } catch (error: any) {
      console.error("Erreur lors du traitement audio-to-food:", error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}
