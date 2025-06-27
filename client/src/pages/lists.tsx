import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Plus, Copy as CopyIcon } from "lucide-react";
import { useToast } from "../hooks/use-toast";
import { apiRequest } from "../lib/queryClient";
import BottomNavigation from "../components/bottom-navigation";
import type { GroceryList } from "@shared/schema";

function DuplicateListButton({ list }: { list: GroceryList }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(`${list.name} (copie)`);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createListMutation = useMutation({
    mutationFn: async (data: { name: string }) => {
      const response = await apiRequest("POST", "/api/grocery-lists", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Liste dupliquée",
        description: "Votre liste a été dupliquée avec succès",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/grocery-lists"] });
      setName("");
      setOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de dupliquer la liste",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({
        title: "Nom requis",
        description: "Veuillez entrer un nom pour votre liste",
        variant: "destructive",
      });
      return;
    }
    createListMutation.mutate({ name: name.trim() });
  };

  // Empêcher la propagation du clic pour éviter la navigation
  const handleButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setOpen(true);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          onClick={handleButtonClick} 
          variant="ghost" 
          size="icon" 
          className="h-5 w-5 p-0 ml-1 hover:bg-transparent"
        >
          <CopyIcon className="h-3 w-3 text-gray-500 hover:text-gray-800" />
        </Button>
      </DialogTrigger>
      <DialogContent className="glassmorphism border-2 border-white/30">
        <DialogHeader>
          <DialogTitle className="text-gray-800">Dupliquer la liste</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom de la nouvelle liste
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Courses de la semaine (copie)"
              className="glassmorphism border-2 border-white/30 rounded-xl"
              maxLength={100}
            />
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1 glassmorphism border-2 border-white/30 rounded-xl text-gray-700 hover:bg-white/40"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={createListMutation.isPending}
              className="flex-1 glassmorphism bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-medium rounded-xl"
            >
              {createListMutation.isPending ? "Duplication..." : "Dupliquer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CreateListButton() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createListMutation = useMutation({
    mutationFn: async (data: { name: string }) => {
      const response = await apiRequest("POST", "/api/grocery-lists", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Liste créée",
        description: "Votre nouvelle liste de courses a été créée avec succès",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/grocery-lists"] });
      setName("");
      setOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer la liste",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({
        title: "Nom requis",
        description: "Veuillez entrer un nom pour votre liste",
        variant: "destructive",
      });
      return;
    }
    createListMutation.mutate({ name: name.trim() });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="glassmorphism bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-medium px-6 py-3 rounded-xl shadow-lg transition-all duration-300">
          <Plus className="h-4 w-4 mr-2" />
          Créer une liste
        </Button>
      </DialogTrigger>
      <DialogContent className="glassmorphism border-2 border-white/30">
        <DialogHeader>
          <DialogTitle className="text-gray-800">Nouvelle liste de courses</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom de la liste
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Courses de la semaine"
              className="glassmorphism border-2 border-white/30 rounded-xl"
              maxLength={100}
            />
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1 glassmorphism border-2 border-white/30 rounded-xl text-gray-700 hover:bg-white/40"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={createListMutation.isPending}
              className="flex-1 glassmorphism bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-medium rounded-xl"
            >
              {createListMutation.isPending ? "Création..." : "Créer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function Lists() {
  const [location] = useLocation();
  const { data: groceryLists = [], isLoading } = useQuery<GroceryList[]>({
    queryKey: ["/api/grocery-lists"],
  });
  
  // Determine if we're in meals mode or lists mode
  const isMealsMode = location.startsWith('/meals');

  if (isLoading) {
    return (
      <div className="app-container">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Mes listes de courses</h2>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="glassmorphism rounded-2xl p-4 shadow-lg animate-pulse">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-300 rounded"></div>
                    <div>
                      <div className="w-24 h-4 bg-gray-300 rounded mb-1"></div>
                      <div className="w-20 h-3 bg-gray-300 rounded"></div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="w-6 h-6 bg-gray-300 rounded mb-1"></div>
                    <div className="w-8 h-3 bg-gray-300 rounded"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          {isMealsMode ? "Mes repas" : "Mes listes de courses"}
        </h2>
        
        {groceryLists.length === 0 ? (
          <div className="glassmorphism rounded-2xl p-8 shadow-lg text-center">
            <span className="text-4xl mb-4 block">📋</span>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Aucune liste</h3>
            <p className="text-gray-600 mb-4">Créez votre première liste de courses pour commencer.</p>
            <CreateListButton />
          </div>
        ) : (
          <div className="space-y-6">
            {groceryLists.map((list) => (
              <Link key={list.id} href={isMealsMode ? `/meals/${list.id}` : `/food-selection/${list.id}`} className="block mb-6">
                <div className="glassmorphism rounded-2xl p-4 shadow-lg cursor-pointer hover:scale-105 transition-transform">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">📋</span>
                      <div>
                        <h3 className="font-semibold text-gray-800">{list.name}</h3>
                        <p className="text-sm text-gray-600">
                          Créée le {list.createdAt ? new Date(list.createdAt).toLocaleDateString("fr-FR") : "Date inconnue"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${list.status === "active" ? "text-green-600" : "text-gray-500"}`}>
                        {list.mealCount}
                      </p>
                      <p className="text-xs text-gray-500">repas</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      list.status === "active" 
                        ? "bg-blue-100 text-blue-700" 
                        : "bg-green-100 text-green-700"
                    }`}>
                      {list.status === "active" ? "En cours" : "Terminée"}
                    </span>
                    <span onClick={(e) => e.stopPropagation()}>
                      <DuplicateListButton list={list} />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
      <BottomNavigation />
    </div>
  );
}
