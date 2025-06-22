import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import BottomNavigation from "@/components/bottom-navigation";
import type { GroceryList } from "@shared/schema";

export default function Lists() {
  const { data: groceryLists = [], isLoading } = useQuery<GroceryList[]>({
    queryKey: ["/api/grocery-lists"],
  });

  if (isLoading) {
    return (
      <div className="app-container">
        <div className="p-6 pb-24">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Mes listes de courses</h2>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="glassmorphism rounded-2xl p-4 shadow-lg animate-pulse">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-300 rounded"></div>
                    <div>
                      <div className="w-24 h-4 bg-gray-300 rounded mb-1"></div>
                      <div className="w-20 h-3 bg-gray-300 rounded"></div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="w-6 h-6 bg-gray-300 rounded mb-1"></div>
                    <div className="w-8 h-3 bg-gray-300 rounded"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="p-6 pb-24">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Mes listes de courses</h2>
        
        {groceryLists.length === 0 ? (
          <div className="glassmorphism rounded-2xl p-8 shadow-lg text-center">
            <span className="text-4xl mb-4 block">📋</span>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Aucune liste</h3>
            <p className="text-gray-600 mb-4">Créez votre première liste de courses depuis l'accueil.</p>
            <Link href="/">
              <button className="glassmorphism-dark rounded-xl px-4 py-2 text-white font-medium hover:bg-white/20 transition-colors">
                Aller à l'accueil
              </button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {groceryLists.map((list) => (
              <Link key={list.id} href={`/meals/${list.id}`}>
                <div className="glassmorphism rounded-2xl p-4 shadow-lg cursor-pointer hover:scale-105 transition-transform">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">📋</span>
                      <div>
                        <h3 className="font-semibold text-gray-800">{list.name}</h3>
                        <p className="text-sm text-gray-600">
                          Créée le {new Date(list.createdAt).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${list.status === "active" ? "text-green-600" : "text-gray-500"}`}>
                        {list.mealCount}
                      </p>
                      <p className="text-xs text-gray-500">repas</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 mt-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      list.status === "active" 
                        ? "bg-blue-100 text-blue-700" 
                        : "bg-green-100 text-green-700"
                    }`}>
                      {list.status === "active" ? "En cours" : "Terminée"}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
      <BottomNavigation />
    </div>
  );
}
