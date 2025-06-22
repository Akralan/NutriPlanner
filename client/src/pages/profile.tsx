import React from "react";
import { useAuth, useUpdateProfile, useLogout, calculateDailyCalories, calculateCaloriesPerMeal, calculateMacros } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { updateProfileSchema } from "@shared/schema";
import type { UpdateProfile } from "@shared/schema";
import BottomNavigation from "@/components/bottom-navigation";

export default function Profile() {
  const { user, isLoading } = useAuth();
  const updateProfileMutation = useUpdateProfile();
  const logoutMutation = useLogout();
  const { toast } = useToast();

  const form = useForm<UpdateProfile>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      height: user?.height || undefined,
      weight: user?.weight || undefined,
      weeklyWorkouts: user?.weeklyWorkouts || 0,
      calorieThreshold: user?.calorieThreshold || 0,
      mealsPerDay: user?.mealsPerDay || 3,
    },
  });

  // Update form when user data changes (avoid re-render loop)
  React.useEffect(() => {
    if (user && !form.formState.isDirty) {
      form.reset({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        height: user.height || undefined,
        weight: user.weight || undefined,
        weeklyWorkouts: user.weeklyWorkouts || 0,
        calorieThreshold: user.calorieThreshold || 0,
        mealsPerDay: user.mealsPerDay || 3,
      });
    }
  }, [user, form]);

  const onSubmit = async (data: UpdateProfile) => {
    try {
      await updateProfileMutation.mutateAsync(data);
      toast({
        title: "Profil mis à jour",
        description: "Vos informations ont été sauvegardées avec succès.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le profil. Veuillez réessayer.",
        variant: "destructive",
      });
    }
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  // Calculate calories if we have weight, height, and weekly workouts
  const dailyCalories = user?.weight && user?.height 
    ? calculateDailyCalories(user.weight, user.height, user.weeklyWorkouts || 0, user.calorieThreshold || 0)
    : null;
  
  const caloriesPerMeal = dailyCalories ? calculateCaloriesPerMeal(dailyCalories, user?.mealsPerDay || 3) : null;
  const macros = caloriesPerMeal ? calculateMacros(caloriesPerMeal) : null;

  if (isLoading) {
    return (
      <div className="app-container">
        <div className="p-6">
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="glassmorphism rounded-2xl p-8 animate-pulse">
              <div className="w-32 h-8 bg-gray-300 rounded mb-4"></div>
              <div className="w-48 h-4 bg-gray-300 rounded"></div>
            </div>
          </div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="app-container">
        <div className="p-6">
          <div className="glassmorphism rounded-2xl p-8 shadow-lg text-center">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Non connecté</h3>
            <p className="text-gray-600">Veuillez vous connecter pour accéder à votre profil.</p>
          </div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="app-container lg:max-w-6xl">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Mon Profil</h2>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="glassmorphism border-2 border-white/30 rounded-xl text-gray-800 font-medium hover:bg-white/40"
          >
            Déconnexion
          </Button>
        </div>

        {/* Check if user has complete profile data */}
        {user?.height && user?.weight ? (
          /* Desktop responsive layout for complete profiles */
          <div className="lg:grid lg:grid-cols-2 lg:gap-6 space-y-6 lg:space-y-0">
            {/* Personal Information Form */}
            <div className="glassmorphism rounded-2xl p-6 shadow-lg border-2 border-white/30">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Informations personnelles</h3>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 text-sm">Prénom</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              className="glassmorphism border-2 border-white/30 rounded-xl h-10"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 text-sm">Nom</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              className="glassmorphism border-2 border-white/30 rounded-xl h-10"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name="height"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 text-sm">Taille (cm)</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="number"
                              value={field.value || ''}
                              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                              className="glassmorphism border-2 border-white/30 rounded-xl h-10"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="weight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 text-sm">Poids (kg)</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="number"
                              value={field.value || ''}
                              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                              className="glassmorphism border-2 border-white/30 rounded-xl h-10"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="weeklyWorkouts"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 text-sm">Séances de sport par semaine</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="number"
                            value={field.value || 0}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            className="glassmorphism border-2 border-white/30 rounded-xl h-10"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name="calorieThreshold"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 text-sm">Seuil calories (%)</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="number"
                              value={field.value || 0}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              className="glassmorphism border-2 border-white/30 rounded-xl h-10"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="mealsPerDay"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 text-sm">Repas par jour</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="number"
                              value={field.value || 3}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 3)}
                              className="glassmorphism border-2 border-white/30 rounded-xl h-10"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="text-xs text-gray-600 mt-2">
                    {(form.watch('calorieThreshold') || 0) < 0 && "Perte de poids"} 
                    {(form.watch('calorieThreshold') || 0) > 0 && "Prise de masse"}
                  </div>

                  <Button 
                    type="submit" 
                    disabled={updateProfileMutation.isPending}
                    className="w-full glassmorphism bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-medium py-3 rounded-xl shadow-lg transition-all duration-300"
                  >
                    {updateProfileMutation.isPending ? "Sauvegarde..." : "Sauvegarder"}
                  </Button>
                </form>
              </Form>
            </div>

            {/* Calorie Information */}
            {caloriesPerMeal && macros && (
              <div className="glassmorphism rounded-2xl p-6 shadow-lg border-2 border-white/30">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Objectifs nutritionnels par repas</h3>
                
                {/* Calories */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Calories</span>
                    <span className="text-sm font-bold text-gray-800">{caloriesPerMeal} kcal</span>
                  </div>
                </div>

                {/* Macronutrients with Progress Bars */}
                <div className="space-y-3">
                  {/* Protéines */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-blue-700">Protéines</span>
                      <span className="text-sm font-bold text-blue-800">{macros.protein}g</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, (macros.protein / (macros.protein * 1.2)) * 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Lipides */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-yellow-700">Lipides</span>
                      <span className="text-sm font-bold text-yellow-800">{macros.fat}g</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, (macros.fat / (macros.fat * 1.2)) * 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Glucides */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-green-700">Glucides</span>
                      <span className="text-sm font-bold text-green-800">{macros.carbs}g</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, (macros.carbs / (macros.carbs * 1.2)) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-white/20">
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">{dailyCalories}</div>
                    <div className="text-xs text-gray-600">kcal / jour</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600">{user?.mealsPerDay || 3}</div>
                    <div className="text-xs text-gray-600">repas / jour</div>
                  </div>
                </div>
                
                <p className="text-xs text-gray-500 mt-3 text-center">
                  Seuil calories: {user?.calorieThreshold || 0}% • 30% prot., 25% lip., 45% gluc.
                </p>
              </div>
            )}

            {/* Account Information - positioned at bottom with 50% width on desktop */}
            <div className="lg:col-span-2">
              <div className="glassmorphism rounded-2xl p-6 shadow-lg border-2 border-white/30 lg:w-1/2">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Informations du compte</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email :</span>
                    <span className="text-gray-800 font-medium">{user?.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Membre depuis :</span>
                    <span className="text-gray-800 font-medium">
                      {user?.createdAt ? new Date(user.createdAt).toLocaleDateString("fr-FR") : "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Single column layout for new users without complete profile */
          <div className="max-w-2xl mx-auto">
            <div className="glassmorphism rounded-2xl p-6 shadow-lg border-2 border-white/30 mb-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Complétez votre profil</h3>
              <p className="text-gray-600 mb-6">
                Renseignez vos informations pour accéder aux objectifs nutritionnels personnalisés.
              </p>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 text-sm">Prénom</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              className="glassmorphism border-2 border-white/30 rounded-xl h-10"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 text-sm">Nom</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              className="glassmorphism border-2 border-white/30 rounded-xl h-10"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name="height"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 text-sm">Taille (cm)</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="number"
                              placeholder="175"
                              value={field.value || ''}
                              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                              className="glassmorphism border-2 border-white/30 rounded-xl h-10"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="weight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 text-sm">Poids (kg)</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="number"
                              placeholder="70"
                              value={field.value || ''}
                              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                              className="glassmorphism border-2 border-white/30 rounded-xl h-10"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="weeklyWorkouts"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 text-sm">Séances de sport par semaine</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="number"
                            placeholder="3"
                            value={field.value || 0}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            className="glassmorphism border-2 border-white/30 rounded-xl h-10"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name="calorieThreshold"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 text-sm">Seuil calories (%)</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="number"
                              placeholder="0"
                              value={field.value || 0}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              className="glassmorphism border-2 border-white/30 rounded-xl h-10"
                            />
                          </FormControl>
                          <FormMessage />
                          <p className="text-xs text-gray-500 mt-1">-20% (sèche) à +20% (prise de masse)</p>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="mealsPerDay"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 text-sm">Repas par jour</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="number"
                              placeholder="3"
                              value={field.value || 3}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 3)}
                              className="glassmorphism border-2 border-white/30 rounded-xl h-10"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="text-xs text-gray-600 mt-2">
                    {(form.watch('calorieThreshold') || 0) < 0 && "Perte de poids"} 
                    {(form.watch('calorieThreshold') || 0) > 0 && "Prise de masse"}
                  </div>

                  <Button 
                    type="submit" 
                    disabled={updateProfileMutation.isPending}
                    className="w-full glassmorphism bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-medium py-3 rounded-xl shadow-lg transition-all duration-300"
                  >
                    {updateProfileMutation.isPending ? "Sauvegarde..." : "Sauvegarder"}
                  </Button>
                </form>
              </Form>
            </div>

            {/* Account Information for new users */}
            <div className="glassmorphism rounded-2xl p-6 shadow-lg border-2 border-white/30">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Informations du compte</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Email :</span>
                  <span className="text-gray-800 font-medium">{user?.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Membre depuis :</span>
                  <span className="text-gray-800 font-medium">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString("fr-FR") : "N/A"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <BottomNavigation />
    </div>
  );
}