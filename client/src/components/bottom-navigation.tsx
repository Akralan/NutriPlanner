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
    <nav className="absolute bottom-0 left-0 right-0 glassmorphism rounded-t-3xl p-4 shadow-lg">
      <div className="flex justify-around items-center">
        {navItems.map((item) => {
          const isActive = location === item.path;
          return (
            <Link key={item.path} href={item.path}>
              <button
                className={`flex flex-col items-center space-y-1 p-2 rounded-xl transition-colors ${
                  isActive ? "bg-green-100" : ""
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className={`text-xs font-bold ${
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
