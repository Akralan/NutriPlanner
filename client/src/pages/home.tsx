import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
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

  // Calculate today's nutrition score
  const todayLog = nutritionLogs.find(log => {
    const logDate = new Date(log.date).toDateString();
    const today = new Date().toDateString();
    return logDate === today;
  });

  const calculateNutritionScore = (log: NutritionLog) => {
    if (!log) return 0;
    
    const calorieScore = Math.min(100, (log.totalCalories / log.targetCalories) * 100);
    const proteinTarget = (log.targetCalories * 0.25) / 4; // 25% of calories from protein
    const proteinScore = Math.min(100, (log.totalProtein / proteinTarget) * 100);
    
    return Math.round((calorieScore + proteinScore) / 2);
  };

  const todayScore = todayLog ? calculateNutritionScore(todayLog) : 0;

  // Prepare chart data - only last 2 days for mobile format
  const chartData = nutritionLogs.slice(-2).map(log => ({
    date: new Date(log.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' }),
    score: calculateNutritionScore(log),
    calories: log.totalCalories,
    target: log.targetCalories,
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

  const trend = chartData.length >= 2 
    ? chartData[chartData.length - 1].score - chartData[0].score
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
          
          {todayLog && (
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-lg font-semibold text-blue-600">
                  {todayLog.totalCalories}
                </p>
                <p className="text-xs text-gray-500">Calories</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-purple-600">
                  {todayLog.mealsCompleted || 0}
                </p>
                <p className="text-xs text-gray-500">Repas</p>
              </div>
            </div>
          )}
        </div>

        {/* Recent Trend - Mobile Style */}
        {chartData.length > 0 && (
          <div className="glassmorphism rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Évolution récente</span>
              </div>
              <div className="flex items-center gap-2">
                {trend > 0 ? (
                  <TrendingUp className="h-3 w-3 text-green-600" />
                ) : trend < 0 ? (
                  <TrendingDown className="h-3 w-3 text-red-600" />
                ) : null}
                <span className="text-xs text-gray-500">
                  {recentAverage}/100
                </span>
              </div>
            </div>
            <div className="h-24">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis 
                    dataKey="date" 
                    axisLine={false}
                    tickLine={false}
                    fontSize={10}
                    tick={{ fill: '#6b7280' }}
                  />
                  <YAxis hide />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={{ fill: "#3b82f6", strokeWidth: 1, r: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Quick Stats - Mobile Style */}
        <div className="grid grid-cols-2 gap-3">
          <div className="glassmorphism rounded-2xl p-3 text-center">
            <p className="text-lg font-bold text-green-600">
              {nutritionLogs.filter(log => calculateNutritionScore(log) >= 80).length}
            </p>
            <p className="text-xs text-gray-500">Jours excellents</p>
          </div>
          
          <div className="glassmorphism rounded-2xl p-3 text-center">
            <p className="text-lg font-bold text-blue-600">
              {nutritionLogs.reduce((sum, log) => sum + (log.mealsCompleted || 0), 0)}
            </p>
            <p className="text-xs text-gray-500">Repas total</p>
          </div>
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
}