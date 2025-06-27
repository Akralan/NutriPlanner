import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/home";
import Lists from "@/pages/lists";
import FoodSelection from "@/pages/food-selection";
import MealPlanning from "@/pages/meal-planning";
import Login from "@/pages/login";
import Profile from "@/pages/profile";
import NotFound from "@/pages/not-found";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PublicRoute } from "@/components/PublicRoute";

function Router() {
  return (
    <Switch>
      {/* Routes publiques */}
      <Route path="/login">
        <PublicRoute>
          <Login />
        </PublicRoute>
      </Route>
      
      {/* Routes protégées */}
      <Route path="/">
        <ProtectedRoute>
          <Home />
        </ProtectedRoute>
      </Route>
      <Route path="/lists">
        <ProtectedRoute>
          <Lists />
        </ProtectedRoute>
      </Route>
      <Route path="/food-selection/:id">
        <ProtectedRoute>
          <FoodSelection />
        </ProtectedRoute>
      </Route>
      <Route path="/meals/:id">
        <ProtectedRoute>
          <MealPlanning />
        </ProtectedRoute>
      </Route>
      <Route path="/meals">
        <ProtectedRoute>
          <Lists />
        </ProtectedRoute>
      </Route>
      <Route path="/profile">
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      </Route>
      <Route>
        <ProtectedRoute>
          <NotFound />
        </ProtectedRoute>
      </Route>
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
