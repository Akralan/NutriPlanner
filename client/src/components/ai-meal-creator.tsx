import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="space-y-6">
      {/* AI Meal Creator */}
      <Card className="bg-white/20 dark:bg-black/20 backdrop-blur-md border border-white/30 dark:border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-rose-800 dark:text-rose-200">
            <Sparkles className="h-5 w-5" />
            Créateur de repas IA
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-rose-700 dark:text-rose-300">
              Décrivez le repas souhaité
            </label>
            <Textarea
              placeholder="Ex: Un plat végétarien riche en protéines avec des légumes de saison..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              className="bg-white/50 dark:bg-black/50 border-rose-200 dark:border-rose-700"
              rows={3}
            />
            <div className="text-xs text-rose-600 dark:text-rose-400">
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
        </CardContent>
      </Card>

      {/* AI Suggestions */}
      <Card className="bg-white/20 dark:bg-black/20 backdrop-blur-md border border-white/30 dark:border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-rose-800 dark:text-rose-200">
            <Lightbulb className="h-5 w-5" />
            Suggestions de repas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-rose-700 dark:text-rose-300">
              Vos préférences alimentaires
            </label>
            <Input
              placeholder="Ex: végétarien, sans gluten, méditerranéen..."
              value={preferences}
              onChange={(e) => setPreferences(e.target.value)}
              maxLength={200}
              className="bg-white/50 dark:bg-black/50 border-rose-200 dark:border-rose-700"
            />
          </div>

          <Button
            onClick={handleGetSuggestions}
            disabled={getSuggestionsMutation.isPending || !preferences.trim()}
            variant="outline"
            className="w-full border-rose-300 text-rose-700 hover:bg-rose-50 dark:border-rose-600 dark:text-rose-300 dark:hover:bg-rose-950"
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

          {suggestions.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium text-rose-700 dark:text-rose-300">
                Suggestions générées :
              </div>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((suggestion, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="cursor-pointer bg-rose-100 text-rose-800 hover:bg-rose-200 dark:bg-rose-900 dark:text-rose-200 dark:hover:bg-rose-800"
                    onClick={() => handleUseSuggestion(suggestion)}
                  >
                    {suggestion}
                  </Badge>
                ))}
              </div>
              <div className="text-xs text-rose-600 dark:text-rose-400">
                Cliquez sur une suggestion pour l'utiliser
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}