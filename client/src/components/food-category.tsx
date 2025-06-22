import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight } from "lucide-react";
import FoodItemComponent from "./food-item";
import type { FoodItem } from "@shared/schema";

interface FoodCategoryProps {
  category: {
    id: string;
    name: string;
    emoji: string;
  };
  selectedSeason: string;
  onItemClick: (item: FoodItem) => void;
  getMealInfo?: (foodItemId: number) => {
    mealIndex: number;
    color: string;
    mealId: number;
  } | null;
  isExpanded?: boolean;
  onToggle?: () => void;
}

export default function FoodCategory({ category, selectedSeason, onItemClick, getMealInfo, isExpanded = false, onToggle }: FoodCategoryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { data: items = [], isLoading } = useQuery<FoodItem[]>({
    queryKey: ["/api/food-items", { category: category.id, season: selectedSeason }],
  });

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (onToggle) {
      onToggle();
    }
  };

  if (items.length === 0 && !isLoading) {
    return null;
  }

  return (
    <Collapsible open={isOpen} onOpenChange={handleToggle}>
      <div className="glassmorphism rounded-2xl shadow-lg border-2 border-white/30 transition-all duration-300">
        <CollapsibleTrigger className="w-full p-4 hover:bg-white/20 transition-colors rounded-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{category.emoji}</span>
              <h3 className="font-semibold text-gray-800 dark:text-gray-200">{category.name}</h3>
              {!isLoading && items.length > 0 && (
                <span className="text-sm text-gray-500 bg-white/40 px-2 py-1 rounded-full">
                  {items.length}
                </span>
              )}
            </div>
            {isOpen ? (
              <ChevronDown className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            ) : (
              <ChevronRight className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            )}
          </div>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <div className="px-4 pb-4">
            {isLoading ? (
              <div className={`grid gap-3 ${
                isExpanded ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6' : 'grid-cols-2'
              }`}>
                {[...Array(isExpanded ? 12 : 4)].map((_, i) => (
                  <div key={i} className="glassmorphism rounded-xl p-3 animate-pulse border-2 border-white/20">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-gray-400 rounded"></div>
                      <div className="space-y-2">
                        <div className="w-20 h-3 bg-gray-400 rounded"></div>
                        <div className="w-16 h-2 bg-gray-400 rounded"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={`grid gap-3 ${
                isExpanded ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6' : 'grid-cols-2'
              }`}>
                {items.map((item) => (
                  <FoodItemComponent
                    key={item.id}
                    item={item}
                    onClick={() => onItemClick(item)}
                    mealInfo={getMealInfo ? getMealInfo(item.id) : null}
                  />
                ))}
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
