import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, Plus, Copy as CopyIcon, Check, X, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import BottomNavigation from "@/components/bottom-navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";

import type { GroceryList, Meal } from "@/../../shared/schema";

function DuplicateMealButton({ meal }: { meal: any }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(`${meal.name} (copie)`);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { id } = useParams<{ id: string }>();
  const listId = id ? parseInt(id) : null;

  const duplicateMealMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/meals/${meal.id}/duplicate`, {});
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Repas dupliqué",
        description: "Votre repas a été dupliqué avec succès",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/grocery-lists/${listId}/meals`] });
      queryClient.invalidateQueries({ queryKey: ["/api/all-meals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/nutrition-logs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/grocery-lists"] });
      setOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de dupliquer le repas",
        variant: "destructive",
      });
    },
  });

  const handleDuplicate = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    duplicateMealMutation.mutate();
  };

  return (
    <Button 
      onClick={handleDuplicate} 
      variant="ghost" 
      size="icon" 
      className="h-5 w-5 p-0 ml-1 hover:bg-transparent"
      disabled={duplicateMealMutation.isPending}
    >
      <CopyIcon className="h-3 w-3 text-gray-500 hover:text-gray-800" />
    </Button>
  );
}

export default function MealPlanning() {
  const { id } = useParams<{ id: string }>();
  const listId = id ? parseInt(id) : null;
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [openMeals, setOpenMeals] = useState<{ [key: number]: boolean }>({});
  const [mealToDelete, setMealToDelete] = useState<number | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const { data: list } = useQuery<GroceryList>({
    queryKey: ["/api/grocery-lists", listId],
    enabled: !!listId,
  });

  const { data: meals = [] } = useQuery<any[]>({
    queryKey: [`/api/grocery-lists/${listId}/meals`],
    enabled: !!listId,
  });

  const toggleMealMutation = useMutation({
    mutationFn: async ({ mealId, completed }: { mealId: number; completed: boolean }) => {
      const updates = {
        completed,
        // Envoyer un objet Date natif au lieu d'une chaîne ISO
        completedAt: completed ? new Date() : null
      };
      
      const response = await apiRequest("PATCH", `/api/meals/${mealId}`, updates);
      return response;
    },
    onSuccess: () => {
      // Invalider les caches pour forcer le rechargement des données
      queryClient.invalidateQueries({ queryKey: [`/api/grocery-lists/${listId}/meals`] });
      queryClient.invalidateQueries({ queryKey: ["/api/nutrition-logs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/grocery-lists"] });
      queryClient.invalidateQueries({ queryKey: ["/api/all-meals"] });
      toast({
        title: "Repas mis à jour",
        description: "Le statut du repas a été enregistré",
      });
    },
    onError: (error: any) => {
      console.error("Erreur lors de la mise à jour du repas:", error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de mettre à jour le repas",
        variant: "destructive",
      });
    },
  });

  const deleteMealMutation = useMutation({
    mutationFn: async (mealId: number) => {
      const response = await apiRequest("DELETE", `/api/meals/${mealId}`, {});
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/grocery-lists/${listId}/meals`] });
      queryClient.invalidateQueries({ queryKey: ["/api/nutrition-logs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/grocery-lists"] });
      queryClient.invalidateQueries({ queryKey: ["/api/all-meals"] });
      toast({
        title: "Repas supprimé",
        description: "Le repas a été supprimé avec succès",
      });
      setDeleteDialogOpen(false);
    },
    onError: (error: any) => {
      console.error("Erreur lors de la suppression du repas:", error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de supprimer le repas",
        variant: "destructive",
      });
    },
  });

  const toggleMealOpen = (mealId: number) => {
    setOpenMeals(prev => ({ ...prev, [mealId]: !prev[mealId] }));
  };
  
  const getIngredientEmojis = (ingredients: any[]) => {
    if (!ingredients || ingredients.length === 0) return "🍽️";
    return ingredients.slice(0, 3).map(ing => ing.foodItem?.emoji || "🥘").join("");
  };

  const getMealBackgroundStyle = (completed: boolean, completedAt: string | null) => {
    if (!completed || !completedAt) return "bg-white/90 dark:bg-gray-800/90";
    
    const hour = new Date(completedAt).getHours();
    
    // Couleurs différentes selon l'heure du repas
    if (hour < 10) return "bg-gradient-to-br from-yellow-50 to-orange-100 dark:from-yellow-900/30 dark:to-orange-800/30";
    if (hour < 14) return "bg-gradient-to-br from-orange-50 to-amber-100 dark:from-orange-900/30 dark:to-amber-800/30";
    if (hour < 18) return "bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/30 dark:to-emerald-800/30";
    return "bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-800/30";
  };

  const handleDeleteMeal = (mealId: number) => {
    setMealToDelete(mealId);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteMeal = () => {
    if (mealToDelete) {
      deleteMealMutation.mutate(mealToDelete);
    }
  };

  if (!list) {
    return (
      <div className="app-container">
        <div className="min-h-screen flex items-center justify-center">
          <div className="glassmorphism rounded-2xl p-8 animate-pulse">
            <div className="w-32 h-8 bg-gray-300 rounded mb-4"></div>
            <div className="w-48 h-4 bg-gray-300 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            Mes repas
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-sm">
            {list.name}
          </p>
        </div>

        {/* Meals List */}
        <div className="space-y-6">
          {Array.isArray(meals) && meals.length === 0 ? (
            <div className="col-span-full space-y-4">
              <Card className="glassmorphism border-0 shadow-lg border-2 border-white/30">
                <CardContent className="p-6 text-center">
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Aucun repas planifié
                  </p>
                </CardContent>
              </Card>
              
              <div className="text-center">
                <Button
                  onClick={() => setLocation("/lists")}
                  className="glassmorphism border-2 border-white/30 bg-white/20 hover:bg-white/30 text-gray-700 shadow-lg"
                  variant="outline"
                >
                  Retour aux listes
                </Button>
              </div>
            </div>
          ) : (
            Array.isArray(meals) && meals.length > 0 ? meals.map((meal: any) => (
              <Collapsible 
                key={meal.id} 
                open={openMeals[meal.id]} 
                onOpenChange={() => toggleMealOpen(meal.id)}
              >
                <Card className={`${getMealBackgroundStyle(meal.completed, meal.completedAt)} glassmorphism meal-card backdrop-blur-sm border-2 border-white/30 shadow-lg overflow-hidden rounded-2xl relative`}>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="p-4 cursor-pointer hover:bg-white/20 dark:hover:bg-gray-700/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-3">
                              {/* Simple bouton mangé/pas mangé */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleMealMutation.mutate({
                                    mealId: meal.id,
                                    completed: !meal.completed
                                  });
                                }}
                                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                                  meal.completed 
                                    ? 'bg-green-100 text-green-800 border border-green-300' 
                                    : 'bg-orange-100 text-orange-800 border border-orange-300 hover:bg-orange-200'
                                }`}
                              >
                                {meal.completed ? '✓ Mangé' : 'À manger'}
                              </button>
                              <span className="text-lg">
                                {getIngredientEmojis(meal.ingredients)}
                              </span>
                            </div>
                          <div className="flex items-center">
                            <div>
                              <h3 className="font-medium text-gray-900 dark:text-white text-sm">
                                {meal.name}
                              </h3>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {meal.calories} cal • {meal.protein}g protéines
                              </p>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                <p>Créé le {meal.createdAt ? new Date(meal.createdAt).toLocaleDateString("fr-FR") : "Date inconnue"}</p>
                                {meal.completed && meal.completedAt && (
                                  <p className="text-green-600 font-medium">
                                    Je l'ai mangé le {new Date(meal.completedAt).toLocaleDateString("fr-FR")} à {new Date(meal.completedAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteMeal(meal.id);
                            }}
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-full"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          {openMeals[meal.id] ? (
                            <ChevronDown className="h-4 w-4 text-gray-400" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-gray-400" />
                          )}
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <CardContent className="p-4 pt-0 border-t border-white/20 dark:border-gray-700">
                      {/* Macros */}
                      <div className="grid grid-cols-3 gap-3 mb-3">
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Protéines</p>
                          <p className="font-semibold text-blue-600 text-sm">{meal.protein}g</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Lipides</p>
                          <p className="font-semibold text-green-600 text-sm">{meal.fat}g</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Glucides</p>
                          <p className="font-semibold text-orange-600 text-sm">{meal.carbs}g</p>
                        </div>
                      </div>
                      
                      {/* Ingredients */}
                      {meal.ingredients && meal.ingredients.length > 0 && (
                        <div>
                          <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Ingrédients:
                          </h4>
                          <div className="space-y-1">
                            {meal.ingredients.map((ingredient: any, index: number) => (
                              <div key={index} className="flex items-center gap-2">
                                <span className="text-sm">{ingredient.foodItem?.emoji}</span>
                                <span className="text-xs text-gray-600 dark:text-gray-400">
                                  {ingredient.foodItem?.name} ({ingredient.quantity} {ingredient.unit})
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </CollapsibleContent>
                  
                  {/* Bouton de duplication (en bas à droite) */}
                  <div className="absolute bottom-2 right-2">
                    <DuplicateMealButton meal={meal} />
                  </div>
                </Card>
              </Collapsible>
            )) : <p>Aucun repas disponible</p>
          )}
        </div>


      </div>

      <BottomNavigation />
      
      {/* Dialog de confirmation de suppression */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="glassmorphism border-2 border-white/30">
          <DialogHeader>
            <DialogTitle className="text-gray-800">Confirmer la suppression</DialogTitle>
          </DialogHeader>
          <p className="text-gray-600">Êtes-vous sûr de vouloir supprimer ce repas ? Cette action est irréversible.</p>
          <div className="flex gap-2 justify-end mt-4">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              className="glassmorphism border-2 border-white/30 text-gray-700"
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteMeal}
              disabled={deleteMealMutation.isPending}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {deleteMealMutation.isPending ? "Suppression..." : "Supprimer"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}