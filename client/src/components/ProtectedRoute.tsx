import { ReactNode } from "react";
import { Redirect } from "wouter";
import { useAuth } from "../hooks/useAuth";

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  // Vérifier d'abord si un token existe avant d'appeler useAuth
  const token = localStorage.getItem('auth_token');
  
  // Si pas de token, rediriger directement vers la page de connexion
  if (!token) {
    return <Redirect to="/login" />;
  }
  
  // Si un token existe, vérifier s'il est valide avec useAuth
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
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
  
  if (!isAuthenticated) {
    // Si le token existe mais n'est pas valide, le supprimer et rediriger
    localStorage.removeItem('auth_token');
    return <Redirect to="/login" />;
  }
  
  return <>{children}</>;
}
