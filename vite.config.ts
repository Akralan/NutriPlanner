import { defineConfig, loadEnv, type ConfigEnv, type UserConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from 'url';
import type { ServerOptions } from 'https';

// Get the directory name in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }: ConfigEnv): UserConfig => {
  const env = loadEnv(mode, process.cwd(), '');
  
  // Chemins de base
  const rootDir = path.resolve(__dirname);
  const clientDir = path.join(rootDir, 'client');
  const srcDir = path.join(clientDir, 'src');

  // Configuration HTTPS
  let https: ServerOptions | undefined;
  if (mode === 'development' && env.VITE_USE_HTTPS === 'true') {
    https = {
      key: './certs/localhost-key.pem',
      cert: './certs/localhost.pem',
    };
  }

  return {
    plugins: [react()],
    resolve: {
      alias: [
        { 
          find: '@', 
          replacement: srcDir,
        },
        { 
          find: '@shared', 
          replacement: path.join(rootDir, 'shared'),
        },
      ],
      // Améliore la résolution des extensions
      extensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
    },
    root: clientDir,
    base: './', // Changé de '/' à './' pour les chemins relatifs
    build: {
      outDir: path.join(rootDir, "dist/public"),
      emptyOutDir: true,
      rollupOptions: {
        input: {
          main: path.resolve(clientDir, 'index.html')
        },
        // Meilleure gestion des erreurs de résolution
        onwarn(warning, warn) {
          if (warning.code === 'UNUSED_EXTERNAL_IMPORT') return;
          warn(warning);
        }
      },
      // Meilleure gestion des erreurs de build
      minify: 'esbuild',
      sourcemap: true,
    },
    server: {
      port: 5000,
      https,
      strictPort: true,
      // Meilleure gestion des erreurs de proxy
      proxy: {
        '^/api': {
          target: env.VITE_API_URL || 'http://localhost:5001',
          changeOrigin: true,
          secure: false,
          ws: true,
          // Meilleure gestion des erreurs de connexion
          timeout: 60000,
        }
      },
      // Meilleure gestion des erreurs de chargement
      hmr: {
        overlay: true,
      },
      // Meilleure gestion des erreurs de fichiers
      fs: {
        strict: true,
      },
    },
    // Meilleure gestion des variables d'environnement
    define: {
      'process.env': {},
      __APP_ENV__: JSON.stringify(env.NODE_ENV || 'development'),
    },
    // Meilleur logging des erreurs
    logLevel: 'warn',
    clearScreen: false,
  };
});