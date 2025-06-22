import { useState } from "react";
import { useLogin, useRegister } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { loginSchema, insertUserSchema } from "@shared/schema";
import type { LoginData, InsertUser } from "@shared/schema";

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const { toast } = useToast();
  const loginMutation = useLogin();
  const registerMutation = useRegister();

  const loginForm = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const registerForm = useForm<InsertUser>({
    resolver: zodResolver(insertUserSchema),
    mode: "onChange",
    defaultValues: {
      email: "",
      password: "",
      firstName: "",
      lastName: "",
    },
  });

  const onLogin = async (data: LoginData) => {
    try {
      await loginMutation.mutateAsync(data);
      toast({
        title: "Connexion réussie",
        description: "Bienvenue dans NutriListes !",
      });
    } catch (error: any) {
      toast({
        title: "Erreur de connexion",
        description: error.message || "Email ou mot de passe invalide",
        variant: "destructive",
      });
    }
  };

  const onRegister = async (data: InsertUser) => {
    try {
      console.log("Register data:", data);
      await registerMutation.mutateAsync(data);
      toast({
        title: "Inscription réussie",
        description: "Votre compte a été créé avec succès !",
      });
    } catch (error: any) {
      console.error("Register error:", error);
      toast({
        title: "Erreur d'inscription",
        description: error.message || "Une erreur est survenue lors de l'inscription",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="app-container">
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="glassmorphism rounded-3xl p-8 shadow-xl w-full max-w-md border-2 border-white/20">
          <div className="text-center mb-8">
            <div className="glassmorphism-dark rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <span className="text-2xl">🥗</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">NutriListes</h1>
            <p className="text-gray-600">
              {isRegister ? "Créez votre compte" : "Connectez-vous à votre compte"}
            </p>
          </div>

          {!isRegister ? (
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                <FormField
                  control={loginForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-medium">Email</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          placeholder="votre@email.com"
                          className="glassmorphism border-2 border-white/30 text-gray-800"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-medium">Mot de passe</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="password"
                          placeholder="••••••••"
                          className="glassmorphism border-2 border-white/30 text-gray-800"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  disabled={loginMutation.isPending}
                  className="w-full glassmorphism border-2 border-white/30 rounded-2xl p-3 text-gray-800 font-bold hover:bg-white/40 transition-all bg-white/20"
                >
                  {loginMutation.isPending ? "Connexion..." : "Se connecter"}
                </Button>
              </form>
            </Form>
          ) : (
            <div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-gray-700 font-medium text-sm block mb-2">Prénom</label>
                    <input
                      type="text"
                      placeholder="Jean"
                      className="w-full glassmorphism border-2 border-white/30 text-gray-800 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
                      value={registerForm.watch("firstName")}
                      onChange={(e) => registerForm.setValue("firstName", e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-gray-700 font-medium text-sm block mb-2">Nom</label>
                    <input
                      type="text"
                      placeholder="Dupont"
                      className="w-full glassmorphism border-2 border-white/30 text-gray-800 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
                      value={registerForm.watch("lastName")}
                      onChange={(e) => registerForm.setValue("lastName", e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-gray-700 font-medium text-sm block mb-2">Email</label>
                  <input
                    type="email"
                    placeholder="votre@email.com"
                    className="w-full glassmorphism border-2 border-white/30 text-gray-800 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
                    value={registerForm.watch("email")}
                    onChange={(e) => registerForm.setValue("email", e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-gray-700 font-medium text-sm block mb-2">Mot de passe</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="w-full glassmorphism border-2 border-white/30 text-gray-800 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
                    value={registerForm.watch("password")}
                    onChange={(e) => registerForm.setValue("password", e.target.value)}
                  />
                </div>

                <Button
                  onClick={() => {
                    const data = registerForm.getValues();
                    console.log("Form data:", data);
                    onRegister(data);
                  }}
                  disabled={registerMutation.isPending}
                  className="w-full glassmorphism border-2 border-white/30 rounded-2xl p-3 text-gray-800 font-bold hover:bg-white/40 transition-all bg-white/20"
                >
                  {registerMutation.isPending ? "Inscription..." : "S'inscrire"}
                </Button>
              </div>
            </div>
          )}

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsRegister(!isRegister)}
              className="text-gray-600 hover:text-gray-800 font-medium transition-colors"
            >
              {isRegister
                ? "Déjà un compte ? Se connecter"
                : "Pas de compte ? S'inscrire"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}