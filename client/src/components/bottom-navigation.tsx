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
    <nav className="absolute bottom-0 left-0 right-0 glassmorphism p-2 shadow-lg border-t border-white/20">
      <div className="flex justify-around items-center">
        {navItems.map((item) => {
          const isActive = location === item.path;
          return (
            <Link key={item.path} href={item.path}>
              <button
                className={`flex flex-col items-center space-y-1 p-1 rounded-lg transition-all duration-200 ${
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
    </nav>
  );
}
