import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Home from "@/pages/home";
import Lists from "@/pages/lists";
import MealPlanning from "@/pages/meal-planning";
import Login from "@/pages/login";
import Profile from "@/pages/profile";
import NotFound from "@/pages/not-found";

function Router() {
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
    return <Login />;
  }

  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/lists" component={Lists} />
      <Route path="/meals/:id" component={MealPlanning} />
      <Route path="/meals" component={Lists} />
      <Route path="/profile" component={Profile} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
