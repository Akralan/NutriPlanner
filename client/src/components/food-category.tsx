import { useState, useEffect } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
import { ChevronDown, ChevronRight } from "lucide-react";
import FoodItemComponent from "./food-item";
import type { FoodItem } from "@/../../shared/schema";

interface FoodCategoryProps {
  category: {
    id: string;
    name: string;
    emoji: string;
  };
  selectedSeason: string;
  items: FoodItem[];
  onItemClick: (item: FoodItem) => void;
  getMealInfo?: (foodItemId: number) => {
    mealIndex: number;
    color: string;
    mealId: number;
  } | null;
  isExpanded?: boolean;
  onToggle?: () => void;
}

export default function FoodCategory({ 
  category, 
  selectedSeason, 
  items,
  onItemClick, 
  getMealInfo, 
  isExpanded = false, 
  onToggle 
}: FoodCategoryProps) {
  const [isOpen, setIsOpen] = useState(isExpanded);

  // Sync internal state with isExpanded prop
  useEffect(() => {
    setIsOpen(isExpanded);
  }, [isExpanded]);

  const handleToggle = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    if (onToggle) {
      onToggle();
    }
  };

  // Vérifier si items est défini et a une longueur > 0
  if (!items || !Array.isArray(items) || items.length === 0) {
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
              {items.length > 0 && (
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
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
