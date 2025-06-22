// Parser pour le fichier CSV des aliments
export interface FoodItemFromCSV {
  aliment: string;
  categorie: string;
  emojiCategorie: string;
  emojiAliment: string;
  proteines: number;
  glucides: number;
  lipides: number;
  kcal: number;
  poidsMoyen: number;
  saison: string;
}

export interface CategoryFromCSV {
  id: string;
  name: string;
  emoji: string;
}

// Données CSV intégrées - Version complète avec toutes les 109 aliments
const csvData = `Aliment,Catégorie,Emoji catégorie,Emoji aliment,Protéines (g/100 g),Glucides (g/100 g),Lipides (g/100 g),Kcal/100 g,Poids moyen (g),Saison
Pomme,Fruits,🍎,🍎,0.3,14.0,0.2,52,182.0,autumn
Banane,Fruits,🍎,🍌,1.1,23.0,0.3,96,118.0,toute-saisons
Orange,Fruits,🍎,🍊,0.9,12.0,0.1,47,131.0,winter
Fraise,Fruits,🍎,🍓,0.8,8.0,0.4,32,12.0,spring
Raisin,Fruits,🍎,🍇,0.7,17.0,0.2,69,5.0,autumn
Poire,Fruits,🍎,🍐,0.4,10.0,0.1,57,178.0,autumn
Kiwi,Fruits,🍎,🥝,1.1,15.0,0.5,61,76.0,winter-spring
Pêche,Fruits,🍎,🍑,0.9,10.0,0.3,39,150.0,summer
Mangue,Fruits,🍎,🥭,0.8,15.0,0.4,60,200.0,summer
Ananas,Fruits,🍎,🍍,0.5,13.0,0.1,50,905.0,summer
Carotte,Légumes,🥦,🥕,0.9,10.0,0.2,41,61.0,toute-saisons
Tomate,Légumes,🥦,🍅,0.9,3.9,0.2,18,123.0,summer
Concombre,Légumes,🥦,🥒,0.7,3.6,0.1,16,300.0,summer
Courgette,Légumes,🥦,🥒,1.2,3.1,0.3,17,196.0,summer
Épinard,Légumes,🥦,🥬,2.9,3.6,0.4,23,30.0,winter-spring
Brocoli,Légumes,🥦,🥦,2.8,7.0,0.4,34,148.0,autumn-printemps
Poivron,Légumes,🥦,🫑,1.3,6.0,0.3,27,119.0,summer
Chou-fleur,Légumes,🥦,🥦,1.9,4.9,0.3,25,600.0,autumn-winter
Aubergine,Légumes,🥦,🍆,1.0,6.0,0.2,25,550.0,summer
Laitue,Légumes,🥦,🥬,1.4,2.9,0.2,15,600.0,spring-été
Lentilles,Légumineuses,🥫,🥫,9.0,20.0,0.8,116,100.0,toute-saisons
Pois chiches,Légumineuses,🥫,🥫,8.9,27.4,2.6,164,100.0,toute-saisons
Haricots rouges,Légumineuses,🥫,🥫,8.7,22.8,0.5,127,100.0,toute-saisons
Haricots blancs,Légumineuses,🥫,🥫,8.3,16.9,0.5,127,100.0,toute-saisons
Haricots noirs,Légumineuses,🥫,🥫,8.9,23.7,0.5,339,100.0,toute-saisons
Soja (edamame),Légumineuses,🥫,🥫,11.2,8.9,5.2,122,100.0,toute-saisons
Pois cassés,Légumineuses,🥫,🥫,8.3,41.0,1.2,343,100.0,toute-saisons
Fèves,Légumineuses,🥫,🥫,7.6,13.3,0.8,88,100.0,toute-saisons
Pois verts,Légumineuses,🥫,🥫,5.4,14.5,0.4,81,100.0,toute-saisons
Lupin,Légumineuses,🥫,🥫,15.6,9.6,5.6,371,100.0,toute-saisons
Riz complet,Céréales et pseudo-céréales,🌾,🍚,7.5,23.5,1.9,111,100.0,toute-saisons
Pâtes complètes,Céréales et pseudo-céréales,🌾,🍝,12.5,70.0,1.8,350,100.0,toute-saisons
Boulgour,Céréales et pseudo-céréales,🌾,🌾,12.3,76.0,1.3,342,100.0,toute-saisons
Quinoa,Céréales et pseudo-céréales,🌾,🥣,14.1,64.2,6.1,368,100.0,toute-saisons
Sarrasin,Céréales et pseudo-céréales,🌾,🌾,13.3,71.5,3.4,343,100.0,toute-saisons
Millet,Céréales et pseudo-céréales,🌾,🌾,11.0,72.8,4.2,378,100.0,toute-saisons
Avoine,Céréales et pseudo-céréales,🌾,🥣,16.9,66.3,6.9,389,100.0,toute-saisons
Pain complet,Pains et farines,🍞,🍞,8.5,43.0,3.5,250,50.0,toute-saisons
Pain multicéréales,Pains et farines,🍞,🍞,9.0,44.0,4.0,260,50.0,toute-saisons
Pain de seigle,Pains et farines,🍞,🍞,6.0,48.0,1.5,230,50.0,toute-saisons
Farine complète de blé,Pains et farines,🍞,🌾,13.0,72.0,2.0,340,100.0,toute-saisons
Farine complète de seigle,Pains et farines,🍞,🌾,9.0,68.0,2.5,325,100.0,toute-saisons
Farine complète d'épeautre,Pains et farines,🍞,🌾,14.0,68.0,3.0,330,100.0,toute-saisons
Poitrine de poulet,Protéines animales et alternatives,🍗,🍗,31.0,0.0,3.6,165,120.0,toute-saisons
Dinde (filet),Protéines animales et alternatives,🍗,🍗,29.0,0.0,1.7,145,120.0,toute-saisons
Bœuf maigre,Protéines animales et alternatives,🍗,🥩,26.0,0.0,10.0,217,120.0,toute-saisons
Saumon,Protéines animales et alternatives,🍗,🐟,20.4,0.0,13.0,208,150.0,toute-saisons
Cabillaud,Protéines animales et alternatives,🍗,🐟,18.0,0.0,0.7,82,150.0,toute-saisons
Œuf,Protéines animales et alternatives,🍗,🥚,13.0,0.6,10.6,155,60.0,toute-saisons
Tofu ferme,Protéines animales et alternatives,🍗,🥡,8.0,1.9,4.8,76,100.0,toute-saisons
Tempeh,Protéines animales et alternatives,🍗,🍱,19.0,9.4,11.0,193,100.0,toute-saisons
Protéine végétale texturée,Protéines animales et alternatives,🍗,🫘,50.0,10.0,1.0,352,100.0,toute-saisons
Lait écrémé,Produits laitiers et substituts,🥛,🥛,3.4,5.0,0.1,35,244.0,toute-saisons
Lait demi-écrémé,Produits laitiers et substituts,🥛,🥛,3.3,5.0,1.5,50,244.0,toute-saisons
Yaourt nature,Produits laitiers et substituts,🥛,🍶,4.1,6.0,3.5,61,125.0,toute-saisons
Yaourt végétal (soja),Produits laitiers et substituts,🥛,🥛,3.5,4.0,2.0,60,125.0,toute-saisons
Fromage blanc 0%,Produits laitiers et substituts,🥛,🍶,8.0,3.0,0.1,45,125.0,toute-saisons
Lait d'amande,Produits laitiers et substituts,🥛,🥛,0.5,12.0,1.0,50,240.0,toute-saisons
Lait de soja,Produits laitiers et substituts,🥛,🥛,3.6,6.0,1.8,54,240.0,toute-saisons
Lait d'avoine,Produits laitiers et substituts,🥛,🥛,1.0,10.0,1.5,60,240.0,toute-saisons
Amandes,Noix et graines,🥜,🌰,21.2,21.6,49.9,579,1.2,toute-saisons
Noix de cajou,Noix et graines,🥜,🌰,18.0,30.2,43.8,553,1.4,toute-saisons
Noisettes,Noix et graines,🥜,🌰,14.1,16.7,60.8,628,1.2,toute-saisons
Noix,Noix et graines,🥜,🌰,15.2,13.7,65.2,654,4.5,toute-saisons
Graines de chia,Noix et graines,🥜,🌱,16.5,42.1,30.7,486,0.5,toute-saisons
Graines de lin,Noix et graines,🥜,🌱,18.3,28.9,42.2,534,0.6,toute-saisons
Graines de tournesol,Noix et graines,🥜,🌻,20.8,20.0,51.5,584,0.5,toute-saisons
Graines de courge,Noix et graines,🥜,🎃,30.2,10.7,49.1,446,1.1,toute-saisons
Huile d'olive vierge,Huiles et graisses saines,🫒,🫒,0.0,0.0,100.0,884,14.0,toute-saisons
Huile de colza vierge,Huiles et graisses saines,🫒,🛢️,0.0,0.0,100.0,884,14.0,toute-saisons
Huile de noix,Huiles et graisses saines,🫒,🥜,0.0,0.0,100.0,884,14.0,toute-saisons
Huile de lin,Huiles et graisses saines,🫒,🌱,0.0,0.0,100.0,884,14.0,toute-saisons
Beurre d'amande,Huiles et graisses saines,🫒,🥜,21.2,20.0,55.0,614,32.0,toute-saisons
Beurre de cacahuète,Huiles et graisses saines,🫒,🥜,25.0,20.0,50.0,588,32.0,toute-saisons
Basilic (frais),Épices herbes et condiments,🌶️,🌿,3.2,2.7,0.6,23,30.0,spring-été
Persil (frais),Épices herbes et condiments,🌶️,🌿,3.0,6.3,0.8,36,30.0,spring-été
Thym (sec),Épices herbes et condiments,🌶️,🌿,6.8,24.5,5.5,101,1.0,toute-saisons
Romarin (sec),Épices herbes et condiments,🌶️,🌿,4.9,21.4,13.4,131,2.0,toute-saisons
Ail (clove),Épices herbes et condiments,🌶️,🧄,6.4,33.1,0.5,149,3.0,toute-saisons
Oignon (unité),Épices herbes et condiments,🌶️,🧅,1.1,9.3,0.1,40,110.0,toute-saisons
Poivre noir (tsp),Épices herbes et condiments,🌶️,🧂,10.4,64.8,3.3,251,2.0,toute-saisons
Curcuma (tsp),Épices herbes et condiments,🌶️,🟡,7.8,64.9,6.2,312,3.0,toute-saisons
Gingembre (knob),Épices herbes et condiments,🌶️,🌱,1.8,17.8,0.7,80,30.0,toute-saisons
Paprika (tsp),Épices herbes et condiments,🌶️,🌶️,14.1,54.1,12.2,282,2.0,toute-saisons
Vinaigre balsamique (càs),Épices herbes et condiments,🌶️,🍶,0.0,17.0,0.0,88,15.0,toute-saisons
Moutarde (càs),Épices herbes et condiments,🌶️,🟡,4.5,5.0,5.0,66,5.0,toute-saisons
Sauerkraut (choucroute),Produits fermentés,🥬,🥬,1.2,2.3,0.1,19,100.0,toute-saisons
Cornichons fermentés,Produits fermentés,🥬,🥒,0.8,1.5,0.2,12,100.0,toute-saisons
Kimchi,Produits fermentés,🥬,🌶️,1.9,4.1,1.1,56,100.0,toute-saisons
Kéfir,Produits fermentés,🥬,🥛,3.3,4.0,1.0,50,240.0,toute-saisons
Kombucha,Produits fermentés,🥬,🍹,0.0,3.0,0.0,14,240.0,toute-saisons
Barre de céréales complètes,Snacks et encas sains,🍫,🍫,7.0,60.0,10.0,350,30.0,toute-saisons
Crackers de légumes,Snacks et encas sains,🍫,🍘,5.0,60.0,10.0,350,10.0,toute-saisons
Boulettes de pois chiches,Snacks et encas sains,🍫,🍡,9.0,30.0,15.0,280,20.0,toute-saisons
Chips de kale,Snacks et encas sains,🍫,🥬,4.0,50.0,25.0,430,15.0,toute-saisons
Barre de noix et graines,Snacks et encas sains,🍫,🥜,12.0,35.0,30.0,450,40.0,toute-saisons
Boules d'énergie (datte-noix),Snacks et encas sains,🍫,🍪,8.0,55.0,20.0,320,25.0,toute-saisons
Eau minérale,Boissons sans sucre ajouté,🥤,💧,0.0,0.0,0.0,0,240.0,toute-saisons
Eau pétillante,Boissons sans sucre ajouté,🥤,💧,0.0,0.0,0.0,0,240.0,toute-saisons
Thé vert (infusé),Boissons sans sucre ajouté,🥤,🍵,0.1,0.2,0.0,1,240.0,toute-saisons
Thé noir (infusé),Boissons sans sucre ajouté,🥤,🍵,0.1,0.2,0.0,1,240.0,toute-saisons
Infusion de camomille,Boissons sans sucre ajouté,🥤,🌼,0.0,0.0,0.0,0,240.0,toute-saisons
Café noir (infus),Boissons sans sucre ajouté,🥤,☕,0.1,0.0,0.0,1,240.0,toute-saisons
Protéine de pois (poudre),Suppléments et compléments,💊,🥤,80.0,5.0,2.0,400,30.0,toute-saisons
Protéine de riz (poudre),Suppléments et compléments,💊,🥤,80.0,7.0,1.0,390,30.0,toute-saisons
Levure nutritionnelle,Suppléments et compléments,💊,🧂,50.0,20.0,5.0,325,15.0,toute-saisons
Spiruline (poudre),Suppléments et compléments,💊,🟢,57.5,24.0,7.0,350,5.0,toute-saisons
Poudre de maca,Suppléments et compléments,💊,🍄,11.0,58.0,2.0,350,10.0,toute-saisons
Poudre de baobab,Suppléments et compléments,💊,🍃,2.0,80.0,1.0,360,10.0,toute-saisons
Millet,Céréales et pseudo-céréales,🌾,🌾,11.0,72.8,4.2,378,100.0,toute
Avoine,Céréales et pseudo-céréales,🌾,🥣,16.9,66.3,6.9,389,100.0,toute
Pain complet,Pains et farines,🍞,🍞,8.5,43.0,3.5,250,50.0,toute
Pain multicéréales,Pains et farines,🍞,🍞,9.0,44.0,4.0,260,50.0,toute
Pain de seigle,Pains et farines,🍞,🍞,6.0,48.0,1.5,230,50.0,toute
Farine complète de blé,Pains et farines,🍞,🌾,13.0,72.0,2.0,340,100.0,toute
Farine complète de seigle,Pains et farines,🍞,🌾,9.0,68.0,2.5,325,100.0,toute
Farine complète d'épeautre,Pains et farines,🍞,🌾,14.0,68.0,3.0,330,100.0,toute
Poitrine de poulet,Protéines animales et alternatives,🍗,🍗,31.0,0.0,3.6,165,120.0,toute
Dinde (filet),Protéines animales et alternatives,🍗,🍗,29.0,0.0,1.7,145,120.0,toute
Bœuf maigre,Protéines animales et alternatives,🍗,🥩,26.0,0.0,10.0,217,120.0,toute
Saumon,Protéines animales et alternatives,🍗,🐟,20.4,0.0,13.0,208,150.0,toute
Cabillaud,Protéines animales et alternatives,🍗,🐟,18.0,0.0,0.7,82,150.0,toute
Œuf,Protéines animales et alternatives,🍗,🥚,13.0,0.6,10.6,155,60.0,toute
Tofu ferme,Protéines animales et alternatives,🍗,🥡,8.0,1.9,4.8,76,100.0,toute
Tempeh,Protéines animales et alternatives,🍗,🍱,19.0,9.4,11.0,193,100.0,toute
Protéine végétale texturée,Protéines animales et alternatives,🍗,🫘,50.0,10.0,1.0,352,100.0,toute
Lait écrémé,Produits laitiers et substituts,🥛,🥛,3.4,5.0,0.1,35,244.0,toute
Lait demi-écrémé,Produits laitiers et substituts,🥛,🥛,3.3,5.0,1.5,50,244.0,toute
Yaourt nature,Produits laitiers et substituts,🥛,🍶,4.1,6.0,3.5,61,125.0,toute
Yaourt végétal (soja),Produits laitiers et substituts,🥛,🥛,3.5,4.0,2.0,60,125.0,toute
Fromage blanc 0%,Produits laitiers et substituts,🥛,🍶,8.0,3.0,0.1,45,125.0,toute
Lait d'amande,Produits laitiers et substituts,🥛,🥛,0.5,12.0,1.0,50,240.0,toute
Lait de soja,Produits laitiers et substituts,🥛,🥛,3.6,6.0,1.8,54,240.0,toute
Lait d'avoine,Produits laitiers et substituts,🥛,🥛,1.0,10.0,1.5,60,240.0,toute
Amandes,Noix et graines,🥜,🌰,21.2,21.6,49.9,579,1.2,toute
Noix de cajou,Noix et graines,🥜,🌰,18.0,30.2,43.8,553,1.4,toute
Noisettes,Noix et graines,🥜,🌰,14.1,16.7,60.8,628,1.2,toute
Noix,Noix et graines,🥜,🌰,15.2,13.7,65.2,654,4.5,toute
Graines de chia,Noix et graines,🥜,🌱,16.5,42.1,30.7,486,0.5,toute
Graines de lin,Noix et graines,🥜,🌱,18.3,28.9,42.2,534,0.6,toute
Graines de tournesol,Noix et graines,🥜,🌻,20.8,20.0,51.5,584,0.5,toute
Graines de courge,Noix et graines,🥜,🎃,30.2,10.7,49.1,446,1.1,toute
Huile d'olive vierge,Huiles et graisses saines,🫒,🫒,0.0,0.0,100.0,884,14.0,toute
Huile de colza vierge,Huiles et graisses saines,🫒,🛢️,0.0,0.0,100.0,884,14.0,toute
Huile de noix,Huiles et graisses saines,🫒,🥜,0.0,0.0,100.0,884,14.0,toute
Huile de lin,Huiles et graisses saines,🫒,🌱,0.0,0.0,100.0,884,14.0,toute
Beurre d'amande,Huiles et graisses saines,🫒,🥜,21.2,20.0,55.0,614,32.0,toute
Beurre de cacahuète,Huiles et graisses saines,🫒,🥜,25.0,20.0,50.0,588,32.0,toute
Basilic (frais),Épices herbes et condiments,🌶️,🌿,3.2,2.7,0.6,23,30.0,printemps-été
Persil (frais),Épices herbes et condiments,🌶️,🌿,3.0,6.3,0.8,36,30.0,printemps-été
Thym (sec),Épices herbes et condiments,🌶️,🌿,6.8,24.5,5.5,101,1.0,toute
Romarin (sec),Épices herbes et condiments,🌶️,🌿,4.9,21.4,13.4,131,2.0,toute
Ail (clove),Épices herbes et condiments,🌶️,🧄,6.4,33.1,0.5,149,3.0,toute
Oignon (unité),Épices herbes et condiments,🌶️,🧅,1.1,9.3,0.1,40,110.0,toute
Poivre noir (tsp),Épices herbes et condiments,🌶️,🧂,10.4,64.8,3.3,251,2.0,toute
Curcuma (tsp),Épices herbes et condiments,🌶️,🟡,7.8,64.9,6.2,312,3.0,toute
Gingembre (knob),Épices herbes et condiments,🌶️,🌱,1.8,17.8,0.7,80,30.0,toute
Paprika (tsp),Épices herbes et condiments,🌶️,🌶️,14.1,54.1,12.2,282,2.0,toute
Vinaigre balsamique (càs),Épices herbes et condiments,🌶️,🍶,0.0,17.0,0.0,88,15.0,toute
Moutarde (càs),Épices herbes et condiments,🌶️,🟡,4.5,5.0,5.0,66,5.0,toute
Sauerkraut (choucroute),Produits fermentés,🥬,🥬,1.2,2.3,0.1,19,100.0,toute
Cornichons fermentés,Produits fermentés,🥬,🥒,0.8,1.5,0.2,12,100.0,toute
Kimchi,Produits fermentés,🥬,🌶️,1.9,4.1,1.1,56,100.0,toute
Kéfir,Produits fermentés,🥬,🥛,3.3,4.0,1.0,50,240.0,toute
Kombucha,Produits fermentés,🥬,🍹,0.0,3.0,0.0,14,240.0,toute
Barre de céréales complètes,Snacks et encas sains,🍫,🍫,7.0,60.0,10.0,350,30.0,toute
Crackers de légumes,Snacks et encas sains,🍫,🍘,5.0,60.0,10.0,350,10.0,toute
Boulettes de pois chiches,Snacks et encas sains,🍫,🍡,9.0,30.0,15.0,280,20.0,toute
Chips de kale,Snacks et encas sains,🍫,🥬,4.0,50.0,25.0,430,15.0,toute
Barre de noix et graines,Snacks et encas sains,🍫,🥜,12.0,35.0,30.0,450,40.0,toute
Boules d'énergie (datte-noix),Snacks et encas sains,🍫,🍪,8.0,55.0,20.0,320,25.0,toute
Eau minérale,Boissons sans sucre ajouté,🥤,💧,0.0,0.0,0.0,0,240.0,toute
Eau pétillante,Boissons sans sucre ajouté,🥤,💧,0.0,0.0,0.0,0,240.0,toute
Thé vert (infusé),Boissons sans sucre ajouté,🥤,🍵,0.1,0.2,0.0,1,240.0,toute
Thé noir (infusé),Boissons sans sucre ajouté,🥤,🍵,0.1,0.2,0.0,1,240.0,toute
Infusion de camomille,Boissons sans sucre ajouté,🥤,🌼,0.0,0.0,0.0,0,240.0,toute
Café noir (infus),Boissons sans sucre ajouté,🥤,☕,0.1,0.0,0.0,1,240.0,toute
Protéine de pois (poudre),Suppléments et compléments,💊,🥤,80.0,5.0,2.0,400,30.0,toute
Protéine de riz (poudre),Suppléments et compléments,💊,🥤,80.0,7.0,1.0,390,30.0,toute
Levure nutritionnelle,Suppléments et compléments,💊,🧂,50.0,20.0,5.0,325,15.0,toute
Spiruline (poudre),Suppléments et compléments,💊,🟢,57.5,24.0,7.0,350,5.0,toute
Poudre de maca,Suppléments et compléments,💊,🍄,11.0,58.0,2.0,350,10.0,toute
Poudre de baobab,Suppléments et compléments,💊,🍃,2.0,80.0,1.0,360,10.0,toute`;

