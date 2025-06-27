import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth, calculateDailyCalories } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Calendar, Target } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar } from "recharts";
import BottomNavigation from "@/components/bottom-navigation";
import ExpandableChart from "@/components/expandable-chart";
import { useIsMobile } from "@/hooks/use-mobile";
import type { NutritionLog } from "@/../../shared/schema";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState<"7d" | "30d">("7d");
  const isMobile = useIsMobile();
  const [showWeightPopup, setShowWeightPopup] = useState(false);
  const [weightValue, setWeightValue] = useState("");
  const popupRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { toast } = useToast();

  // Fermer la popup si on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node) && 
          buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setShowWeightPopup(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleWeightClick = async () => {
    if (showWeightPopup) {
      // Validation
      if (!weightValue) {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Veuillez entrer un poids valide",
        });
        return;
      }

      const weight = parseFloat(weightValue.replace(',', '.'));
      if (isNaN(weight) || weight <= 0) {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Veuillez entrer un poids valide (nombre supérieur à 0)",
        });
        return;
      }

      try {
        const token = localStorage.getItem('auth_token');
        if (!token) {
          throw new Error('Non authentifié');
        }
        
        const response = await fetch('/api/weight', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            weight,
            date: new Date().toISOString(),
            notes: "",
            userId: user?.id
          }),
        });

        if (!response.ok) {
          throw new Error('Erreur lors de l\'enregistrement du poids');
        }

        // Rafraîchir les données
        queryClient.invalidateQueries({ queryKey: ['/api/weight/current'] });
        
        const today = new Date().toLocaleDateString('fr-FR');
        toast({
          title: "Succès",
          description: `Poids de ${weightValue}kg enregistré pour le ${today}`,
        });
        setWeightValue("");
      } catch (error) {
        console.error('Erreur:', error);
        toast({
          variant: "destructive",
          title: "Erreur",
          description: 'Une erreur est survenue lors de l\'enregistrement du poids',
        });
      }
      
      setShowWeightPopup(false);
    } else {
      // Premier clic : affichage de l'input
      setShowWeightPopup(true);
    }
  };

  const { data: nutritionLogs = [] } = useQuery<NutritionLog[]>({
    queryKey: ["/api/nutrition-logs", selectedPeriod],
  });

  // Get all grocery lists to fetch meals
  const { data: groceryLists = [] } = useQuery<any[]>({
    queryKey: ["/api/grocery-lists"],
  });

  // Get all meals from all lists
  const { data: allMeals = [] } = useQuery<any[]>({
    queryKey: ["/api/all-meals"],
    queryFn: async () => {
      if (groceryLists.length === 0) return [];
      const mealPromises = groceryLists.map(async (list: any) => {
        const response = await fetch(`/api/grocery-lists/${list.id}/meals`);
        if (!response.ok) return [];
        const meals = await response.json();
        return meals;
      });
      const allMealArrays = await Promise.all(mealPromises);
      return allMealArrays.flat();
    },
    enabled: groceryLists.length > 0,
  });

  // Calculate real data from actual meals
  const completedMeals = allMeals.filter((meal: any) => {
    // Un repas est considéré comme complété s'il est marqué comme tel
    // ou s'il a au moins une date de complétion
    return meal.completed || (Array.isArray(meal.completedAt) && meal.completedAt.length > 0);
  });
  const totalMealsCount = allMeals.length;
  
  // Get today's completed meals
  const today = new Date().toDateString();
  const todayCompletedMeals = allMeals.filter((meal: any) => {
    // Si completedAt n'existe pas ou est vide, ce repas n'est pas complété
    if (!meal.completedAt) return false;
    
    // Si completedAt est un tableau (nouvelle structure)
    if (Array.isArray(meal.completedAt)) {
      // Vérifier si au moins une date de complétion correspond à aujourd'hui
      return meal.completedAt.some((date: string) => {
        const mealDate = new Date(date).toDateString();
        return mealDate === today;
      });
    } 
    // Si completedAt est une chaîne ou une date (ancienne structure)
    else {
      const mealDate = new Date(meal.completedAt).toDateString();
      return mealDate === today;
    }
  });

  // Pour les repas multiples, compter correctement les calories
  const countMealCalories = (meal: any, targetDate: string = today) => {
    if (!meal.completedAt) return 0;
    
    // Si c'est un repas multiple avec un tableau de dates de complétion
    if (Array.isArray(meal.completedAt)) {
      // Filtrer les dates de complétion pour le jour cible
      const dateCompletions = meal.completedAt.filter((date: string) => {
        const mealDate = new Date(date).toDateString();
        return mealDate === targetDate;
      });
      
      // Multiplier les calories par le nombre de complétions du jour cible
      return (meal.calories || 0) * dateCompletions.length;
    }
    
    // Cas standard : une seule complétion
    // Vérifier si la date de complétion correspond au jour cible
    const mealDate = new Date(meal.completedAt).toDateString();
    return mealDate === targetDate ? (meal.calories || 0) : 0;
  };

  // Calculate nutrition score based on real data
  const calculateNutritionScore = (meals: any[]) => {
    if (!Array.isArray(meals) || meals.length === 0) return 0;
    
    const totalCalories = meals.reduce((sum, meal) => sum + countMealCalories(meal), 0);
    // Use the same calculation method as targetCalories variable
    const scoreTargetCalories = user?.weight && user?.height ? 
      calculateDailyCalories(
        user.weight,
        user.height,
        user.weeklyWorkouts || 3,
        user.calorieThreshold || 0
      ) : 2000;
    
    if (totalCalories === 0) return 0;
    
    const calorieRatio = totalCalories / scoreTargetCalories;
    let score = 0;
    
    // Scoring logic: optimal range is 0.8-1.2 of target
    if (calorieRatio >= 0.8 && calorieRatio <= 1.2) {
      score = 100 - Math.abs(1 - calorieRatio) * 100;
    } else if (calorieRatio < 0.8) {
      score = calorieRatio * 100 * 1.25;
    } else {
      score = Math.max(0, 100 - (calorieRatio - 1.2) * 150);
    }
    
    return Math.round(Math.max(0, Math.min(100, score)));
  };

  const todayScore = calculateNutritionScore(todayCompletedMeals);
  
  // Calculate target calories for today using the official function
  const targetCalories = user?.weight && user?.height ? 
    calculateDailyCalories(
      user.weight,
      user.height,
      user.weeklyWorkouts || 3,
      user.calorieThreshold || 0
    ) : 2000;
  
  const todayCalories = todayCompletedMeals.reduce((sum, meal) => sum + countMealCalories(meal), 0);

  // Récupérer l'historique des poids
  const { data: weightHistory = [] } = useQuery<Array<{ date: string; weight: number }>>({
    queryKey: ["/api/weight/history"],
    enabled: !!user?.id,
  });

  // Préparer les données pour le graphique de poids
  const weightChartData = weightHistory.map(entry => ({
    date: new Date(entry.date).toISOString(),
    weight: entry.weight,
  }));

  // Si pas d'historique mais un poids actuel, on l'affiche
  if (weightChartData.length === 0 && user?.weight) {
    weightChartData.push({
      date: new Date().toISOString(),
      weight: user.weight,
    });
  }

  // Prepare chart data for last 7 days with real meal data
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return date;
  });

  const chartData = last7Days.map(date => {
    const dayString = date.toDateString();
    const dayCompletedMeals = completedMeals.filter((meal: any) => {
      if (!meal.completedAt) return false;
      if (Array.isArray(meal.completedAt)) {
        return meal.completedAt.some((date: string) => {
          const mealDate = new Date(date).toDateString();
          return mealDate === dayString;
        });
      } else {
        return new Date(meal.completedAt).toDateString() === dayString;
      }
    });
    
    const dayCalories = dayCompletedMeals.reduce((sum, meal) => sum + countMealCalories(meal, dayString), 0);
    
    return {
      date: date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' }),
      actual: dayCalories,
      target: targetCalories,
      score: calculateNutritionScore(dayCompletedMeals),
    };
  });

  // Prepare data for ExpandableChart component
  const calorieChartData = last7Days.map(date => {
    const dayString = date.toDateString();
    const dayCompletedMeals = completedMeals.filter((meal: any) => {
      if (!meal.completedAt) return false;
      if (Array.isArray(meal.completedAt)) {
        return meal.completedAt.some((date: string) => {
          const mealDate = new Date(date).toDateString();
          return mealDate === dayString;
        });
      } else {
        return new Date(meal.completedAt).toDateString() === dayString;
      }
    });
    
    const dayCalories = dayCompletedMeals.reduce((sum, meal) => sum + countMealCalories(meal, dayString), 0);
    
    return {
      date: date.toISOString(),
      calories: dayCalories,
      target: targetCalories, // Ajouter l'objectif calorique journalier
    };
  });

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBadge = (score: number) => {
    if (score >= 90) return { label: "Excellent", variant: "default" as const };
    if (score >= 80) return { label: "Très bien", variant: "secondary" as const };
    if (score >= 60) return { label: "Bien", variant: "outline" as const };
    return { label: "À améliorer", variant: "destructive" as const };
  };

  const recentAverage = chartData.length > 0 
    ? Math.round(chartData.reduce((sum, day) => sum + day.score, 0) / chartData.length)
    : 0;

  return (
    <div className="app-container">
      <div className="pb-24"> 
        <div className="p-4 space-y-3">
          {/* Header */}
          <div className="glassmorphism rounded-2xl p-4 text-center border-2 border-white/30 shadow-lg">
            <h1 className="text-xl font-bold text-gray-800 drop-shadow-sm">
              Bonjour {user?.firstName}
            </h1>
            <p className="text-gray-600 text-sm font-medium">
              Votre score nutritionnel
            </p>
          </div>

          {/* Today's Score Card - Mobile Style */}
          <div className="glassmorphism rounded-2xl p-4 text-center border-2 border-white/30 shadow-lg">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Target className="h-4 w-4 text-gray-700" />
              <span className="text-sm font-medium text-gray-800 drop-shadow-sm">Score du jour</span>
            </div>
            
            <div className={`text-4xl font-bold mb-2 drop-shadow-sm ${getScoreColor(todayScore)}`}>
              {todayScore}<span className="text-lg text-gray-600">/100</span>
            </div>
            
            <Badge {...getScoreBadge(todayScore)} className="mb-3 shadow-sm">
              {getScoreBadge(todayScore).label}
            </Badge>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center glassmorphism-dark rounded-xl p-2">
                <p className="text-lg font-semibold text-blue-700 drop-shadow-sm">
                  {todayCalories}
                </p>
                <p className="text-xs text-gray-600 font-medium">Calories</p>
              </div>
              <div className="text-center glassmorphism-dark rounded-xl p-2">
                <p className="text-lg font-semibold text-purple-700 drop-shadow-sm">
                  {todayCompletedMeals.length}
                </p>
                <p className="text-xs text-gray-600 font-medium">Repas</p>
              </div>
            </div>
          </div>

          {/* Expandable Calories Chart */}
          {calorieChartData.length > 0 && (
            <ExpandableChart 
              calorieData={calorieChartData}
              weightData={weightChartData}
              isDesktop={!isMobile}
            />
          )}

          {/* Quick Stats - Mobile Style */}
          <div className="grid grid-cols-2 gap-3">
            <div className="glassmorphism rounded-2xl p-3 text-center border-2 border-white/30 shadow-lg">
              <p className="text-lg font-bold text-green-700 drop-shadow-sm">
                {chartData.filter(day => day.score >= 80).length}
              </p>
              <p className="text-xs text-gray-600 font-medium">Jours excellents</p>
            </div>
            
            <div className="glassmorphism rounded-2xl p-3 text-center border-2 border-white/30 shadow-lg">
              <p className="text-lg font-bold text-blue-700 drop-shadow-sm">
                {completedMeals.length}
              </p>
              <p className="text-xs text-gray-600 font-medium">Repas total</p>
            </div>
          </div>

          {/* Current Meals Table */}
          <div className="glassmorphism rounded-2xl p-4 border-2 border-white/30 shadow-lg">
            <h3 className="text-sm font-medium text-gray-800 drop-shadow-sm mb-3">Repas actuels</h3>
            {todayCompletedMeals.length > 0 ? (
              <div className="space-y-2">
                {todayCompletedMeals.map((meal: any, index: number) => (
                  <div key={meal.id} className="flex justify-between items-center p-2 glassmorphism-dark rounded-xl border border-white/20">
                    <div>
                      <span className="text-sm font-medium text-gray-800 drop-shadow-sm">{meal.name}</span>
                      <p className="text-xs text-gray-600 font-medium">{countMealCalories(meal)} cal</p>
                    </div>
                    <span className="text-xs text-green-700 font-bold drop-shadow-sm">✓ Terminé</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-600 text-center py-4 font-medium">Aucun repas terminé aujourd'hui</p>
            )}
          </div>

          {/* Bouton d'ajout de poids avec popup */}
          <div className="relative">
            <button 
              ref={buttonRef}
              onClick={handleWeightClick}
              className="w-full glassmorphism bg-green-100/50 hover:bg-green-100/70 text-green-800 font-medium py-3 px-4 rounded-2xl border border-green-200/50 border-2 border-white/30 shadow-lg transition-all duration-200 text-sm flex items-center justify-center gap-2"
            >
              <span>{showWeightPopup ? 'Valider' : '+ Ajouter mon poids'}</span>
              <svg 
                className={`w-4 h-4 transition-transform duration-200 ${showWeightPopup ? 'rotate-180' : ''}`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {/* Popup de saisie */}
            {showWeightPopup && (
              <div 
                ref={popupRef}
                className="border-2 border-white/30 shadow-lg absolute z-10 mt-2 w-full bg-white/80 rounded-xl p-4 animate-fadeIn"
                style={{
                  animation: 'fadeIn 0.2s ease-out forwards'
                }}
              >
                <div className="flex flex-col space-y-3">
                  <label className="text-sm font-medium text-gray-700">Votre poids (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={weightValue}
                    onChange={(e) => setWeightValue(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Ex: 68.5"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleWeightClick()}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bloc invisible pour réserver l'espace de la barre de navigation */}
        <div className="h-8"></div>
      </div>

      <BottomNavigation />

      <style jsx="true">{`
        @keyframes fadeIn {
          from {height: 0, opacity: 0; transform: translateY(-10px); }
          to {height: auto, opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
}