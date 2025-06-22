import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import BottomNavigation from "@/components/bottom-navigation";
import FoodCategory from "@/components/food-category";
import NutritionModal from "@/components/nutrition-modal";
import { foodCategories, seasons } from "@/lib/food-data";
import type { FoodItem, GroceryList } from "@shared/schema";

export default function Home() {
  const [selectedSeason, setSelectedSeason] = useState("all");
  const [selectedFoodItem, setSelectedFoodItem] = useState<FoodItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentListId, setCurrentListId] = useState<number | undefined>();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: groceryLists = [] } = useQuery<GroceryList[]>({
    queryKey: ["/api/grocery-lists"],
  });

  const activeList = groceryLists.find(list => list.status === "active");
  const totalMeals = groceryLists.reduce((sum, list) => sum + list.mealCount, 0);

  const createListMutation = useMutation({
    mutationFn: async () => {
      const now = new Date().toLocaleDateString("fr-FR");
      return apiRequest("POST", "/api/grocery-lists", {
        name: `Liste du ${now}`,
        createdAt: new Date().toISOString(),
        mealCount: 0,
        status: "active",
      });
    },
    onSuccess: (response) => {
      response.json().then((newList) => {
        setCurrentListId(newList.id);
        toast({
          title: "Liste créée",
          description: "Une nouvelle liste de courses a été créée.",
        });
      });
      queryClient.invalidateQueries({ queryKey: ["/api/grocery-lists"] });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de créer une nouvelle liste.",
        variant: "destructive",
      });
    },
  });

  const handleFoodItemClick = (item: FoodItem) => {
    if (!activeList && !currentListId) {
      toast({
        title: "Aucune liste active",
        description: "Créez d'abord une liste de courses.",
        variant: "destructive",
      });
      return;
    }

    setSelectedFoodItem(item);
    setIsModalOpen(true);
  };

  const handleCreateList = () => {
    if (activeList) {
      setCurrentListId(activeList.id);
      toast({
        title: "Liste existante",
        description: "Vous avez déjà une liste active.",
      });
    } else {
      createListMutation.mutate();
    }
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="glassmorphism rounded-b-3xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-800">NutriListes</h1>
          <div className="glassmorphism-dark rounded-full p-2">
            <span className="text-xl">🥗</span>
          </div>
        </div>
        
        {/* Meal Counter */}
        <div className="glassmorphism rounded-2xl p-4 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-700 font-medium">Repas planifiés</span>
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-green-600">{totalMeals}</span>
              <span className="text-gray-500">repas</span>
            </div>
          </div>
          <div className="mt-2 bg-green-200 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, (totalMeals / 15) * 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Season Filter */}
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {seasons.map((season) => (
            <Button
              key={season.id}
              variant="ghost"
              size="sm"
              className={`rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap border-0 ${
                selectedSeason === season.id
                  ? "glassmorphism-dark text-white"
                  : "glassmorphism text-gray-700"
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
        <div className="space-y-4">
          {foodCategories.map((category) => (
            <FoodCategory
              key={category.id}
              category={category}
              selectedSeason={selectedSeason}
              onItemClick={handleFoodItemClick}
            />
          ))}
        </div>

        {/* Create List Button */}
        <div className="mt-8">
          <Button
            onClick={handleCreateList}
            disabled={createListMutation.isPending}
            className="w-full glassmorphism rounded-2xl p-4 shadow-lg hover:scale-105 transition-transform border-0 bg-transparent text-gray-800 font-semibold text-lg hover:bg-white/30"
          >
            <div className="flex items-center justify-center space-x-3">
              <span className="text-2xl">➕</span>
              <span>
                {createListMutation.isPending 
                  ? "Création..." 
                  : activeList 
                    ? "Liste active existante" 
                    : "Créer une nouvelle liste"
                }
              </span>
            </div>
          </Button>
        </div>
      </main>

      <BottomNavigation />

      <NutritionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        foodItem={selectedFoodItem}
        currentListId={currentListId || activeList?.id}
      />
    </div>
  );
}
