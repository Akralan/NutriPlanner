import { Link, useLocation, useRoute } from "wouter";
import { Mic } from "lucide-react";
import { createPortal } from "react-dom";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import AudioRecorder from "./audio-recorder";

const navItems = [
  { path: "/", icon: "🏠", label: "Accueil" },
  { path: "/lists", icon: "📋", label: "Listes" },
  // Le microphone sera au milieu
  { path: "/meals", icon: "🍽️", label: "Repas" },
  { path: "/profile", icon: "👤", label: "Profil" },
];

export default function BottomNavigation() {
  const [location] = useLocation();
  const [matchesMeal, paramsMeal] = useRoute("/meals/:id");
  const [matchesFoodSelection, paramsFoodSelection] = useRoute("/food-selection/:id");
  const { toast } = useToast();
  
  // Extraire l'ID de la liste si nous sommes sur une page de liste de repas ou de sélection d'aliments
  const listId = (matchesMeal && paramsMeal) 
    ? parseInt(paramsMeal.id) 
    : (matchesFoodSelection && paramsFoodSelection) 
      ? parseInt(paramsFoodSelection.id) 
      : null;
  
  // Vérifier si nous sommes sur une page qui supporte l'enregistrement audio
  const isAudioSupported = matchesMeal || matchesFoodSelection;
  
  // Gérer le clic sur le bouton microphone quand on n'est pas sur une page supportée
  const handleMicClick = () => {
    toast({
      title: "Fonctionnalité limitée",
      description: "L'enregistrement audio n'est disponible que dans les listes de repas ou lors de la sélection d'aliments",
    });
  };

  const navigationContent = (
    <>
      <nav className="bottom-nav p-3" style={{ 
        position: 'fixed', 
        bottom: 0, 
        width: '100%', 
        zIndex: 9999,
        display: 'flex',
        justifyContent: 'center'
      }}>
        <div className="flex justify-around items-center relative" style={{ 
          maxWidth: '768px', 
          width: '100%' 
        }}>
          {/* Première moitié des éléments de navigation */}
          {navItems.slice(0, 2).map((item) => {
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
          
          {/* Bouton microphone au milieu */}
          <div className="flex items-center justify-center">
            {isAudioSupported && listId ? (
              <AudioRecorder listId={listId} isMealPage={!!matchesMeal} />
            ) : (
              <button 
                className="rounded-full bg-primary/80 w-12 h-12 flex items-center justify-center shadow-md"
                onClick={handleMicClick}
              >
                <Mic className="h-6 w-6 text-white" />
              </button>
            )}
          </div>
          
          {/* Deuxième moitié des éléments de navigation */}
          {navItems.slice(2).map((item) => {
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
      </nav>
    </>
  );

  // Utiliser createPortal pour rendre la navigation directement dans le body
  return createPortal(navigationContent, document.body);
}
