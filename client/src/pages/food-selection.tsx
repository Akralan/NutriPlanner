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
  
  // Check if we're adding to an existing meal
  const urlParams = new URLSearchParams(window.location.search);
  const mealId = urlParams.get('mealId') ? parseInt(urlParams.get('mealId')!) : null;
  
  const [selectedSeason, setSelectedSeason] = useState("all");
  const [selectedFoodItem, setSelectedFoodItem] = useState<FoodItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
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

  // Get existing meals for color coding
  const { data: existingMeals = [] } = useQuery<any[]>({
    queryKey: [`/api/grocery-lists/${listId}/meals`],
    enabled: !!listId,
  });

  // Color system for meal badges - using explicit Tailwind classes
  const mealColors = [
    { bg: "bg-blue-500", text: "text-blue-500" },
    { bg: "bg-green-500", text: "text-green-500" },
    { bg: "bg-purple-500", text: "text-purple-500" },
    { bg: "bg-orange-500", text: "text-orange-500" },
    { bg: "bg-pink-500", text: "text-pink-500" },
    { bg: "bg-teal-500", text: "text-teal-500" },
    { bg: "bg-red-500", text: "text-red-500" },
    { bg: "bg-indigo-500", text: "text-indigo-500" }
  ];

  // Function to get meal color by index
  const getMealColor = (mealIndex: number) => {
    return mealColors[mealIndex % mealColors.length];
  };

  // Function to check if a food item is in any existing meal and return the meal info
  const getFoodItemMealInfo = (foodItemId: number) => {
    for (let i = 0; i < existingMeals.length; i++) {
      const meal = existingMeals[i];
      if (meal.ingredients && meal.ingredients.some((ing: any) => ing.foodItemId === foodItemId)) {
        return {
          mealIndex: i + 1,
          color: getMealColor(i).bg,
          mealId: meal.id
        };
      }
    }
    return null;
  };

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
        name: "Mon repas",
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
      
      // Delete all current list items from the database before invalidating cache
      const deletePromises = listItems.map(item => 
        apiRequest("DELETE", `/api/grocery-lists/${listId}/items/${item.id}`)
      );
      
      Promise.all(deletePromises).then(() => {
        queryClient.invalidateQueries({ queryKey: ["/api/grocery-lists"] });
        queryClient.invalidateQueries({ queryKey: [`/api/grocery-lists/${listId}/items`] });
        queryClient.invalidateQueries({ queryKey: [`/api/grocery-lists/${listId}/meals`] }); // Invalidate meals to update pastilles
        queryClient.invalidateQueries({ queryKey: ["/api/nutrition-logs"] });
        queryClient.invalidateQueries({ queryKey: ["/api/all-meals"] }); // Invalidate home page cache
      }).catch(error => {
        console.error("Failed to clear list items:", error);
        // Fallback: just clear the cache data
        queryClient.setQueryData([`/api/grocery-lists/${listId}/items`], []);
        queryClient.invalidateQueries({ queryKey: ["/api/grocery-lists"] });
        queryClient.invalidateQueries({ queryKey: [`/api/grocery-lists/${listId}/items`] });
        queryClient.invalidateQueries({ queryKey: [`/api/grocery-lists/${listId}/meals`] });
        queryClient.invalidateQueries({ queryKey: ["/api/nutrition-logs"] });
        queryClient.invalidateQueries({ queryKey: ["/api/all-meals"] });
      });
      
      // Reset current meal macros for next meal
      setCurrentMealMacros({
        calories: 0,
        protein: 0,
        fat: 0,
        carbs: 0,
        ingredientCount: 0
      });
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
    <div className="app-container lg:max-w-6xl">
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
              className={`rounded-full px-4 py-2 text-sm font-bold whitespace-nowrap border-2 transition-all duration-200 ${
                selectedSeason === season.id
                  ? "glassmorphism border-purple-400/80 text-purple-800 bg-purple-200/60 shadow-lg ring-2 ring-purple-300/40"
                  : "glassmorphism text-gray-700 border-white/30 hover:border-purple-300/50 hover:bg-purple-50/30"
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
          
          {/* Existing Meals List */}
          {existingMeals.length > 0 && (
            <div className="mb-4 p-3 glassmorphism rounded-xl border-2 border-white/20">
              <p className="text-xs font-medium text-gray-600 mb-2">Repas existants:</p>
              <div className="flex flex-wrap gap-2">
                {existingMeals.map((meal, index) => (
                  <div key={meal.id} className="flex items-center space-x-1">
                    <div className={`w-3 h-3 rounded-full ${getMealColor(index).bg}`}></div>
                    <span className="text-xs font-medium text-gray-700">Repas {index + 1}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Desktop responsive layout for food categories */}
          <div className="space-y-4">
            {/* Expanded category takes full width */}
            {expandedCategory && (
              <div className="w-full">
                {foodCategories
                  .filter(category => category.id === expandedCategory)
                  .map((category) => (
                    <FoodCategory
                      key={category.id}
                      category={category}
                      selectedSeason={selectedSeason}
                      onItemClick={handleFoodItemClick}
                      getMealInfo={getFoodItemMealInfo}
                      isExpanded={true}
                      onToggle={() => setExpandedCategory(null)}
                    />
                  ))}
              </div>
            )}
            
            {/* Other categories in grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {foodCategories
                .filter(category => category.id !== expandedCategory)
                .map((category) => (
                  <FoodCategory
                    key={category.id}
                    category={category}
                    selectedSeason={selectedSeason}
                    onItemClick={handleFoodItemClick}
                    getMealInfo={getFoodItemMealInfo}
                    isExpanded={false}
                    onToggle={() => setExpandedCategory(category.id)}
                  />
                ))}
            </div>
          </div>
        </div>
      </main>

      <BottomNavigation />

      <NutritionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        foodItem={selectedFoodItem}
        currentListId={listId}
        currentMealId={mealId ?? undefined}
      />
    </div>
  );
}