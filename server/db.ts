import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Configuration du pool avec des limites raisonnables
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // nombre maximum de clients dans le pool
  idleTimeoutMillis: 30000, // temps d'inactivité avant de fermer un client (30 secondes)
  connectionTimeoutMillis: 2000, // temps d'attente pour une connexion (2 secondes)
});

// Gestion des erreurs du pool
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export const db = drizzle(pool, { schema });

// Fonction pour fermer proprement le pool lors de l'arrêt de l'application
export const closePool = async () => {
  console.log('Closing database pool...');
  await pool.end();
};

// Gestion de la fermeture propre lors de l'arrêt de l'application
process.on('SIGINT', async () => {
  await closePool();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closePool();
  process.exit(0);
});