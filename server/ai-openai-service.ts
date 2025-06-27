import OpenAI from 'openai';
import availableFunctions from './ai-functions';

// Configuration de l'API OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '', // Assurez-vous d'avoir cette variable d'environnement
});

// ID de l'assistant à utiliser (à créer dans le dashboard OpenAI)
const ASSISTANT_ID = process.env.OPENAI_ASSISTANT_ID || '';

class OpenAIService {
  /**
   * Crée un nouveau thread de conversation
   * @returns L'ID du thread créé
   */
  async createThread(): Promise<string> {
    try {
      console.log("Création d'un nouveau thread...");
      const thread = await openai.beta.threads.create();
      console.log("Thread créé avec succès, ID:", thread.id);
      return thread.id;
    } catch (error: any) {
      console.error('Erreur lors de la création du thread:', error);
      throw new Error(`Erreur lors de la création du thread: ${error.message}`);
    }
  }

  /**
   * Ajoute un message au thread spécifié
   * @param threadId - L'ID du thread
   * @param content - Le contenu du message
   * @returns Le message créé
   */
  async addMessage(threadId: string, content: string): Promise<any> {
    try {
      const message = await openai.beta.threads.messages.create(threadId, {
        role: 'user',
        content,
      });
      return message;
    } catch (error: any) {
      console.error('Erreur lors de l\'ajout du message:', error);
      throw new Error(`Erreur lors de l'ajout du message: ${error.message}`);
    }
  }

  /**
   * Exécute l'assistant sur le thread spécifié
   * @param threadId - L'ID du thread
   * @returns Le résultat de l'exécution
   */
  async runAssistant(threadId: string): Promise<any> {
    try {
      if (!ASSISTANT_ID) {
        throw new Error("ID de l'assistant non configuré");
      }

      console.log("Exécution de l'assistant avec threadId:", threadId);
      console.log("Type de threadId:", typeof threadId);
      
      if (!threadId || typeof threadId !== 'string' || !threadId.startsWith('thread_')) {
        throw new Error(`threadId invalide: ${threadId}. Doit commencer par 'thread_'`);
      }

      // Créer une exécution
      const run = await openai.beta.threads.runs.create(
        threadId,
        { assistant_id: ASSISTANT_ID }
      );
      console.log("Exécution créée avec succès, runId:", run.id);

      // Attendre que l'exécution soit terminée
      return await this.waitForRunCompletion(threadId, run.id);
    } catch (error: any) {
      console.error('Erreur lors de l\'exécution de l\'assistant:', error);
      throw new Error(`Erreur lors de l'exécution de l'assistant: ${error.message}`);
    }
  }

