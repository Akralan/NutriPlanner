import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { User, InsertUser, LoginData, UpdateProfile } from "@shared/schema";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user && !error,
  };
}

export function useLogin() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: LoginData) => {
      const response = await apiRequest("POST", "/api/auth/login", data);
      const result = await response.json();
      
      if (result.token) {
        localStorage.setItem('auth_token', result.token);
      }
      
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
  });
}

export function useRegister() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: InsertUser) => {
      const response = await apiRequest("POST", "/api/auth/register", data);
      const result = await response.json();
      
      if (result.token) {
        localStorage.setItem('auth_token', result.token);
      }
      
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      localStorage.removeItem('auth_token');
      await apiRequest("POST", "/api/auth/logout", {});
    },
    onSuccess: () => {
      queryClient.clear();
      window.location.href = "/";
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: UpdateProfile) => {
      const response = await apiRequest("PUT", "/api/auth/profile", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
  });
}

// Helper function to calculate daily caloric needs
export function calculateDailyCalories(weight: number, height: number, weeklyWorkouts: number, calorieThreshold: number = 0): number {
  // Base Metabolic Rate calculation using Mifflin-St Jeor equation (for men, simplified)
  // BMR = 10 × weight(kg) + 6.25 × height(cm) - 5 × age + 5
  // Since we don't have age, we'll use a simplified version with activity level
  
  const baseBMR = 10 * weight + 6.25 * height + 5; // Simplified without age
  
  // Activity multiplier based on weekly workouts
  let activityMultiplier = 1.2; // Sedentary
  if (weeklyWorkouts >= 1 && weeklyWorkouts <= 3) {
    activityMultiplier = 1.375; // Light activity
  } else if (weeklyWorkouts >= 4 && weeklyWorkouts <= 6) {
    activityMultiplier = 1.55; // Moderate activity
  } else if (weeklyWorkouts >= 7) {
    activityMultiplier = 1.725; // Very active
  }
  
  const maintenanceCalories = baseBMR * activityMultiplier;
  const adjustedCalories = maintenanceCalories * (1 + calorieThreshold / 100);
  
  return Math.round(adjustedCalories);
}

export function calculateCaloriesPerMeal(totalCalories: number, mealsPerDay: number = 3): number {
  return Math.round(totalCalories / mealsPerDay);
}

export function calculateMacros(calories: number) {
  // Standard macro distribution for athletes
  const proteinCalories = calories * 0.30; // 30% protein
  const fatCalories = calories * 0.25; // 25% fat
  const carbCalories = calories * 0.45; // 45% carbs
  
  return {
    protein: Math.round(proteinCalories / 4), // 4 cal per gram
    fat: Math.round(fatCalories / 9), // 9 cal per gram
    carbs: Math.round(carbCalories / 4), // 4 cal per gram
    calories
  };
}