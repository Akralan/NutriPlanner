import { Link, useLocation } from "wouter";
import { Mic } from "lucide-react";

const navItems = [
  { path: "/", icon: "🏠", label: "Accueil" },
  { path: "/lists", icon: "📋", label: "Listes" },
  { path: "/meals", icon: "🍽️", label: "Repas" },
  { path: "/profile", icon: "👤", label: "Profil" },
];

export default function BottomNavigation() {
  const [location] = useLocation();

  return (
    <>
      {/* Floating Microphone Button */}
      <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-40">
        <button className="glassmorphism w-14 h-14 rounded-full border-2 border-white/30 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 flex items-center justify-center">
          <Mic className="h-6 w-6 text-gray-700 dark:text-gray-300" />
        </button>
      </div>
      
      <nav className="bottom-nav p-3">
        <div className="flex justify-center items-center max-w-sm mx-auto">
          <div className="flex justify-around items-center w-full">
            {navItems.map((item) => {
              const isActive = location === item.path;
              return (
                <Link key={item.path} href={item.path}>
                  <button
                    className={`flex flex-col items-center space-y-1 p-2 rounded-lg transition-all duration-200 ${
                      isActive 
                        ? "bg-white/30 border border-white/40" 
                        : "hover:bg-white/20"
                    }`}
                  >
                    <span className="text-sm drop-shadow-sm">{item.icon}</span>
                    <span className={`text-xs font-medium drop-shadow-sm ${
                      isActive ? "text-gray-800" : "text-gray-700"
                    }`}>
                      {item.label}
                    </span>
                  </button>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </>
  );
}
