import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import BottomNavigation from "@/components/bottom-navigation";

import type { GroceryList, Meal } from "@shared/schema";

export default function MealPlanning() {
  const { id } = useParams<{ id: string }>();
  const listId = id ? parseInt(id) : null;
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [openMeals, setOpenMeals] = useState<{ [key: number]: boolean }>({});

  const { data: list } = useQuery<GroceryList>({
    queryKey: ["/api/grocery-lists", listId],
    enabled: !!listId,
  });

  const { data: meals = [] } = useQuery<any[]>({
    queryKey: [`/api/grocery-lists/${listId}/meals`],
    enabled: !!listId,
  });

  const toggleMealMutation = useMutation({
    mutationFn: async ({ mealId, completed, meal }: { mealId: number; completed: boolean; meal: any }) => {
      const updateData = completed 
        ? { completed, completedAt: new Date().toISOString() }
        : { completed, completedAt: null };
      
      const updatedMeal = await apiRequest("PATCH", `/api/meals/${mealId}`, updateData);
      
      // Update nutrition log to recalculate totals
      if (meal) {
        await apiRequest("POST", "/api/nutrition-logs", {
          totalCalories: 0, // Server will recalculate based on actual completed meals
          totalProtein: 0,
          totalFat: 0,
          totalCarbs: 0,
          targetCalories: 2200,
          mealsCompleted: 0,
        });
      }
      
      return updatedMeal;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/grocery-lists/${listId}/meals`] });
      queryClient.invalidateQueries({ queryKey: ["/api/nutrition-logs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/all-meals"] }); // Invalidate home page cache
      queryClient.invalidateQueries({ queryKey: ["/api/grocery-lists"] }); // Invalidate lists cache
      toast({
        title: "Repas mis à jour",
        description: "Le statut du repas a été enregistré",
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

  const getMealBackgroundStyle = (completedAt: string | null) => {
    if (!completedAt) return "bg-white/90 dark:bg-gray-800/90";
    
    const hour = new Date(completedAt).getHours();
    
    if (hour >= 5 && hour < 9) {
      // Petit déjeuner - levé de soleil (rose-orange pastel)
      return "bg-gradient-to-br from-orange-100/80 via-pink-100/80 to-yellow-100/80 dark:from-orange-900/40 dark:via-pink-900/40 dark:to-yellow-900/40";
    } else if (hour >= 9 && hour < 15) {
      // Déjeuner - soleil au milieu (jaune-bleu pastel)
      return "bg-gradient-to-br from-blue-100/80 via-cyan-100/80 to-yellow-100/80 dark:from-blue-900/40 dark:via-cyan-900/40 dark:to-yellow-900/40";
    } else if (hour >= 15 && hour < 19) {
      // Goûter/fin d'après-midi - soleil bas (orange-violet pastel)
      return "bg-gradient-to-br from-orange-100/80 via-purple-100/80 to-pink-100/80 dark:from-orange-900/40 dark:via-purple-900/40 dark:to-pink-900/40";
    } else if (hour >= 19 && hour < 23) {
      // Dîner - soir (violet-bleu foncé pastel)
      return "bg-gradient-to-br from-purple-100/80 via-indigo-100/80 to-blue-200/80 dark:from-purple-900/40 dark:via-indigo-900/40 dark:to-blue-900/40";
    } else {
      // Nuit - très foncé (bleu-violet très foncé pastel)
      return "bg-gradient-to-br from-slate-200/80 via-blue-200/80 to-indigo-200/80 dark:from-slate-900/60 dark:via-blue-900/60 dark:to-indigo-900/60";
    }
  };

  if (!list) {
    return (
      <div className="app-container fade-for-mic">
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
    <div className="app-container fade-for-mic">
      <div className="p-4 space-y-4 max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center pt-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            Mes repas
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-sm">
            {list.name}
          </p>
        </div>

        {/* Meals List */}
        <div className={`gap-6 ${
          meals.length === 1 ? 'flex justify-center' :
          meals.length === 2 ? 'grid grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto' :
          'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
        }`}>
          {meals.length === 0 ? (
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
            meals.map((meal) => (
              <Collapsible 
                key={meal.id} 
                open={openMeals[meal.id]} 
                onOpenChange={() => toggleMealOpen(meal.id)}
              >
                <Card className={`${getMealBackgroundStyle(meal.completedAt)} backdrop-blur-sm border-0 shadow-lg border-2 border-white/30 overflow-hidden`}>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="p-4 cursor-pointer hover:bg-white/20 dark:hover:bg-gray-700/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleMealMutation.mutate({
                                  mealId: meal.id,
                                  completed: !meal.completed,
                                  meal
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
                              {!meal.completed && (
                                <p className="text-orange-600 font-medium">À manger</p>
                              )}
                            </div>
                          </div>
                        </div>
                        {openMeals[meal.id] ? (
                          <ChevronDown className="h-4 w-4 text-gray-400" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-gray-400" />
                        )}
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
                </Card>
              </Collapsible>
            ))
          )}
        </div>


      </div>

      <BottomNavigation />
    </div>
  );
}