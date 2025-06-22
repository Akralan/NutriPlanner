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
}

export default function NutritionModal({ isOpen, onClose, foodItem, currentListId }: NutritionModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState("kg");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const addToListMutation = useMutation({
    mutationFn: async () => {
      if (!foodItem || !currentListId) throw new Error("Missing required data");
      
      return apiRequest("POST", "/api/list-items", {
        listId: currentListId,
        foodItemId: foodItem.id,
        quantity,
        unit,
      });
    },
    onSuccess: () => {
      toast({
        title: "Ajouté à la liste",
        description: `${foodItem?.name} a été ajouté à votre liste de courses.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/grocery-lists"] });
      onClose();
      setQuantity(1);
      setUnit("kg");
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter l'aliment à la liste.",
        variant: "destructive",
      });
    },
  });

  if (!foodItem) return null;

  const nutrition = foodItem.nutrition as any;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glassmorphism rounded-3xl border-0 shadow-xl max-w-sm mx-4">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3 text-xl font-bold text-gray-800">
            <span className="text-3xl">{foodItem.emoji}</span>
            <span>{foodItem.name}</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Nutrition Facts */}
          <div className="glassmorphism-dark rounded-xl p-4">
            <h4 className="font-semibold text-white mb-3">Valeurs nutritionnelles (100g)</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-200">
                <span>Calories</span>
                <span>{nutrition.calories || 0} kcal</span>
              </div>
              <div className="flex justify-between text-gray-200">
                <span>Glucides</span>
                <span>{nutrition.carbs || 0}g</span>
              </div>
              <div className="flex justify-between text-gray-200">
                <span>Protéines</span>
                <span>{nutrition.protein || 0}g</span>
              </div>
              <div className="flex justify-between text-gray-200">
                <span>Lipides</span>
                <span>{nutrition.fat || 0}g</span>
              </div>
              {nutrition.vitaminA && (
                <div className="flex justify-between text-gray-200">
                  <span>Vitamine A</span>
                  <span>{nutrition.vitaminA}µg</span>
                </div>
              )}
              {nutrition.vitaminC && (
                <div className="flex justify-between text-gray-200">
                  <span>Vitamine C</span>
                  <span>{nutrition.vitaminC}mg</span>
                </div>
              )}
              {nutrition.iron && (
                <div className="flex justify-between text-gray-200">
                  <span>Fer</span>
                  <span>{nutrition.iron}mg</span>
                </div>
              )}
            </div>
          </div>

          {/* Quantity Selector */}
          <div className="glassmorphism rounded-xl p-4">
            <label className="block text-sm font-medium text-gray-700 mb-3">Quantité</label>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                className="glassmorphism-dark border-0 rounded-full w-8 h-8 p-0 text-white hover:bg-white/20"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
              >
                -
              </Button>
              <Input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="glassmorphism border-0 text-center font-medium text-gray-800 w-16"
                min={1}
              />
              <Button
                variant="outline"
                size="sm"
                className="glassmorphism-dark border-0 rounded-full w-8 h-8 p-0 text-white hover:bg-white/20"
                onClick={() => setQuantity(quantity + 1)}
              >
                +
              </Button>
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger className="glassmorphism border-0 text-gray-800 font-medium w-24">
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
              className="w-full glassmorphism-dark border-0 rounded-2xl p-3 text-white font-semibold hover:bg-white/20 transition-all hover:scale-105"
            >
              {addToListMutation.isPending ? "Ajout..." : "Ajouter à la liste"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
