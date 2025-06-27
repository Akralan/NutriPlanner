import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Button } from "./ui/button";
import { Calendar, Expand, TrendingUp } from "lucide-react";
import { Input } from "./ui/input";

interface CalorieData {
  date: string;
  calories: number;
  target?: number; // Objectif calorique journalier
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
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

  const dateRanges = [
    { key: "1w" as DateRange, label: "1 semaine" },
    { key: "1m" as DateRange, label: "1 mois" },
    { key: "3m" as DateRange, label: "3 mois" },
    { key: "1y" as DateRange, label: "1 an" },
    { key: "custom" as DateRange, label: "Personnalisé" },
  ];

  const getFilteredData = () => {
    let filteredData = [...calorieData];
    
    switch (selectedRange) {
      case "1w":
        filteredData = calorieData.filter(d => {
          const date = new Date(d.date);
          const now = new Date();
          const weekAgo = new Date();
          weekAgo.setDate(now.getDate() - 7);
          return date >= weekAgo;
        });
        break;
      case "1m":
        filteredData = calorieData.filter(d => {
          const date = new Date(d.date);
          const now = new Date();
          const monthAgo = new Date();
          monthAgo.setMonth(now.getMonth() - 1);
          return date >= monthAgo;
        });
        break;
      case "3m":
        filteredData = calorieData.filter(d => {
          const date = new Date(d.date);
          const now = new Date();
          const threeMonthsAgo = new Date();
          threeMonthsAgo.setMonth(now.getMonth() - 3);
          return date >= threeMonthsAgo;
        });
        break;
      case "1y":
        filteredData = calorieData.filter(d => {
          const date = new Date(d.date);
          const now = new Date();
          const yearAgo = new Date();
          yearAgo.setFullYear(now.getFullYear() - 1);
          return date >= yearAgo;
        });
        break;
      case "custom":
        if (customStartDate && customEndDate) {
          const startDate = new Date(customStartDate);
          const endDate = new Date(customEndDate);
          endDate.setHours(23, 59, 59, 999); // Inclure toute la journée de fin
          
          filteredData = calorieData.filter(d => {
            const date = new Date(d.date);
            return date >= startDate && date <= endDate;
          });
        }
        break;
    }
    
    // Trier les données par date
    return filteredData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const getFilteredWeightData = () => {
    let filteredData = [...weightData];
    
    switch (selectedRange) {
      case "1w":
        filteredData = weightData.filter(d => {
          const date = new Date(d.date);
          const now = new Date();
          const weekAgo = new Date();
          weekAgo.setDate(now.getDate() - 7);
          return date >= weekAgo;
        });
        break;
      case "1m":
        filteredData = weightData.filter(d => {
          const date = new Date(d.date);
          const now = new Date();
          const monthAgo = new Date();
          monthAgo.setMonth(now.getMonth() - 1);
          return date >= monthAgo;
        });
        break;
      case "3m":
        filteredData = weightData.filter(d => {
          const date = new Date(d.date);
          const now = new Date();
          const threeMonthsAgo = new Date();
          threeMonthsAgo.setMonth(now.getMonth() - 3);
          return date >= threeMonthsAgo;
        });
        break;
      case "1y":
        filteredData = weightData.filter(d => {
          const date = new Date(d.date);
          const now = new Date();
          const yearAgo = new Date();
          yearAgo.setFullYear(now.getFullYear() - 1);
          return date >= yearAgo;
        });
        break;
      case "custom":
        if (customStartDate && customEndDate) {
          const startDate = new Date(customStartDate);
          const endDate = new Date(customEndDate);
          endDate.setHours(23, 59, 59, 999); // Inclure toute la journée de fin
          
          filteredData = weightData.filter(d => {
            const date = new Date(d.date);
            return date >= startDate && date <= endDate;
          });
        }
        break;
    }
    
    // Trier les données par date
    return filteredData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const renderSimpleChart = (data: CalorieData[]) => {
    // Calculer la valeur maximale entre les calories consommées et les objectifs
    const maxValue = Math.max(
      ...data.map(d => Math.max(d.calories || 0, d.target || 0)),
      1
    );
    
    // Hauteur maximale disponible pour les barres en pixels
    const maxBarHeight = 100;
    
    return (
      <div style={{ height: "130px", display: "flex", alignItems: "flex-end", gap: "8px", padding: "0 16px", overflowX: "auto" }}>
        {data.map((day, index) => {
          const date = new Date(day.date);
          const isToday = date.toDateString() === new Date().toDateString();
          const barColor = isToday ? "#ec4899" : "#10b981"; // rose-500 ou emerald-500
          
          // Calculer les hauteurs en pixels
          const calorieHeight = Math.max(((day.calories || 0) / maxValue) * maxBarHeight, 3);
          const targetHeight = Math.max(((day.target || 0) / maxValue) * maxBarHeight, 3);
          
          return (
            <div key={index} style={{ flex: "0 0 40px", display: "flex", flexDirection: "column", alignItems: "center", minWidth: "40px" }}>
              {/* Conteneur des barres avec hauteur fixe */}
              <div style={{ position: "relative", width: "100%", height: `${maxBarHeight}px` }}>
                {/* Barre d'objectif (grise) */}
                {day.target && (
                  <div 
                    style={{ 
                      position: "absolute", 
                      width: "100%", 
                      height: `${targetHeight}px`, 
                      bottom: "0",
                      borderTopLeftRadius: "0.5rem",
                      borderTopRightRadius: "0.5rem",
                      background: "linear-gradient(to top, #d1d5db, #9ca3af)",
                      opacity: "0.6"
                    }}
                  />
                )}
                
                {/* Barre de calories consommées (colorée) */}
                <div 
                  style={{ 
                    position: "absolute", 
                    width: "100%", 
                    height: `${calorieHeight}px`, 
                    bottom: "0",
                    borderTopLeftRadius: "0.5rem",
                    borderTopRightRadius: "0.5rem",
                    background: `linear-gradient(to top, ${barColor}, ${barColor})`,
                    zIndex: "10",
                    transition: "height 0.3s ease"
                  }}
                />
              </div>
              
              <span style={{ fontSize: "0.75rem", color: "#4b5563", marginTop: "8px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
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
    // Calculer la valeur maximale entre les calories consommées et les objectifs
    const maxValue = Math.max(
      ...data.map(d => Math.max(d.calories || 0, d.target || 0)),
      1
    );
    
    // Hauteur maximale disponible pour les barres en pixels
    const maxBarHeight = 180;
    
    return (
      <div style={{ height: "250px", display: "flex", alignItems: "flex-end", gap: "4px", padding: "0 16px" }}>
        {data.map((day, index) => {
          const date = new Date(day.date);
          const isToday = date.toDateString() === new Date().toDateString();
          const barColor = isToday ? "#ec4899" : "#10b981"; // rose-500 ou emerald-500
          
          // Calculer les hauteurs en pixels
          const calorieHeight = Math.max(((day.calories || 0) / maxValue) * maxBarHeight, 5);
          const targetHeight = Math.max(((day.target || 0) / maxValue) * maxBarHeight, 5);
          
          return (
            <div key={index} style={{ flex: "1", display: "flex", flexDirection: "column", alignItems: "center", minWidth: "0" }}>
              <div style={{ fontSize: "0.75rem", color: "#4b5563", marginBottom: "4px" }}>
                {day.calories}
              </div>
              
              {/* Conteneur des barres avec hauteur fixe */}
              <div style={{ position: "relative", width: "100%", height: `${maxBarHeight}px` }}>
                {/* Barre d'objectif (grise) */}
                {day.target && (
                  <div 
                    style={{ 
                      position: "absolute", 
                      width: "100%", 
                      height: `${targetHeight}px`, 
                      bottom: "0",
                      borderTopLeftRadius: "0.5rem",
                      borderTopRightRadius: "0.5rem",
                      background: "linear-gradient(to top, #d1d5db, #9ca3af)",
                      opacity: "0.6"
                    }}
                  />
                )}
                
                {/* Barre de calories consommées (colorée) */}
                <div 
                  style={{ 
                    position: "absolute", 
                    width: "100%", 
                    height: `${calorieHeight}px`, 
                    bottom: "0",
                    borderTopLeftRadius: "0.5rem",
                    borderTopRightRadius: "0.5rem",
                    background: `linear-gradient(to top, ${barColor}, ${barColor})`,
                    zIndex: "10",
                    transition: "height 0.3s ease"
                  }}
                />
              </div>
              
              <span style={{ fontSize: "0.75rem", color: "#4b5563", marginTop: "8px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
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

  const renderWeightChart = (weightData: WeightData[]) => {
    if (!weightData || weightData.length === 0) return null;
    
    // Filtrer les données en fonction de la plage sélectionnée
    const filteredWeights = getFilteredWeightData();
    
    // Si pas de données après filtrage, on ne montre rien
    if (filteredWeights.length === 0) return null;
    
    // Déterminer le nombre de jours à afficher en fonction de la plage
    let daysToShow = 7; // Par défaut pour 1 semaine
    const now = new Date();
    let startDate = new Date();
    
    switch (selectedRange) {
      case '1w':
        daysToShow = 7;
        startDate.setDate(now.getDate() - 6); // 6 jours + aujourd'hui
        break;
      case '1m':
        daysToShow = 30;
        startDate.setDate(now.getDate() - 29); // 29 jours + aujourd'hui
        break;
      case '3m':
        daysToShow = 13; // 13 semaines environ
        startDate.setDate(now.getDate() - (daysToShow * 7) + 7);
        break;
      case '1y':
        daysToShow = 12; // 12 mois
        startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1); // 11 mois + mois actuel
        break;
      case 'custom':
        if (customStartDate && customEndDate) {
          const start = new Date(customStartDate);
          const end = new Date(customEndDate);
          const diffTime = Math.abs(end.getTime() - start.getTime());
          daysToShow = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
          startDate = new Date(start);
        }
        break;
    }
    
    // Créer un tableau de jours avec les données de poids correspondantes
    const daysData = Array.from({ length: daysToShow }, (_, i) => {
      const date = new Date(startDate);
      
      if (selectedRange === '1y') {
        // Pour l'affichage annuel, on montre les mois
        date.setMonth(startDate.getMonth() + i);
      } else {
        // Pour les autres plages, on montre les jours
        date.setDate(startDate.getDate() + i);
      }
      
      date.setHours(0, 0, 0, 0);
      
      // Trouver l'entrée correspondante
      const weightEntry = filteredWeights.find(d => {
        const entryDate = new Date(d.date);
        if (selectedRange === '1y') {
          return entryDate.getMonth() === date.getMonth() && 
                 entryDate.getFullYear() === date.getFullYear();
        }
        return entryDate.toDateString() === date.toDateString();
      });
      
      return {
        date,
        weight: weightEntry ? weightEntry.weight : null,
        hasData: !!weightEntry
      };
    });
    
    // Calculer l'échelle Y
    const weights = filteredWeights.map(d => d.weight);
    const maxWeight = Math.max(...weights, 1) * 1.2; // 20% de marge
    const minWeight = Math.max(0, Math.min(...weights) * 0.9); // 10% de marge en dessous
    const range = maxWeight - minWeight;
    const chartHeight = 180;
    const barColor = '#3b82f6'; // Bleu-500
    
    // Formater la date pour l'affichage
    const formatDate = (date: Date) => {
      if (selectedRange === '1y') {
        return date.toLocaleDateString('fr-FR', { month: 'short' });
      }
      return date.toLocaleDateString('fr-FR', { 
        day: 'numeric',
        month: selectedRange === '1m' || selectedRange === '3m' ? 'short' : 'numeric'
      });
    };
    
    return (
      <div className="mt-6">
        <div className="flex items-center space-x-2 mb-4">
          <TrendingUp className="h-5 w-5 text-blue-600" />
          <h4 className="text-lg font-bold text-gray-800">Évolution du poids</h4>
        </div>
        
        <div className="relative" style={{ height: `${chartHeight}px` }}>
          {/* Lignes de grille horizontales pour l'échelle */}
          <div className="absolute inset-0">
            {[0, 0.25, 0.5, 0.75, 1].map((value, i) => {
              const yPos = (1 - value) * 100;
              const weightValue = (minWeight + range * value).toFixed(1);
              
              return (
                <div 
                  key={i}
                  className="flex items-center absolute left-0 right-0"
                  style={{
                    top: `${yPos}%`,
                    height: '1px',
                  }}
                >
                  <div className="w-10 pr-2 text-right">
                    <span className="text-xs text-gray-500">
                      {weightValue}kg
                    </span>
                  </div>
                  <div 
                    className="flex-1 h-px bg-gray-100"
                    style={{ marginLeft: '8px' }}
                  />
                </div>
              );
            })}
          </div>
          
          {/* Conteneur des barres */}
          <div className="flex h-full items-end justify-between px-2">
            {daysData.map((day, index) => {
              const barHeight = day.hasData 
                ? Math.max(5, (day.weight! / maxWeight) * (chartHeight - 40)) 
                : 0;
              const isToday = day.date.toDateString() === new Date().toDateString();
              
              return (
                <div 
                  key={index}
                  className="flex flex-col items-center h-full"
                  style={{ width: `${100 / daysToShow}%` }}
                >
                  <div 
                    className="relative w-3/5 flex justify-center"
                    style={{ height: `${chartHeight - 20}px` }}
                  >
                    <div 
                      className="absolute bottom-0 w-full bg-blue-400 rounded-t-md transition-all duration-300 hover:bg-blue-500"
                      style={{
                        height: `${barHeight}px`,
                        opacity: day.hasData ? 1 : 0.1,
                        background: `linear-gradient(to top, ${barColor}, ${barColor}99)`,
                      }}
                    >
                      {day.hasData && (
                        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                          {day.weight}kg
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <span className="text-xs text-gray-500 mt-1">
                    {formatDate(day.date)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const getChartTitle = () => {
    switch (selectedRange) {
      case "1w":
        return "Calories (7 derniers jours)";
      case "1m":
        return "Calories (30 derniers jours)";
      case "3m":
        return "Calories (3 derniers mois)";
      case "1y":
        return "Calories (12 derniers mois)";
      case "custom":
        if (customStartDate && customEndDate) {
          const start = new Date(customStartDate).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
          const end = new Date(customEndDate).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
          return `Calories (${start} - ${end})`;
        }
        return "Calories (période personnalisée)";
      default:
        return "Calories";
    }
  };

  // Show expand button only on desktop
  if (!isDesktop) {
    return (
      <div className="glassmorphism rounded-2xl p-6 shadow-lg border-2 border-white/30">
        <div className="flex items-center space-x-2 mb-4">
          <Calendar className="h-5 w-5 text-gray-700" />
          <h3 className="text-lg font-bold text-gray-800">{getChartTitle()}</h3>
        </div>
        {renderSimpleChart(getFilteredData())}
      </div>
    );
  }

  return (
    <div className="glassmorphism rounded-2xl p-6 shadow-lg border-2 border-white/30">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-gray-700" />
          <h3 className="text-lg font-bold text-gray-800">{getChartTitle()}</h3>
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
              <DialogTitle className="text-gray-800">Graphiques détaillés - {getChartTitle()}</DialogTitle>
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
        {renderSimpleChart(getFilteredData())}
      </div>
    </div>
  );
}