import { useState } from "react";
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
import type { NutritionLog } from "@shared/schema";

export default function Home() {
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState<"7d" | "30d">("7d");
  const isMobile = useIsMobile();

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
  const completedMeals = allMeals.filter((meal: any) => meal.completed);
  const totalMealsCount = allMeals.length;
  
  // Get today's completed meals
  const today = new Date().toDateString();
  const todayCompletedMeals = completedMeals.filter((meal: any) => {
    if (!meal.completedAt) return false;
    const mealDate = new Date(meal.completedAt).toDateString();
    return mealDate === today;
  });

  // Calculate nutrition score based on real data
  const calculateNutritionScore = (meals: any[]) => {
    if (!Array.isArray(meals) || meals.length === 0) return 0;
    
    const totalCalories = meals.reduce((sum, meal) => sum + (meal.calories || 0), 0);
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
  
  const todayCalories = todayCompletedMeals.reduce((sum, meal) => sum + (meal.calories || 0), 0);

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
      return new Date(meal.completedAt).toDateString() === dayString;
    });
    
    const dayCalories = dayCompletedMeals.reduce((sum, meal) => sum + (meal.calories || 0), 0);
    
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
      return new Date(meal.completedAt).toDateString() === dayString;
    });
    
    const dayCalories = dayCompletedMeals.reduce((sum, meal) => sum + (meal.calories || 0), 0);
    
    return {
      date: date.toISOString(),
      calories: dayCalories,
    };
  });

  // Mock weight data for demonstration (would come from user profile updates)
  const weightChartData = last7Days.map((date, index) => ({
    date: date.toISOString(),
    weight: (user?.weight || 70) + (Math.sin(index * 0.5) * 0.5), // Slight variation
  }));

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
    <div className="app-container fade-for-mic">
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
                    <p className="text-xs text-gray-600 font-medium">{meal.calories} cal</p>
                  </div>
                  <span className="text-xs text-green-700 font-bold drop-shadow-sm">✓ Terminé</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-600 text-center py-4 font-medium">Aucun repas terminé aujourd'hui</p>
          )}
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
}