  /**
   * Attend que l'exécution soit terminée et gère les appels de fonction
   * @param threadId - L'ID du thread
   * @param runId - L'ID de l'exécution
   * @returns Le résultat final de l'exécution
   */
  async waitForRunCompletion(threadId: string, runId: string): Promise<any> {
    console.log(`[DEBUG] Début de waitForRunCompletion - threadId: ${threadId}, runId: ${runId}`);
    
    // Variable pour stocker le résultat de report_api_status s'il est appelé
    let apiStatusResult: any = null;
    
    // Polling pour vérifier l'état de l'exécution
    let run = await openai.beta.threads.runs.retrieve(
      runId,
      { thread_id: threadId }
    );
    
    console.log(`[DEBUG] État initial du run: ${run.status}`);
    
    // Attendre que l'exécution soit terminée ou nécessite une action
    while (run.status === 'queued' || run.status === 'in_progress') {
      // Attendre un peu avant de vérifier à nouveau
      console.log(`[DEBUG] Run en attente ou en cours - status: ${run.status}`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      run = await openai.beta.threads.runs.retrieve(
        runId,
        { thread_id: threadId }
      );
    }

    console.log(`[DEBUG] Run terminé avec status: ${run.status}`);

    // Si l'exécution nécessite une action (appel de fonction)
    if (run.status === 'requires_action') {
      console.log('[DEBUG] Le run nécessite une action (appel de fonction)');
      const toolCalls = run.required_action?.submit_tool_outputs.tool_calls;
      console.log(`[DEBUG] Nombre d'appels de fonction: ${toolCalls?.length || 0}`);
      const toolOutputs = [];

      if (toolCalls) {
        // Traiter chaque appel de fonction
        for (const toolCall of toolCalls) {
          const functionName = toolCall.function.name;
          const functionArgs = JSON.parse(toolCall.function.arguments);
          
          console.log(`[DEBUG] Appel de fonction: ${functionName}`);
          console.log(`[DEBUG] Arguments: ${JSON.stringify(functionArgs, null, 2)}`);

          // Exécuter la fonction correspondante
          if (functionName in availableFunctions) {
            try {
              // Utiliser une assertion de type pour accéder à la fonction
              const func = availableFunctions[functionName as keyof typeof availableFunctions];
              console.log(`[DEBUG] Exécution de la fonction ${functionName}...`);
              const result = await func(functionArgs);
              console.log(`[DEBUG] Résultat de ${functionName}: ${JSON.stringify(result, null, 2)}`);
              
              // Stocker le résultat si c'est un report_api_status
              if (functionName === 'report_api_status') {
                apiStatusResult = result;
              }
              
              toolOutputs.push({
                tool_call_id: toolCall.id,
                output: JSON.stringify(result),
              });
            } catch (error: any) {
              console.error(`[ERROR] Erreur lors de l'exécution de ${functionName}:`, error);
              console.error(`[ERROR] Stack trace:`, error.stack);
              
              toolOutputs.push({
                tool_call_id: toolCall.id,
                output: JSON.stringify({ error: error.message }),
              });
            }
          } else {
            console.warn(`[WARN] Fonction ${functionName} non disponible`);
            toolOutputs.push({
              tool_call_id: toolCall.id,
              output: JSON.stringify({ error: `Fonction ${functionName} non disponible` }),
            });
          }
        }

        // Si on a un résultat de report_api_status, on le retourne directement
        if (apiStatusResult) {
          console.log('[DEBUG] Retour du résultat de report_api_status');
          return { apiStatusResult };
        }

        // Sinon, on continue le traitement normal
        console.log(`[DEBUG] Soumission des résultats des fonctions: ${JSON.stringify(toolOutputs, null, 2)}`);
        await openai.beta.threads.runs.submitToolOutputs(
          runId,
          {
            thread_id: threadId,
            tool_outputs: toolOutputs
          }
        );
        console.log(`[DEBUG] Résultats des fonctions soumis avec succès`);

        // Continuer à attendre la fin de l'exécution
        console.log(`[DEBUG] Reprise de l'attente pour la fin de l'exécution...`);
        return await this.waitForRunCompletion(threadId, runId);
      }
    }

    // Si l'exécution est terminée, récupérer les messages
    if (run.status === 'completed') {
      const messages = await openai.beta.threads.messages.list(threadId);
      return { run, messages: messages.data };
    }

    // Si l'exécution a échoué ou a été annulée
    return { run, error: `L'exécution a terminé avec le statut: ${run.status}` };
  }

  /**
   * Récupère les messages d'un thread
   * @param threadId - L'ID du thread
   * @returns Les messages du thread
   */
  async getMessages(threadId: string): Promise<any[]> {
    try {
      const messages = await openai.beta.threads.messages.list(threadId);
      return messages.data;
    } catch (error: any) {
      console.error('Erreur lors de la récupération des messages:', error);
      throw new Error(`Erreur lors de la récupération des messages: ${error.message}`);
    }
  }

  /**
   * Processus complet pour générer un repas à partir d'une description
   * @param description - Description du repas
   * @returns Le repas généré et ajouté à la base de données
   */
  async generateAndAddMeal(description: string): Promise<any> {
    let threadId: string | null = null;
    
    try {
      // Créer un nouveau thread
      threadId = await this.createThread();
      
      // Ajouter un message avec la description du repas
      await this.addMessage(threadId, `Génère un repas basé sur cette description: ${description}`);
      
      // Exécuter l'assistant
      const run = await openai.beta.threads.runs.create(
        threadId,
        { assistant_id: process.env.OPENAI_ASSISTANT_ID || '' }
      );
      
      // Attendre la fin de l'exécution et gérer les appels de fonction
      const result = await this.waitForRunCompletion(threadId, run.id);
      
      // Vérifier s'il y a une erreur
      if (result.error) {   
        throw new Error(result.error);
      }
      
      // Vérifier s'il y a des messages de l'assistant
      if (result.messages && result.messages.length > 0) {
        const assistantMessage = result.messages.find((m: any) => m.role === 'assistant');
        
        if (assistantMessage) {
          // Si l'assistant a appelé addMeal avec succès, le résultat est déjà traité par waitForRunCompletion
          return {
            success: true,
            message: "Repas généré avec succès"
          };
        }
      }
      
      // Si on arrive ici, c'est qu'il y a eu un problème
      //throw new Error("Impossible de générer le repas. Réponse de l'IA incomplète."); ##ATTENTION
      
    } catch (error: any) {
      console.error('Erreur lors de la génération du repas:', error);
      throw new Error(`Erreur lors de la génération du repas: ${error.message}`);
    } finally {
      // Nettoyer le thread si nécessaire
      if (threadId) {
        try {
          await openai.beta.threads.delete(threadId);
        } catch (cleanupError) {
          console.error('Erreur lors du nettoyage du thread:', cleanupError);
        }
      }
    }
  }

  /**
   * Traite une demande d'ajout d'aliment
   * @param description Description textuelle de l'aliment à ajouter
   */
  async processFoodRequest(description: string): Promise<any> {
    let threadId: string | null = null;
    
    try {
      // Créer un nouveau thread
      threadId = await this.createThread();
      
      // Ajouter le message avec les instructions pour l'assistant
      await this.addMessage(
        threadId,
        `Analyse cette demande et utilise la fonction addFoodItem pour ajouter un nouvel aliment à la base de données. "${description}"`
      );
      
      // Exécuter l'assistant
      const run = await openai.beta.threads.runs.create(
        threadId,
        { assistant_id: process.env.OPENAI_ASSISTANT_ID || '' }
      );
      
      // Attendre la fin de l'exécution et gérer les appels de fonction
      const result = await this.waitForRunCompletion(threadId, run.id);
      
      // Vérifier s'il y a une erreur
      if (result.error) {
        throw new Error(result.error);
      }
      
      // Vérifier s'il y a des messages de l'assistant
      if (result.messages && result.messages.length > 0) {
        const assistantMessage = result.messages.find((m: any) => m.role === 'assistant');
        
        if (assistantMessage) {
          // Si l'assistant a appelé addFoodItem avec succès, le résultat est déjà traité par waitForRunCompletion
          // On peut retourner un message de succès
          return {
            success: true,
            message: "Aliment ajouté avec succès"
          };
        }
      }
      
      // Si on arrive ici, c'est qu'il y a eu un problème
      throw new Error("Impossible d'ajouter l'aliment. Réponse de l'IA incomplète.");
      
    } catch (error: any) {
      console.error('Erreur lors du traitement de la demande de nourriture:', error);
      return {
        success: false,
        message: `Erreur lors du traitement de la demande: ${error.message}`
      };
    } finally {
      // Nettoyer le thread si nécessaire
      if (threadId) {
        try {
          await openai.beta.threads.delete(threadId);
        } catch (cleanupError) {
          console.error('Erreur lors du nettoyage du thread:', cleanupError);
        }
      }
    }
  }
}

export default new OpenAIService();