export function parseCSVData(): { categories: CategoryFromCSV[], foods: FoodItemFromCSV[] } {
  const lines = csvData.trim().split('\n');
  const foods: FoodItemFromCSV[] = [];
  const categoriesMap = new Map<string, CategoryFromCSV>();
  
  // Skip header
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    
    const columns = line.split(',');
    if (columns.length < 10) continue;
    
    const aliment = columns[0].trim();
    const categorie = columns[1].trim();
    const emojiCategorie = columns[2].trim();
    const emojiAliment = columns[3].trim();
    const proteines = parseFloat(columns[4]) || 0;
    const glucides = parseFloat(columns[5]) || 0;
    const lipides = parseFloat(columns[6]) || 0;
    const kcal = parseFloat(columns[7]) || 0;
    const poidsMoyen = parseFloat(columns[8]) || 0;
    const saison = columns[9].trim();
    
    // Add category if not exists
    if (!categoriesMap.has(categorie)) {
      categoriesMap.set(categorie, {
        id: categorie.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        name: categorie,
        emoji: emojiCategorie
      });
    }
    
    foods.push({
      aliment,
      categorie,
      emojiCategorie,
      emojiAliment,
      proteines,
      glucides,
      lipides,
      kcal,
      poidsMoyen,
      saison
    });
  }
  
  return {
    categories: Array.from(categoriesMap.values()),
    foods
  };
}

