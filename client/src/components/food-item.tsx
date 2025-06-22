import type { FoodItem } from "@shared/schema";

interface FoodItemProps {
  item: FoodItem;
  onClick: () => void;
}

export default function FoodItemComponent({ item, onClick }: FoodItemProps) {
  return (
    <div
      className="glassmorphism-dark rounded-xl p-3 cursor-pointer hover:scale-105 transition-transform"
      onClick={onClick}
    >
      <div className="flex items-center space-x-2">
        <span className="text-lg">{item.emoji}</span>
        <div>
          <p className="text-sm font-medium text-white">{item.name}</p>
          <p className="text-xs text-gray-300">
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
