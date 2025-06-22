import type { FoodItem } from "@shared/schema";

interface FoodItemProps {
  item: FoodItem;
  onClick: () => void;
  mealInfo?: {
    mealIndex: number;
    color: string;
    mealId: number;
  } | null;
}

export default function FoodItemComponent({ item, onClick, mealInfo }: FoodItemProps) {
  return (
    <div
      className="glassmorphism rounded-xl p-3 cursor-pointer hover:scale-105 transition-transform border-2 border-white/20 relative"
      onClick={onClick}
    >
      <div className="flex items-center space-x-2">
        <span className="text-lg">{item.emoji}</span>
        <div className="flex-1">
          <p className="text-sm font-bold text-gray-800 drop-shadow-sm">{item.name}</p>
          <p className="text-xs font-medium text-gray-600">
            {item.season === "all" ? "Toute l'année" : 
             item.season === "spring" ? "Printemps" :
             item.season === "summer" ? "Été" :
             item.season === "autumn" ? "Automne" :
             "Hiver"}
          </p>
        </div>
        {mealInfo && (
          <div className="flex items-center">
            <div className={`w-4 h-4 rounded-full ${mealInfo.color}`}></div>
          </div>
        )}
      </div>
    </div>
  );
}