// Convert CSV data to app format
export function convertCSVToAppFormat() {
  const { categories, foods } = parseCSVData();
  
  const appCategories = categories.map(cat => ({
    id: cat.id,
    name: cat.name,
    emoji: cat.emoji
  }));
  
  const appFoods = foods.map((food, index) => ({
    id: index + 1,
    name: food.aliment,
    emoji: food.emojiAliment,
    category: food.categorie.toLowerCase().replace(/[^a-z0-9]/g, '-'),
    season: convertSeason(food.saison),
    // Calculate nutritional values for the average weight
    calories: Math.round((food.kcal * food.poidsMoyen) / 100),
    protein: Math.round((food.proteines * food.poidsMoyen) / 100 * 10) / 10,
    fat: Math.round((food.lipides * food.poidsMoyen) / 100 * 10) / 10,
    carbs: Math.round((food.glucides * food.poidsMoyen) / 100 * 10) / 10,
    weight: food.poidsMoyen
  }));
  
  return { categories: appCategories, foods: appFoods };
}

function convertSeason(season: string): string[] {
  const seasonMap: { [key: string]: string[] } = {
    'automne': ['autumn'],
    'hiver': ['winter'],
    'printemps': ['spring'],
    'été': ['summer'],
    'toute': ['all'],
    'hiver-printemps': ['winter', 'spring'],
    'printemps-été': ['spring', 'summer'],
    'automne-printemps': ['autumn', 'spring'],
    'automne-hiver': ['autumn', 'winter']
  };
  
  return seasonMap[season] || ['all'];
}