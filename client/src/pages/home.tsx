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

  // Prepare chart data
  const chartData = nutritionLogs.slice(-7).map(log => ({
    date: new Date(log.date).toLocaleDateString('fr-FR', { weekday: 'short' }),
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

  const weeklyAverage = chartData.length > 0 
    ? Math.round(chartData.reduce((sum, day) => sum + day.score, 0) / chartData.length)
    : 0;

  const trend = chartData.length >= 2 
    ? chartData[chartData.length - 1].score - chartData[chartData.length - 2].score
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 pb-20">
      <div className="p-4 space-y-6">
        {/* Header */}
        <div className="text-center pt-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Bonjour {user?.firstName} 👋
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Votre tableau de bord nutritionnel
          </p>
        </div>

        {/* Today's Score Card */}
        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Target className="h-5 w-5" />
              Score du jour
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className={`text-6xl font-bold ${getScoreColor(todayScore)}`}>
              {todayScore}
              <span className="text-2xl text-gray-500">/100</span>
            </div>
            <Badge {...getScoreBadge(todayScore)}>
              {getScoreBadge(todayScore).label}
            </Badge>
            
            {todayLog && (
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="text-center">
                  <p className="text-2xl font-semibold text-blue-600">
                    {todayLog.totalCalories}
                  </p>
                  <p className="text-sm text-gray-500">Calories</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-semibold text-purple-600">
                    {todayLog.mealsCompleted}
                  </p>
                  <p className="text-sm text-gray-500">Repas</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Weekly Trend */}
        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Tendance hebdomadaire
              </span>
              <div className="flex items-center gap-2">
                {trend > 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                )}
                <span className="text-sm text-gray-500">
                  Moyenne: {weeklyAverage}/100
                </span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false}
                    tickLine={false}
                    fontSize={12}
                  />
                  <YAxis 
                    domain={[0, 100]}
                    axisLine={false}
                    tickLine={false}
                    fontSize={12}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: "#1d4ed8" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Calories Chart */}
        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Suivi des calories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false}
                    tickLine={false}
                    fontSize={12}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    fontSize={12}
                  />
                  <Bar dataKey="calories" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="target" fill="#e5e7eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded" />
                <span className="text-sm text-gray-600">Consommé</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-300 rounded" />
                <span className="text-sm text-gray-600">Objectif</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-600">
                {nutritionLogs.filter(log => calculateNutritionScore(log) >= 80).length}
              </p>
              <p className="text-sm text-gray-500">Jours excellents</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">
                {nutritionLogs.reduce((sum, log) => sum + (log.mealsCompleted || 0), 0)}
              </p>
              <p className="text-sm text-gray-500">Repas total</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
}