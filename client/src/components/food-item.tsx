import type { FoodItem } from "@shared/schema";

interface FoodItemProps {
  item: FoodItem;
  onClick: () => void;
}

export default function FoodItemComponent({ item, onClick }: FoodItemProps) {
  return (
    <div
      className="glassmorphism rounded-xl p-3 cursor-pointer hover:scale-105 transition-transform border-2 border-white/20"
      onClick={onClick}
    >
      <div className="flex items-center space-x-2">
        <span className="text-lg">{item.emoji}</span>
        <div>
          <p className="text-sm font-bold text-gray-800 drop-shadow-sm">{item.name}</p>
          <p className="text-xs font-medium text-gray-600">
            {item.season === "all" ? "Toute l'année" : 
             item.season === "spring" ? "Printemps" :
             item.season === "summer" ? "Été" :
             item.season === "autumn" ? "Automne" :
             "Hiver"}
          </p>
        </div>
      </div>
    </div>
  );
}
