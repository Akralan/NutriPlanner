# NutriPlanner

Application web de planification de repas avec génération assistée par IA et reconnaissance vocale.

## 📋 Sommaire

- [Présentation](#présentation)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
  - [Frontend](#frontend)
  - [Backend](#backend)
  - [Base de données](#base-de-données)
  - [Intégration IA](#intégration-ia)
- [Fonctionnalités](#fonctionnalités)
- [Installation](#installation)
- [Variables d'environnement](#variables-denvironnement)
- [Développement](#développement)
- [Décisions de conception](#décisions-de-conception)
- [Problèmes connus et solutions](#problèmes-connus-et-solutions)

## 📝 Présentation

NutriPlanner est une application web modulaire permettant de créer et gérer des listes de repas, avec intégration d'IA pour la génération automatique de repas à partir de descriptions vocales. L'application permet de suivre les macronutriments, de planifier des repas et de gérer des listes de courses.

## 🛠️ Tech Stack

### Frontend
- **React 18** avec TypeScript (TSX)
- **Tailwind CSS** pour le style
- **Radix UI** pour les composants accessibles
- **React Query** (@tanstack/react-query) pour la gestion des états et requêtes API
- **Lucide React** pour les icônes
- **Zod** pour la validation des données

### Backend
- **Node.js** avec **Express**
- **PostgreSQL** comme base de données
- **Drizzle ORM** pour l'interaction avec la base de données
- **JWT** pour l'authentification
- **express-validator** et **Zod** pour la validation des données

### IA
- **OpenAI API** 
  - Modèle **Whisper** pour la transcription audio
  - **OpenAI Assistant API** pour la génération de repas via function calling

## 🏗️ Architecture

### Frontend

#### Structure des dossiers
```
client/src/
├── components/       # Composants réutilisables
│   ├── ui/           # Composants UI génériques
│   └── ...           # Autres composants spécifiques
├── hooks/            # Hooks React personnalisés
├── lib/              # Utilitaires et fonctions
├── pages/            # Pages principales de l'application
└── App.tsx           # Point d'entrée de l'application
```

#### Pages principales
- `meal-planning.tsx` - Planification des repas
- `food-selection.tsx` - Sélection des aliments
- `lists.tsx` - Gestion des listes de courses
- `login.tsx` - Authentification
- `profile.tsx` - Profil utilisateur
- `home.tsx` - Page d'accueil

#### Composants notables
- `AudioRecorder` - Enregistrement audio pour la génération de repas par IA
- `BottomNavigation` - Navigation principale de l'application
- `ProtectedRoute` - Route nécessitant une authentification
- `PublicRoute` - Route accessible sans authentification

### Backend

#### Structure des dossiers
```
server/
├── ai-functions.ts       # Fonctions appelables par l'IA
├── ai-openai-service.ts  # Service d'intégration avec OpenAI Assistant
├── ai-service.ts         # Service de reconnaissance vocale
├── ai-tools-config.ts    # Configuration des outils IA
├── db.ts                 # Configuration de la base de données
├── routes.ts             # Routes API Express
└── storage.ts            # Logique d'accès aux données
```

#### Routes API principales
- `/api/auth` - Authentification (login, register)
- `/api/profile` - Gestion du profil utilisateur
- `/api/grocery-lists` - CRUD pour les listes de courses
- `/api/grocery-lists/:id/meals` - Gestion des repas d'une liste
- `/api/food-items` - Gestion des aliments
- `/api/transcribe-audio` - Transcription audio via OpenAI Whisper
- `/api/audio-to-meal` - Génération de repas à partir d'un enregistrement audio

### Base de données

#### Schéma principal
- `users` - Informations utilisateur
- `sessions` - Sessions d'authentification
- `grocery_lists` - Listes de courses
- `food_items` - Catalogue d'aliments
- `list_items` - Éléments des listes de courses
- `meals` - Repas planifiés
- `nutrition_logs` - Journaux nutritionnels

#### Relations
- Un utilisateur peut avoir plusieurs listes
- Une liste peut contenir plusieurs repas
- Un repas contient plusieurs ingrédients (stockés en JSON)
- Un utilisateur peut avoir plusieurs journaux nutritionnels

### Intégration IA

#### Transcription audio
Le service `AiVoiceService` utilise l'API OpenAI Whisper pour convertir les enregistrements audio en texte.

#### Génération de repas
L'application utilise l'API OpenAI Assistant avec function calling pour:
1. Analyser la description textuelle d'un repas
2. Générer un repas structuré avec macronutriments et ingrédients
3. Insérer le repas dans la base de données via la fonction `addMeal`

#### Flux de traitement audio
1. L'utilisateur enregistre une description vocale via le composant `AudioRecorder`
2. Le fichier audio est envoyé au backend via l'endpoint `/api/audio-to-meal`
3. Le backend transcrit l'audio en texte avec OpenAI Whisper
4. Le texte est envoyé à l'OpenAI Assistant pour générer un repas
5. L'assistant appelle la fonction `addMeal` pour insérer le repas dans la base de données
6. Le frontend est mis à jour avec le nouveau repas via React Query

## ✨ Fonctionnalités

- **Authentification** - Inscription, connexion et gestion de profil
- **Gestion des listes** - Création, modification et suppression de listes de courses
- **Planification de repas** - Ajout, modification et suppression de repas
- **Suivi nutritionnel** - Calcul et suivi des macronutriments
- **Génération de repas par IA** - Création automatique de repas à partir de descriptions textuelles
- **Reconnaissance vocale** - Enregistrement audio pour décrire des repas
- **Duplication de listes** - Copie rapide de listes existantes
- **Validation de repas** - Marquage des repas comme complétés

## 🚀 Installation

### Prérequis
- Node.js (v16+)
- PostgreSQL (v14+)

### Étapes d'installation
1. Cloner le dépôt
```bash
git clone [url-du-repo]
cd NutriPlanner
```

2. Installer les dépendances
```bash
npm install
```

3. Configurer les variables d'environnement (voir section suivante)

4. Initialiser la base de données
```bash
npm run db:migrate
```

5. Lancer l'application en développement
```bash
npm run dev
```

## 🔐 Variables d'environnement

Créer un fichier `.env` à la racine du projet avec les variables suivantes:

```
# Base de données
DATABASE_URL=postgresql://[utilisateur]:[mot_de_passe]@localhost:5432/nutriplanner

# OpenAI API
OPENAI_API_KEY=votre_clé_api_openai
OPENAI_ASSISTANT_ID=id_de_votre_assistant_openai

# JWT
JWT_SECRET=votre_secret_jwt
```

## 👨‍💻 Développement

### Scripts disponibles
- `npm run dev` - Lance le serveur de développement (frontend + backend)
- `npm run build` - Compile l'application pour la production
- `npm run db:migrate` - Exécute les migrations de la base de données
- `npm run db:generate` - Génère de nouvelles migrations

### Ports
- Frontend: 5000
- Backend: 5001

## 🧠 Décisions de conception

### Gestion des repas multiples
- Utilisation d'un compteur `count` dans la table `meals` pour suivre plusieurs instances d'un même repas
- Transformation du champ `completedAt` en tableau JSONB pour stocker plusieurs dates de complétion

### Calcul des macronutriments
- Gestion différenciée des unités (kg, g, pièces)
- Utilisation du champ `averageWeight` pour les aliments en pièces
- Conversion en unités de 100g pour le calcul nutritionnel

### Sécurité
- Validation stricte des entrées avec Zod et express-validator
- Authentification JWT avec middleware `requireAuth`
- Rate limiting pour les appels à l'API IA

### Interface utilisateur
- Navigation par le bas pour une meilleure expérience mobile
- Composants accessibles avec Radix UI
- Notifications toast pour les retours utilisateur

## 🐛 Problèmes connus et solutions

### Authentification
- Problème: Erreurs 401 sur la page login dues à des requêtes d'authentification sans token
- Solution: Vérification préalable du token dans le hook `useAuth`

### Rechargement en boucle
- Problème: Rechargements liés au Hot Module Replacement (HMR) et WebSocket
- Solution: Configuration spécifique dans Vite

### Normalisation des emails
- Problème: Problèmes d'authentification avec les emails Gmail (suppression des points)
- Solution: Suppression de `normalizeEmail()` dans les validateurs

### Conversion audio
- Problème: Complexité de la conversion audio côté serveur
- Solution: Utilisation directe des formats acceptés par OpenAI (WAV, MP3)

### Synchronisation du compteur de repas
- Problème: Désynchronisation lors de la duplication de repas
- Solution: Correction dans la fonction `duplicateMeal`
