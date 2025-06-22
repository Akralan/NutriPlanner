import { useQuery } from "@tanstack/react-query";
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
}

export default function FoodCategory({ category, selectedSeason, onItemClick }: FoodCategoryProps) {
  const { data: items = [], isLoading } = useQuery<FoodItem[]>({
    queryKey: ["/api/food-items", { category: category.id, season: selectedSeason }],
  });

  if (isLoading) {
    return (
      <div className="glassmorphism rounded-2xl p-4 shadow-lg">
        <div className="flex items-center space-x-3 mb-3">
          <span className="text-2xl">{category.emoji}</span>
          <h3 className="font-semibold text-gray-800">{category.name}</h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="glassmorphism-dark rounded-xl p-3 animate-pulse">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-white/20 rounded"></div>
                <div className="space-y-2">
                  <div className="w-20 h-3 bg-white/20 rounded"></div>
                  <div className="w-16 h-2 bg-white/20 rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="glassmorphism rounded-2xl p-4 shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{category.emoji}</span>
          <h3 className="font-semibold text-gray-800">{category.name}</h3>
        </div>
        <span className="text-sm text-gray-500">{items.length} items</span>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        {items.map((item) => (
          <FoodItemComponent
            key={item.id}
            item={item}
            onClick={() => onItemClick(item)}
          />
        ))}
      </div>
    </div>
  );
}
