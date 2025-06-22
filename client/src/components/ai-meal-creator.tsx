import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, Lightbulb } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AiMealCreatorProps {
  listId: number;
  onMealCreated?: () => void;
}

export default function AiMealCreator({ listId, onMealCreated }: AiMealCreatorProps) {
  const [description, setDescription] = useState("");
  const [preferences, setPreferences] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createMealMutation = useMutation({
    mutationFn: async (data: { description: string; listId: number }) => {
      const response = await apiRequest("POST", "/api/ai/create-meal", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Repas créé avec succès",
        description: "Votre repas a été généré par l'IA et ajouté à votre liste",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/meals", listId] });
      setDescription("");
      onMealCreated?.();
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer le repas",
        variant: "destructive",
      });
    },
  });

  const getSuggestionsMutation = useMutation({
    mutationFn: async (prefs: string) => {
      const response = await apiRequest("POST", "/api/ai/meal-suggestions", {
        preferences: prefs,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setSuggestions(data.suggestions || []);
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de générer des suggestions",
        variant: "destructive",
      });
    },
  });

  const handleCreateMeal = () => {
    if (!description.trim()) {
      toast({
        title: "Description requise",
        description: "Veuillez décrire le repas que vous souhaitez créer",
        variant: "destructive",
      });
      return;
    }

    createMealMutation.mutate({
      description: description.trim(),
      listId,
    });
  };

  const handleGetSuggestions = () => {
    if (!preferences.trim()) {
      toast({
        title: "Préférences requises",
        description: "Décrivez vos préférences alimentaires pour obtenir des suggestions",
        variant: "destructive",
      });
      return;
    }

    getSuggestionsMutation.mutate(preferences.trim());
  };

  const handleUseSuggestion = (suggestion: string) => {
    setDescription(suggestion);
    setSuggestions([]);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* AI Meal Creator */}
      <div className="glassmorphism rounded-2xl p-6 shadow-lg border-2 border-white/30">
        <div className="flex items-center gap-2 text-rose-600 mb-4">
          <Sparkles className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Créateur de repas IA</h3>
        </div>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-rose-700">
              Décrivez le repas souhaité
            </label>
            <Textarea
              placeholder="Ex: Un plat végétarien riche en protéines avec des légumes de saison..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              className="glassmorphism-input border-white/30 resize-none h-24"
              rows={3}
            />
            <div className="text-xs text-rose-600">
              {description.length}/500 caractères
            </div>
          </div>

          <Button
            onClick={handleCreateMeal}
            disabled={createMealMutation.isPending || !description.trim()}
            className="w-full bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600"
          >
            {createMealMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Création en cours...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Créer le repas avec l'IA
              </>
            )}
          </Button>
        </div>
      </div>

      {/* AI Suggestions */}
      <div className="glassmorphism rounded-2xl p-6 shadow-lg border-2 border-white/30">
        <div className="flex items-center gap-2 text-rose-600 mb-4">
          <Lightbulb className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Suggestions de repas</h3>
        </div>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-rose-700">
              Vos préférences alimentaires
            </label>
            <Input
              placeholder="Ex: végétarien, sans gluten, méditerranéen..."
              value={preferences}
              onChange={(e) => setPreferences(e.target.value)}
              maxLength={200}
              className="glassmorphism-input border-white/30"
            />
          </div>

          <Button
            onClick={handleGetSuggestions}
            disabled={getSuggestionsMutation.isPending || !preferences.trim()}
            variant="outline"
            className="w-full border-rose-300 text-rose-700 hover:bg-rose-50 glassmorphism-button"
          >
            {getSuggestionsMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Génération...
              </>
            ) : (
              <>
                <Lightbulb className="h-4 w-4 mr-2" />
                Obtenir des suggestions
              </>
            )}
          </Button>

          {/* Suggestions List */}
          {suggestions.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-rose-700">Suggestions :</h4>
              <div className="space-y-2">
                {suggestions.map((suggestion, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="cursor-pointer p-2 text-xs bg-rose-100 text-rose-800 hover:bg-rose-200 block"
                    onClick={() => handleUseSuggestion(suggestion)}
                  >
                    {suggestion}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}