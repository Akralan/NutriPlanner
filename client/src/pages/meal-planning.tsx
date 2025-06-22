import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import BottomNavigation from "@/components/bottom-navigation";
import FoodCategory from "@/components/food-category";
import { foodCategories } from "@/lib/food-data";
import type { Meal, FoodItem, GroceryList } from "@shared/schema";

export default function MealPlanning() {
  const params = useParams();
  const listId = parseInt(params.id || "0");
  const [isAddMealOpen, setIsAddMealOpen] = useState(false);
  const [selectedIngredients, setSelectedIngredients] = useState<Array<{ foodItemId: number; quantity: number; unit: string; foodItem: FoodItem }>>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: groceryList } = useQuery<GroceryList>({
    queryKey: [`/api/grocery-lists/${listId}`],
  });

  const { data: meals = [], isLoading } = useQuery<Meal[]>({
    queryKey: [`/api/grocery-lists/${listId}/meals`],
  });

  const createMealMutation = useMutation({
    mutationFn: async () => {
      if (selectedIngredients.length < 4) {
        throw new Error("Un repas doit contenir au moins 3 aliments + 1 source de protéine");
      }

      const hasProtein = selectedIngredients.some(ing => ing.foodItem.category === "proteins");
      if (!hasProtein) {
        throw new Error("Un repas doit contenir une source de protéine");
      }

      const mealName = `Repas #${meals.length + 1}`;
      
      return apiRequest("POST", "/api/meals", {
        listId,
        name: mealName,
        completed: false,
        ingredients: selectedIngredients.map(ing => ({
          foodItemId: ing.foodItemId,
          quantity: ing.quantity,
          unit: ing.unit,
        })),
      });
    },
    onSuccess: () => {
      toast({
        title: "Repas ajouté",
        description: "Le nouveau repas a été ajouté à votre planification.",
      });
      setSelectedIngredients([]);
      setIsAddMealOpen(false);
      queryClient.invalidateQueries({ queryKey: [`/api/grocery-lists/${listId}/meals`] });
      queryClient.invalidateQueries({ queryKey: ["/api/grocery-lists"] });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMealMutation = useMutation({
    mutationFn: async ({ mealId, completed }: { mealId: number; completed: boolean }) => {
      return apiRequest("PATCH", `/api/meals/${mealId}`, { completed });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/grocery-lists/${listId}/meals`] });
      toast({
        title: "Repas mis à jour",
        description: "Le statut du repas a été modifié.",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le repas.",
        variant: "destructive",
      });
    },
  });

  const handleAddIngredient = (foodItem: FoodItem) => {
    const existing = selectedIngredients.find(ing => ing.foodItemId === foodItem.id);
    if (existing) {
      setSelectedIngredients(prev => 
        prev.map(ing => 
          ing.foodItemId === foodItem.id 
            ? { ...ing, quantity: ing.quantity + 1 }
            : ing
        )
      );
    } else {
      setSelectedIngredients(prev => [...prev, {
        foodItemId: foodItem.id,
        quantity: 1,
        unit: "portions",
        foodItem,
      }]);
    }
  };

  const handleRemoveIngredient = (foodItemId: number) => {
    setSelectedIngredients(prev => prev.filter(ing => ing.foodItemId !== foodItemId));
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "vegetables": return "bg-green-100 text-green-700";
      case "fruits": return "bg-yellow-100 text-yellow-700";
      case "proteins": return "bg-red-100 text-red-700";
      case "starches": return "bg-blue-100 text-blue-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  if (isLoading) {
    return (
      <div className="app-container">
        <div className="p-6 pb-24">
          <div className="flex items-center justify-between mb-6">
            <div className="w-48 h-8 bg-gray-300 rounded animate-pulse"></div>
            <div className="w-8 h-8 bg-gray-300 rounded-full animate-pulse"></div>
          </div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="glassmorphism rounded-2xl p-4 shadow-lg animate-pulse">
                <div className="w-32 h-6 bg-gray-300 rounded mb-3"></div>
                <div className="flex flex-wrap gap-2">
                  {[...Array(4)].map((_, j) => (
                    <div key={j} className="w-20 h-6 bg-gray-300 rounded-full"></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="p-6 pb-24">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            {groceryList?.name || "Planificateur de repas"}
          </h2>
          <Link href="/lists">
            <button className="glassmorphism rounded-full p-2 hover:bg-white/30 transition-colors">
              <span className="text-xl">←</span>
            </button>
          </Link>
        </div>
        
        {/* Add New Meal Button */}
        <Button
          onClick={() => setIsAddMealOpen(true)}
          className="w-full glassmorphism rounded-2xl p-4 shadow-lg hover:scale-105 transition-transform mb-6 border-0 bg-transparent text-gray-800 font-semibold text-lg hover:bg-white/30"
        >
          <div className="flex items-center justify-center space-x-3">
            <span className="text-2xl">🍽️</span>
            <span>Faire un nouveau repas</span>
          </div>
        </Button>
        
        {/* Planned Meals List */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Repas planifiés</h3>
          
          {meals.length === 0 ? (
            <div className="glassmorphism rounded-2xl p-8 shadow-lg text-center">
              <span className="text-4xl mb-4 block">🍽️</span>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Aucun repas planifié</h3>
              <p className="text-gray-600">Commencez par ajouter votre premier repas.</p>
            </div>
          ) : (
            meals.map((meal) => (
              <div key={meal.id} className="glassmorphism rounded-2xl p-4 shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-800">{meal.name}</h4>
                  <input
                    type="checkbox"
                    checked={meal.completed}
                    onChange={(e) => 
                      updateMealMutation.mutate({ 
                        mealId: meal.id, 
                        completed: e.target.checked 
                      })
                    }
                    className="w-5 h-5 text-green-500 rounded"
                    disabled={updateMealMutation.isPending}
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {(meal.ingredients as any[]).map((ingredient, index) => (
                      <span
                        key={index}
                        className={`text-xs px-2 py-1 rounded-full flex items-center ${getCategoryColor(ingredient.foodItem?.category || "")}`}
                      >
                        {ingredient.foodItem?.emoji} {ingredient.foodItem?.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <BottomNavigation />

      {/* Add Meal Dialog */}
      <Dialog open={isAddMealOpen} onOpenChange={setIsAddMealOpen}>
        <DialogContent className="glassmorphism rounded-3xl border-0 shadow-xl max-w-lg mx-4 max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-800">
              Créer un nouveau repas
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Selected Ingredients */}
            {selectedIngredients.length > 0 && (
              <div className="glassmorphism-dark rounded-xl p-4">
                <h4 className="font-semibold text-white mb-3">Ingrédients sélectionnés</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedIngredients.map((ingredient) => (
                    <div
                      key={ingredient.foodItemId}
                      className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${getCategoryColor(ingredient.foodItem.category)}`}
                    >
                      {ingredient.foodItem.emoji} {ingredient.foodItem.name}
                      <button
                        onClick={() => handleRemoveIngredient(ingredient.foodItemId)}
                        className="ml-1 text-xs hover:text-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-300 mt-2">
                  {selectedIngredients.length}/4+ ingrédients 
                  {!selectedIngredients.some(ing => ing.foodItem.category === "proteins") && 
                    " (manque une protéine)"}
                </p>
              </div>
            )}

            {/* Food Categories */}
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {foodCategories.map((category) => (
                <FoodCategory
                  key={category.id}
                  category={category}
                  selectedSeason="all"
                  onItemClick={handleAddIngredient}
                />
              ))}
            </div>

            {/* Create Meal Button */}
            <Button
              onClick={() => createMealMutation.mutate()}
              disabled={createMealMutation.isPending || selectedIngredients.length < 4 || !selectedIngredients.some(ing => ing.foodItem.category === "proteins")}
              className="w-full glassmorphism-dark border-0 rounded-2xl p-3 text-white font-semibold hover:bg-white/20 transition-all disabled:opacity-50"
            >
              {createMealMutation.isPending ? "Création..." : "Créer le repas"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
