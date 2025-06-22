import { calculateMacros } from "@/hooks/useAuth";

interface MacroProgressProps {
  currentCalories: number;
  targetCalories: number;
  currentProtein: number;
  currentFat: number;
  currentCarbs: number;
  isMinimal?: boolean;
}

export default function MacroProgress({ 
  currentCalories, 
  targetCalories, 
  currentProtein, 
  currentFat, 
  currentCarbs,
  isMinimal = false 
}: MacroProgressProps) {
  const targetMacros = calculateMacros(targetCalories);
  
  const proteinProgress = Math.min(100, (currentProtein / targetMacros.protein) * 100);
  const fatProgress = Math.min(100, (currentFat / targetMacros.fat) * 100);
  const carbsProgress = Math.min(100, (currentCarbs / targetMacros.carbs) * 100);
  const calorieProgress = Math.min(100, (currentCalories / targetCalories) * 100);

  if (isMinimal) {
    return (
      <div className="glassmorphism rounded-xl p-3 border-2 border-white/30">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-bold text-gray-800">{Math.round(currentCalories)}</span>
          <span className="text-xs text-gray-600">/ {targetCalories} kcal</span>
        </div>
        
        <div className="space-y-2">
          {/* Protéines - Bleu */}
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div 
              className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${proteinProgress}%` }}
            ></div>
          </div>

          {/* Lipides - Jaune */}
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div 
              className="bg-yellow-500 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${fatProgress}%` }}
            ></div>
          </div>

          {/* Glucides - Vert */}
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div 
              className="bg-green-500 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${carbsProgress}%` }}
            ></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="glassmorphism rounded-xl p-4 border-2 border-white/30">
      <div className="flex justify-between items-center mb-3">
        <span className="text-lg font-bold text-gray-800">{Math.round(currentCalories)} kcal</span>
        <span className="text-sm text-gray-600">Objectif: {targetCalories}</span>
      </div>
      
      <div className="space-y-3">
        {/* Protéines */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium text-blue-700">Protéines</span>
            <span className="text-sm font-bold text-blue-800">{Math.round(currentProtein)}g / {targetMacros.protein}g</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${proteinProgress}%` }}
            ></div>
          </div>
        </div>

        {/* Lipides */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium text-yellow-700">Lipides</span>
            <span className="text-sm font-bold text-yellow-800">{Math.round(currentFat)}g / {targetMacros.fat}g</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${fatProgress}%` }}
            ></div>
          </div>
        </div>

        {/* Glucides */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium text-green-700">Glucides</span>
            <span className="text-sm font-bold text-green-800">{Math.round(currentCarbs)}g / {targetMacros.carbs}g</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${carbsProgress}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}