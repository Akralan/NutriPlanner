import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth, calculateDailyCalories } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Calendar, Target } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar } from "recharts";
import BottomNavigation from "@/components/bottom-navigation";
import type { NutritionLog } from "@shared/schema";

export default function Home() {
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState<"7d" | "30d">("7d");

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
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 pb-20">
      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="text-center pt-4 pb-2">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            Bonjour {user?.firstName}
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-sm">
            Votre score nutritionnel
          </p>
        </div>

        {/* Today's Score Card - Mobile Style */}
        <div className="glassmorphism rounded-2xl p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Target className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Score du jour</span>
          </div>
          
          <div className={`text-4xl font-bold mb-2 ${getScoreColor(todayScore)}`}>
            {todayScore}<span className="text-lg text-gray-500">/100</span>
          </div>
          
          <Badge {...getScoreBadge(todayScore)} className="mb-3">
            {getScoreBadge(todayScore).label}
          </Badge>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-lg font-semibold text-blue-600">
                {todayCalories}
              </p>
              <p className="text-xs text-gray-500">Calories</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-purple-600">
                {todayCompletedMeals.length}
              </p>
              <p className="text-xs text-gray-500">Repas</p>
            </div>
          </div>
        </div>

        {/* Calories Chart - Bar Style */}
        {chartData.length > 0 && (
          <div className="glassmorphism rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Calories (7 derniers jours)</span>
              </div>
            </div>
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.slice(-4)}>
                  <XAxis 
                    dataKey="date" 
                    axisLine={false}
                    tickLine={false}
                    fontSize={10}
                    tick={{ fill: '#6b7280' }}
                  />
                  <YAxis hide />
                  <Bar dataKey="target" fill="#e5e7eb" name="Objectif" />
                  <Bar dataKey="actual" fill="#3b82f6" name="Réel" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Quick Stats - Mobile Style */}
        <div className="grid grid-cols-2 gap-3">
          <div className="glassmorphism rounded-2xl p-3 text-center">
            <p className="text-lg font-bold text-green-600">
              {chartData.filter(day => day.score >= 80).length}
            </p>
            <p className="text-xs text-gray-500">Jours excellents</p>
          </div>
          
          <div className="glassmorphism rounded-2xl p-3 text-center">
            <p className="text-lg font-bold text-blue-600">
              {completedMeals.length}
            </p>
            <p className="text-xs text-gray-500">Repas total</p>
          </div>
        </div>

        {/* Current Meals Table */}
        <div className="glassmorphism rounded-2xl p-4">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Repas actuels</h3>
          {todayCompletedMeals.length > 0 ? (
            <div className="space-y-2">
              {todayCompletedMeals.map((meal: any, index: number) => (
                <div key={meal.id} className="flex justify-between items-center p-2 bg-white/50 rounded-lg">
                  <div>
                    <span className="text-sm font-medium text-gray-800">{meal.name}</span>
                    <p className="text-xs text-gray-500">{meal.calories} cal</p>
                  </div>
                  <span className="text-xs text-green-600">✓ Terminé</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-500 text-center py-4">Aucun repas terminé aujourd'hui</p>
          )}
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
}