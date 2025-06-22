import { Link, useLocation } from "wouter";

const navItems = [
  { path: "/", icon: "🏠", label: "Accueil" },
  { path: "/lists", icon: "📋", label: "Listes" },
  { path: "/meals", icon: "🍽️", label: "Repas" },
  { path: "/profile", icon: "👤", label: "Profil" },
];

export default function BottomNavigation() {
  const [location] = useLocation();

  return (
    <nav className="absolute bottom-0 left-0 right-0 glassmorphism rounded-t-3xl p-4 shadow-lg border-t-2 border-white/30">
      <div className="flex justify-around items-center">
        {navItems.map((item) => {
          const isActive = location === item.path;
          return (
            <Link key={item.path} href={item.path}>
              <button
                className={`flex flex-col items-center space-y-1 p-2 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? "glassmorphism-dark border-2 border-white/40 bg-white/50" 
                    : "hover:glassmorphism-dark hover:border border-white/20"
                }`}
              >
                <span className="text-xl drop-shadow-sm">{item.icon}</span>
                <span className={`text-xs font-bold drop-shadow-sm ${
                  isActive ? "text-gray-800" : "text-gray-700"
                }`}>
                  {item.label}
                </span>
              </button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
