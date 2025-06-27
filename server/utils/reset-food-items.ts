import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { drizzle } from 'drizzle-orm/node-postgres';
import { sql } from 'drizzle-orm';
import { Client } from 'pg';
import { foodItems } from '@shared/schema';

// Déterminer le chemin du répertoire racine du projet
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = path.join(__dirname, '../..');

// URL de connexion à la base de données en dur
const DATABASE_URL = 'postgresql://postgres:lulutina2002@localhost:5432/nutriplanner';

// Créer une connexion à la base de données
const client = new Client({
  connectionString: DATABASE_URL,
});

// Connexion à la base de données
await client.connect();
const db = drizzle(client);

// Fonction pour parser une ligne CSV en tenant compte des virgules dans les chaînes entre guillemets
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"' && (i === 0 || line[i - 1] !== '\\')) {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  if (current) {
    result.push(current);
  }
  
  return result.map(item => item.replace(/^"|"$/g, '').trim());
}

// Fonction pour normaliser les noms de catégories
function normalizeCategoryName(category: string): string {
  return category
    .toLowerCase()
    .replace(/[éèê]/g, 'e')
    .replace(/[àâ]/g, 'a')
    .replace(/[ç]/g, 'c')
    .replace(/[,\s]+/g, '-')
    .replace(/[^\w-]/g, '');
}

// Fonction pour normaliser les noms de saisons
function normalizeSeasonName(season: string): string {
  const seasonMap: { [key: string]: string } = {
    'toute-saisons': 'all',
    'printemps': 'spring',
    'été': 'summer',
    'automne': 'autumn',
    'hiver': 'winter'
  };
  
  const normalized = season
    .toLowerCase()
    .replace(/[éèê]/g, 'e')
    .replace(/[àâ]/g, 'a');
  
  return seasonMap[normalized] || normalized;
}

async function resetFoodItems() {
  try {
    console.log('Début de la réinitialisation de la table food_items...');
    
    // 1. Vider la table food_items
    console.log('Suppression des données existantes...');
    await db.delete(foodItems);
    
    // 2. Réinitialiser la séquence d'ID pour repartir de 1
    console.log('Réinitialisation de la séquence d\'ID...');
    await db.execute(sql`ALTER SEQUENCE food_items_id_seq RESTART WITH 1`);
    
    // 3. Lire le fichier CSV
    console.log('Lecture du fichier CSV...');
    const csvPath = path.join(process.cwd(), 'aliments_sains_unifie.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split('\n').filter(line => line.trim());
    
    // Ignorer la ligne d'en-tête
    const dataLines = lines.slice(1);
    
    const foodItemsToInsert = [];
    
    // 4. Parser les lignes et créer les objets à insérer
    console.log('Traitement des données CSV...');
    for (const line of dataLines) {
      if (!line.trim()) continue;
      
      const columns = parseCSVLine(line);
      if (columns.length < 10) {
        console.warn(`Ligne ignorée (colonnes insuffisantes): ${line}`);
        continue;
      }
      
      const name = columns[0];
      const category = normalizeCategoryName(columns[1]);
      const emoji = columns[3];
      const protein = parseFloat(columns[4]) || 0;
      const carbs = parseFloat(columns[5]) || 0;
      const fat = parseFloat(columns[6]) || 0;
      const calories = parseFloat(columns[7]) || 0;
      const averageWeight = parseFloat(columns[8]) || 0;
      const season = normalizeSeasonName(columns[9]);
      
      foodItemsToInsert.push({
        name,
        emoji,
        category,
        season,
        nutrition: {
          calories,
          protein,
          carbs,
          fat,
          averageWeight
        }
      });
    }
    
    // 5. Insérer les données dans la base
    console.log(`Insertion de ${foodItemsToInsert.length} aliments dans la base de données...`);
    await db.insert(foodItems).values(foodItemsToInsert);
    
    console.log('Réinitialisation terminée avec succès!');
    console.log(`${foodItemsToInsert.length} aliments ont été importés.`);
    
  } catch (error) {
    console.error('Erreur lors de la réinitialisation de la table food_items:', error);
  } finally {
    // Fermer la connexion à la base de données
    process.exit(0);
  }
}

// Exécuter le script
resetFoodItems();
