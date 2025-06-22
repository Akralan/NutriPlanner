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
      <div className="p-4 space-y-6">
        {/* Header */}
        <div className="text-center pt-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            Bonjour {user?.firstName}
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-sm">
            Votre score nutritionnel
          </p>
        </div>

        {/* Today's Score Card */}
        <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-0 shadow-md">
          <CardHeader className="text-center pb-2">
            <CardTitle className="flex items-center justify-center gap-2 text-lg">
              <Target className="h-4 w-4" />
              Score du jour
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-3 pt-0">
            <div className={`text-5xl font-bold ${getScoreColor(todayScore)}`}>
              {todayScore}
              <span className="text-xl text-gray-500">/100</span>
            </div>
            <Badge {...getScoreBadge(todayScore)}>
              {getScoreBadge(todayScore).label}
            </Badge>
            
            {todayLog && (
              <div className="grid grid-cols-2 gap-3 mt-3">
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
          </CardContent>
        </Card>

        {/* Recent Trend - Mobile Format */}
        {chartData.length > 0 && (
          <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-0 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-lg">
                <span className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Évolution récente
                </span>
                <div className="flex items-center gap-2">
                  {trend > 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : trend < 0 ? (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  ) : null}
                  <span className="text-sm text-gray-500">
                    {recentAverage}/100
                  </span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <XAxis 
                      dataKey="date" 
                      axisLine={false}
                      tickLine={false}
                      fontSize={11}
                    />
                    <YAxis 
                      domain={[0, 100]}
                      axisLine={false}
                      tickLine={false}
                      fontSize={11}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="score" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      dot={{ fill: "#3b82f6", strokeWidth: 2, r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-0 shadow-md">
            <CardContent className="p-3 text-center">
              <p className="text-xl font-bold text-green-600">
                {nutritionLogs.filter(log => calculateNutritionScore(log) >= 80).length}
              </p>
              <p className="text-xs text-gray-500">Jours excellents</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-0 shadow-md">
            <CardContent className="p-3 text-center">
              <p className="text-xl font-bold text-blue-600">
                {nutritionLogs.reduce((sum, log) => sum + (log.mealsCompleted || 0), 0)}
              </p>
              <p className="text-xs text-gray-500">Repas total</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
}