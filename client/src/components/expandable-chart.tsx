import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar, Expand, TrendingUp } from "lucide-react";
import { Input } from "@/components/ui/input";

interface CalorieData {
  date: string;
  calories: number;
}

interface WeightData {
  date: string;
  weight: number;
}

interface ExpandableChartProps {
  calorieData: CalorieData[];
  weightData?: WeightData[];
  isDesktop?: boolean;
}

type DateRange = "1w" | "1m" | "3m" | "1y" | "custom";

export default function ExpandableChart({ calorieData, weightData = [], isDesktop = false }: ExpandableChartProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRange, setSelectedRange] = useState<DateRange>("1w");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [showWeightChart, setShowWeightChart] = useState(false);

  const dateRanges = [
    { key: "1w" as DateRange, label: "1 semaine" },
    { key: "1m" as DateRange, label: "1 mois" },
    { key: "3m" as DateRange, label: "3 mois" },
    { key: "1y" as DateRange, label: "1 an" },
    { key: "custom" as DateRange, label: "Personnalisé" },
  ];

  const getFilteredData = () => {
    const now = new Date();
    let startDate: Date;

    switch (selectedRange) {
      case "1w":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "1m":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "3m":
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case "1y":
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      case "custom":
        if (!customStartDate) return calorieData;
        startDate = new Date(customStartDate);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    const endDate = selectedRange === "custom" && customEndDate ? new Date(customEndDate) : now;

    return calorieData.filter(item => {
      const itemDate = new Date(item.date);
      return itemDate >= startDate && itemDate <= endDate;
    });
  };

  const getFilteredWeightData = () => {
    const now = new Date();
    let startDate: Date;

    switch (selectedRange) {
      case "1w":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "1m":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "3m":
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case "1y":
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      case "custom":
        if (!customStartDate) return weightData;
        startDate = new Date(customStartDate);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    const endDate = selectedRange === "custom" && customEndDate ? new Date(customEndDate) : now;

    return weightData.filter(item => {
      const itemDate = new Date(item.date);
      return itemDate >= startDate && itemDate <= endDate;
    });
  };

  const renderSimpleChart = (data: CalorieData[]) => {
    const maxCalories = Math.max(...data.map(d => d.calories), 1);
    
    return (
      <div className="flex items-end space-x-2 h-32 px-4">
        {data.slice(-7).map((day, index) => {
          const height = (day.calories / maxCalories) * 100;
          const date = new Date(day.date);
          const isToday = date.toDateString() === new Date().toDateString();
          
          return (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div 
                className={`w-full rounded-t-lg transition-all duration-300 ${
                  isToday 
                    ? 'bg-gradient-to-t from-rose-400 to-pink-400' 
                    : 'bg-gradient-to-t from-gray-300 to-gray-400'
                }`}
                style={{ height: `${Math.max(height, 10)}%` }}
              />
              <span className="text-xs text-gray-600 mt-2">
                {date.toLocaleDateString("fr-FR", { 
                  weekday: "short", 
                  day: "numeric" 
                }).replace(".", "")}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  const renderExpandedChart = (data: CalorieData[]) => {
    const maxCalories = Math.max(...data.map(d => d.calories), 1);
    
    return (
      <div className="h-64 flex items-end space-x-1 px-4">
        {data.map((day, index) => {
          const height = (day.calories / maxCalories) * 100;
          const date = new Date(day.date);
          const isToday = date.toDateString() === new Date().toDateString();
          
          return (
            <div key={index} className="flex-1 flex flex-col items-center min-w-0">
              <div className="text-xs text-gray-600 mb-1">
                {day.calories}
              </div>
              <div 
                className={`w-full rounded-t-lg transition-all duration-300 ${
                  isToday 
                    ? 'bg-gradient-to-t from-rose-400 to-pink-400' 
                    : 'bg-gradient-to-t from-blue-400 to-cyan-400'
                }`}
                style={{ height: `${Math.max(height, 10)}%` }}
              />
              <span className="text-xs text-gray-600 mt-2 truncate">
                {date.toLocaleDateString("fr-FR", { 
                  day: "numeric",
                  month: "short"
                })}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  const renderWeightChart = (data: WeightData[]) => {
    if (data.length === 0) return null;
    
    const maxWeight = Math.max(...data.map(d => d.weight), 1);
    const minWeight = Math.min(...data.map(d => d.weight), 0);
    const range = maxWeight - minWeight || 1;
    
    return (
      <div className="mt-6">
        <div className="flex items-center space-x-2 mb-4">
          <TrendingUp className="h-5 w-5 text-green-600" />
          <h4 className="text-lg font-bold text-gray-800">Évolution du poids</h4>
        </div>
        <div className="h-48 flex items-end space-x-1 px-4">
          {data.map((day, index) => {
            const height = ((day.weight - minWeight) / range) * 100;
            const date = new Date(day.date);
            
            return (
              <div key={index} className="flex-1 flex flex-col items-center min-w-0">
                <div className="text-xs text-gray-600 mb-1">
                  {day.weight.toFixed(2)}kg
                </div>
                <div 
                  className="w-full rounded-t-lg bg-gradient-to-t from-green-400 to-emerald-400 transition-all duration-300"
                  style={{ height: `${Math.max(height, 10)}%` }}
                />
                <span className="text-xs text-gray-600 mt-2 truncate">
                  {date.toLocaleDateString("fr-FR", { 
                    day: "numeric",
                    month: "short"
                  })}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Show expand button only on desktop
  if (!isDesktop) {
    return (
      <div className="glassmorphism rounded-2xl p-6 shadow-lg border-2 border-white/30">
        <div className="flex items-center space-x-2 mb-4">
          <Calendar className="h-5 w-5 text-gray-700" />
          <h3 className="text-lg font-bold text-gray-800">Calories (7 derniers jours)</h3>
        </div>
        {renderSimpleChart(calorieData)}
      </div>
    );
  }

  return (
    <div className="glassmorphism rounded-2xl p-6 shadow-lg border-2 border-white/30">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-gray-700" />
          <h3 className="text-lg font-bold text-gray-800">Calories (7 derniers jours)</h3>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="glassmorphism border-2 border-white/30 hover:bg-white/40 text-gray-700"
            >
              <Expand className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl glassmorphism border-2 border-white/30">
            <DialogHeader>
              <DialogTitle className="text-gray-800">Graphiques détaillés</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Date Range Selection */}
              <div className="flex flex-wrap gap-2">
                {dateRanges.map((range) => (
                  <Button
                    key={range.key}
                    variant={selectedRange === range.key ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedRange(range.key)}
                    className={`glassmorphism border-2 border-white/30 ${
                      selectedRange === range.key
                        ? "bg-gradient-to-r from-rose-500 to-pink-500 text-white"
                        : "hover:bg-white/40 text-gray-700"
                    }`}
                  >
                    {range.label}
                  </Button>
                ))}
              </div>

              {/* Custom Date Inputs */}
              {selectedRange === "custom" && (
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      Date de début
                    </label>
                    <Input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="glassmorphism border-2 border-white/30"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      Date de fin
                    </label>
                    <Input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="glassmorphism border-2 border-white/30"
                    />
                  </div>
                </div>
              )}

              {/* Calories Chart */}
              <div className="glassmorphism rounded-xl p-4 border border-white/20">
                <h4 className="text-lg font-bold text-gray-800 mb-4">Calories consommées</h4>
                <div key={`calories-${selectedRange}-${customStartDate}-${customEndDate}`}>
                  {renderExpandedChart(getFilteredData())}
                </div>
              </div>

              {/* Weight Chart Toggle */}
              {weightData.length > 0 && (
                <div className="flex items-center justify-center">
                  <Button
                    variant={showWeightChart ? "default" : "outline"}
                    onClick={() => setShowWeightChart(!showWeightChart)}
                    className={`glassmorphism border-2 border-white/30 ${
                      showWeightChart 
                        ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600" 
                        : "hover:bg-white/40 text-gray-700"
                    }`}
                  >
                    <TrendingUp className="h-4 w-4 mr-2" />
                    {showWeightChart ? "Masquer" : "Afficher"} l'évolution du poids
                  </Button>
                </div>
              )}

              {/* Weight Chart */}
              {showWeightChart && weightData.length > 0 && (
                <div className="glassmorphism rounded-xl p-4 border border-white/20">
                  <div key={`weight-${selectedRange}-${customStartDate}-${customEndDate}`}>
                    {renderWeightChart(getFilteredWeightData())}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
      <div onClick={() => isDesktop && setIsOpen(true)} className="cursor-pointer">
        {renderSimpleChart(calorieData)}
      </div>
    </div>
  );
}