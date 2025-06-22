import { useState, useEffect, useCallback } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth, calculateDailyCalories, calculateCaloriesPerMeal, calculateMacros } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import BottomNavigation from "@/components/bottom-navigation";
import FoodCategory from "@/components/food-category";
import NutritionModal from "@/components/nutrition-modal";
import MacroProgress from "@/components/macro-progress";
import { foodCategories, seasons } from "@/lib/food-data";
import type { FoodItem, GroceryList, ListItem } from "@shared/schema";

export default function FoodSelection() {
  const { id } = useParams<{ id: string }>();
  const listId = id ? parseInt(id) : null;
  const [selectedSeason, setSelectedSeason] = useState("all");
  const [selectedFoodItem, setSelectedFoodItem] = useState<FoodItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentMealMacros, setCurrentMealMacros] = useState({
    calories: 0,
    protein: 0,
    fat: 0,
    carbs: 0,
    ingredientCount: 0
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: groceryList } = useQuery<GroceryList>({
    queryKey: ["/api/grocery-lists", listId],
    enabled: !!listId,
  });

  const { data: listItems = [] } = useQuery<any[]>({
    queryKey: [`/api/grocery-lists/${listId}/items`],
    enabled: !!listId,
  });

  // Calculate target calories per meal
  const targetCaloriesPerMeal = user?.weight && user?.height 
    ? calculateCaloriesPerMeal(
        calculateDailyCalories(user.weight, user.height, user.weeklyWorkouts || 0, user.calorieThreshold || 0),
        user.mealsPerDay || 3
      )
    : 600; // fallback

  // Get food items with nutrition data
  const { data: foodItems = [] } = useQuery<FoodItem[]>({
    queryKey: ["/api/food-items"],
  });

  // Calculate current meal progress
  useEffect(() => {
    if (!listItems || !foodItems) return;

    let totalCalories = 0;
    let totalProtein = 0;
    let totalFat = 0;
    let totalCarbs = 0;
    let ingredientCount = 0;

    listItems.forEach(item => {
      const foodItem = foodItems.find(f => f.id === item.foodItemId);
      if (foodItem?.nutrition) {
        const nutrition = foodItem.nutrition as any;
        const multiplier = item.quantity || 1;
        totalCalories += (nutrition.calories || 0) * multiplier;
        totalProtein += (nutrition.protein || 0) * multiplier;
        totalFat += (nutrition.fat || 0) * multiplier;
        totalCarbs += (nutrition.carbs || 0) * multiplier;
        ingredientCount += multiplier;
      }
    });

    setCurrentMealMacros({
      calories: totalCalories,
      protein: totalProtein,
      fat: totalFat,
      carbs: totalCarbs,
      ingredientCount
    });
  }, [listItems?.length, foodItems?.length]);

  const createMealMutation = useMutation({
    mutationFn: async () => {
      if (!listId) throw new Error("No list selected");
      
      return apiRequest("POST", "/api/meals", {
        listId,
        name: `Repas ${new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`,
        calories: Math.round(currentMealMacros.calories),
        protein: Math.round(currentMealMacros.protein),
        fat: Math.round(currentMealMacros.fat),
        carbs: Math.round(currentMealMacros.carbs),
        completed: false,
        ingredients: listItems.map(item => ({
          foodItemId: item.foodItemId,
          quantity: item.quantity,
          unit: item.unit
        }))
      });
    },
    onSuccess: () => {
      toast({
        title: "Repas validé",
        description: "Le repas a été ajouté à votre liste !",
      });
      
      // Update nutrition log
      if (user) {
        const targetCalories = calculateDailyCalories(
          user.weight || 70,
          user.height || 170,
          user.weeklyWorkouts || 3,
          user.calorieThreshold || 0
        );
        
        apiRequest("POST", "/api/nutrition-logs", {
          totalCalories: currentMealMacros.calories,
          totalProtein: currentMealMacros.protein,
          totalFat: currentMealMacros.fat,
          totalCarbs: currentMealMacros.carbs,
          targetCalories,
          mealsCompleted: 1,
        }).catch(error => console.error("Failed to update nutrition log:", error));
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/grocery-lists"] });
      queryClient.invalidateQueries({ queryKey: [`/api/grocery-lists/${listId}/items`] });
      queryClient.invalidateQueries({ queryKey: ["/api/nutrition-logs"] });
      
      // Clear all list items for next meal
      queryClient.setQueryData([`/api/grocery-lists/${listId}/items`], []);
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de valider le repas.",
        variant: "destructive",
      });
    },
  });

  const handleFoodItemClick = (item: FoodItem) => {
    setSelectedFoodItem(item);
    setIsModalOpen(true);
  };

  const handleValidateMeal = () => {
    if (currentMealMacros.calories < targetCaloriesPerMeal * 0.8) {
      toast({
        title: "Repas incomplet",
        description: "Ajoutez plus d'aliments pour atteindre vos objectifs nutritionnels.",
        variant: "destructive",
      });
      return;
    }
    createMealMutation.mutate();
  };

  // Check if meal is complete (80% of target calories)
  const isMealComplete = currentMealMacros.calories >= targetCaloriesPerMeal * 0.8;

  if (!listId || !groceryList) {
    return (
      <div className="app-container">
        <div className="p-6 pb-24">
          <div className="glassmorphism rounded-2xl p-8 shadow-lg text-center">
            <span className="text-4xl mb-4 block">📋</span>
            <h3 className="text-lg font-bold text-gray-800 mb-2">Liste non trouvée</h3>
            <p className="text-gray-600">Retournez à vos listes de courses.</p>
          </div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Header */}
      <header className="glassmorphism rounded-b-3xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-gray-800">{groceryList.name}</h1>
          <div className="glassmorphism-dark rounded-full p-2">
            <span className="text-xl">🥗</span>
          </div>
        </div>

        {/* Real-time Macro Progress */}
        <MacroProgress 
          currentCalories={currentMealMacros.calories}
          targetCalories={targetCaloriesPerMeal}
          currentProtein={currentMealMacros.protein}
          currentFat={currentMealMacros.fat}
          currentCarbs={currentMealMacros.carbs}
          isMinimal={true}
        />

        {/* Validate Meal Button */}
        {isMealComplete && (
          <div className="mt-4">
            <Button
              onClick={handleValidateMeal}
              disabled={createMealMutation.isPending}
              className="w-full glassmorphism border-2 border-green-300 rounded-2xl p-3 text-green-800 font-bold hover:bg-green-200/40 transition-all bg-green-100/40"
            >
              {createMealMutation.isPending ? "Validation..." : "✓ Valider ce repas"}
            </Button>
          </div>
        )}

        {/* Season Filter */}
        <div className="flex space-x-2 overflow-x-auto pb-2 mt-4">
          {seasons.map((season) => (
            <Button
              key={season.id}
              variant="ghost"
              size="sm"
              className={`rounded-full px-4 py-2 text-sm font-bold whitespace-nowrap border-0 ${
                selectedSeason === season.id
                  ? "glassmorphism border-2 border-white/40 text-gray-800 bg-white/50"
                  : "glassmorphism text-gray-800 border-2 border-white/20"
              }`}
              onClick={() => setSelectedSeason(season.id)}
            >
              {season.emoji} {season.name}
            </Button>
          ))}
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6 pb-24">
        {/* Food Categories */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Ajouter des aliments</h3>
          {foodCategories.map((category) => (
            <FoodCategory
              key={category.id}
              category={category}
              selectedSeason={selectedSeason}
              onItemClick={handleFoodItemClick}
            />
          ))}
        </div>
      </main>

      <BottomNavigation />

      <NutritionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        foodItem={selectedFoodItem}
        currentListId={listId}
      />
    </div>
  );
}