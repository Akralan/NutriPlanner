import { useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import BottomNavigation from "@/components/bottom-navigation";
import type { GroceryList, Meal } from "@shared/schema";

export default function MealPlanning() {
  const { id } = useParams<{ id: string }>();
  const listId = id ? parseInt(id) : null;
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
      const updatedMeal = await apiRequest("PATCH", `/api/meals/${mealId}`, { completed });
      
      // If meal is being marked as completed, update nutrition log
      if (completed && meal) {
        await apiRequest("POST", "/api/nutrition-logs", {
          totalCalories: meal.calories,
          totalProtein: meal.protein,
          totalFat: meal.fat,
          totalCarbs: meal.carbs,
          targetCalories: 2200, // Default target
          mealsCompleted: 1,
        });
      }
      
      return updatedMeal;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/grocery-lists/${listId}/meals`] });
      queryClient.invalidateQueries({ queryKey: ["/api/nutrition-logs"] });
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

  if (!list) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 pb-20">
      <div className="p-4 space-y-4">
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
        <div className="space-y-3">
          {meals.length === 0 ? (
            <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-0 shadow-md">
              <CardContent className="p-4 text-center">
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  Aucun repas planifié
                </p>
              </CardContent>
            </Card>
          ) : (
            meals.map((meal) => (
              <Collapsible 
                key={meal.id} 
                open={openMeals[meal.id]} 
                onOpenChange={() => toggleMealOpen(meal.id)}
              >
                <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-0 shadow-md overflow-hidden">
                  <CollapsibleTrigger asChild>
                    <CardHeader className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={meal.completed || false}
                              onCheckedChange={(checked) => {
                                toggleMealMutation.mutate({
                                  mealId: meal.id,
                                  completed: !!checked,
                                  meal
                                });
                              }}
                              onClick={(e) => e.stopPropagation()}
                            />
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
                    <CardContent className="p-4 pt-0 border-t border-gray-100 dark:border-gray-700">
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