import { ReactNode } from "react";
import { Redirect } from "wouter";
import { useAuth } from "../hooks/useAuth";

interface PublicRouteProps {
  children: ReactNode;
  redirectAuthenticated?: boolean;
  redirectTo?: string;
  initialLoadComplete?: boolean;
}

export function PublicRoute({ 
  children, 
  redirectAuthenticated = true, 
  redirectTo = "/",
  initialLoadComplete = false
}: PublicRouteProps) {
  // Vérifier d'abord si un token existe avant d'appeler useAuth
  const token = localStorage.getItem('auth_token');
  
  // Si pas de token, afficher directement le contenu sans appeler useAuth
  if (!token) {
    return <>{children}</>;
  }
  
  // Si un token existe, vérifier s'il est valide avec useAuth
  const { isAuthenticated, isLoading } = useAuth();
  
  // Si le chargement prend trop de temps et que initialLoadComplete est true,
  // on arrête d'attendre et on affiche le contenu
  if (isLoading && !initialLoadComplete) {
    return (
      <div className="app-container">
        <div className="min-h-screen flex items-center justify-center">
          <div className="glassmorphism rounded-2xl p-8 animate-pulse">
            <div className="w-32 h-8 bg-gray-300 rounded mb-4"></div>
            <div className="w-48 h-4 bg-gray-300 rounded"></div>
          </div>
        </div>
      </div>
    );
  }
  
  // Si l'utilisateur est authentifié et que la redirection est activée, rediriger
  if (isAuthenticated && redirectAuthenticated) {
    return <Redirect to={redirectTo} />;
  }
  
  // Si le chargement prend trop de temps ou si l'utilisateur n'est pas authentifié,
  // afficher le contenu
  return <>{children}</>;
}
