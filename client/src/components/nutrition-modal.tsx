import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { FoodItem } from "@shared/schema";

interface NutritionModalProps {
  isOpen: boolean;
  onClose: () => void;
  foodItem: FoodItem | null;
  currentListId?: number;
  currentMealId?: number;
}

export default function NutritionModal({ isOpen, onClose, foodItem, currentListId, currentMealId }: NutritionModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState("kg");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const addToListMutation = useMutation({
    mutationFn: async () => {
      if (!foodItem) throw new Error("Missing food item");
      
      if (currentMealId) {
        // Add ingredient to existing meal
        return apiRequest("POST", "/api/meal-ingredients", {
          mealId: currentMealId,
          foodItemId: foodItem.id,
          quantity,
          unit,
        });
      } else if (currentListId) {
        // Add to grocery list
        return apiRequest("POST", "/api/list-items", {
          listId: currentListId,
          foodItemId: foodItem.id,
          quantity,
          unit,
        });
      } else {
        throw new Error("Missing target (list or meal)");
      }
    },
    onSuccess: () => {
      const isAddingToMeal = !!currentMealId;
      toast({
        title: isAddingToMeal ? "Ajouté au repas" : "Ajouté à la liste",
        description: `${foodItem?.name} a été ajouté ${isAddingToMeal ? 'au repas' : 'à votre liste de courses'}.`,
      });
      
      if (currentMealId) {
        queryClient.invalidateQueries({ queryKey: [`/api/grocery-lists/${currentListId}/meals`] });
      } else {
        queryClient.invalidateQueries({ queryKey: ["/api/grocery-lists"] });
      }
      
      onClose();
      setQuantity(1);
      setUnit("kg");
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: `Impossible d'ajouter l'aliment ${currentMealId ? 'au repas' : 'à la liste'}.`,
        variant: "destructive",
      });
    },
  });

  if (!foodItem) return null;

  const nutrition = foodItem.nutrition as any;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glassmorphism rounded-3xl border-0 shadow-xl w-[90vw] max-w-sm mx-auto p-4">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3 text-xl font-bold text-gray-800">
            <span className="text-3xl">{foodItem.emoji}</span>
            <span>{foodItem.name}</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-3">
          {/* Nutrition Facts */}
          <div className="glassmorphism rounded-xl p-3 border-2 border-white/30 bg-white/40">
            <h4 className="font-bold text-gray-800 mb-2 text-sm">Valeurs nutritionnelles (100g)</h4>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-gray-800 font-medium">
                <span>Calories</span>
                <span className="font-bold">{nutrition.calories || 0} kcal</span>
              </div>
              <div className="flex justify-between text-gray-800 font-medium">
                <span>Glucides</span>
                <span className="font-bold">{nutrition.carbs || 0}g</span>
              </div>
              <div className="flex justify-between text-gray-800 font-medium">
                <span>Protéines</span>
                <span className="font-bold">{nutrition.protein || 0}g</span>
              </div>
              <div className="flex justify-between text-gray-800 font-medium">
                <span>Lipides</span>
                <span className="font-bold">{nutrition.fat || 0}g</span>
              </div>
              {nutrition.vitaminA && (
                <div className="flex justify-between text-gray-800 font-medium">
                  <span>Vitamine A</span>
                  <span className="font-bold">{nutrition.vitaminA}µg</span>
                </div>
              )}
              {nutrition.vitaminC && (
                <div className="flex justify-between text-gray-800 font-medium">
                  <span>Vitamine C</span>
                  <span className="font-bold">{nutrition.vitaminC}mg</span>
                </div>
              )}
              {nutrition.iron && (
                <div className="flex justify-between text-gray-800 font-medium">
                  <span>Fer</span>
                  <span className="font-bold">{nutrition.iron}mg</span>
                </div>
              )}
            </div>
          </div>

          {/* Quantity Selector */}
          <div className="glassmorphism rounded-xl p-3">
            <label className="block text-xs font-medium text-gray-700 mb-2">Quantité</label>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                className="glassmorphism border-2 border-white/30 rounded-full w-7 h-7 p-0 text-gray-800 font-bold hover:bg-white/40 flex-shrink-0 text-xs"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
              >
                -
              </Button>
              <Input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="glassmorphism border-0 text-center font-medium text-gray-800 w-12 h-8 text-sm flex-shrink-0"
                min={1}
              />
              <Button
                variant="outline"
                size="sm"
                className="glassmorphism border-2 border-white/30 rounded-full w-7 h-7 p-0 text-gray-800 font-bold hover:bg-white/40 flex-shrink-0 text-xs"
                onClick={() => setQuantity(quantity + 1)}
              >
                +
              </Button>
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger className="glassmorphism border-0 text-gray-800 font-medium h-8 text-xs min-w-0 flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kg">kg</SelectItem>
                  <SelectItem value="g">g</SelectItem>
                  <SelectItem value="pieces">pièces</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Add to List Button */}
          {currentListId && (
            <Button
              onClick={() => addToListMutation.mutate()}
              disabled={addToListMutation.isPending}
              className="w-full glassmorphism border-2 border-white/30 rounded-2xl p-3 text-gray-800 font-bold hover:bg-white/40 transition-all hover:scale-105 bg-white/20"
            >
              {addToListMutation.isPending ? "Ajout..." : "Ajouter à la liste"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
