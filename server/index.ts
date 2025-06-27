// Charger les variables d'environnement depuis le fichier .env
import 'dotenv/config';

import express, { type Request, Response, NextFunction } from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { createServer } from "http";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();

// Trust proxy for rate limiting in cloud environments
app.set('trust proxy', 1);

console.log("\x1b[1;36m*** LE BACKEND EST TOUJOURS EN COURS D'EXÉCUTION ***\x1b[0m");

// Enhanced security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Allow Vite dev scripts
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'", "ws:", "wss:", "https://api.openai.com"], // Allow WebSocket for Vite HMR and OpenAI
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false, // Disable for Vite dev
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  frameguard: { action: 'deny' },
  xssFilter: true,
}));

// Enhanced rate limiting with different tiers
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Trop de requêtes, réessayez plus tard",
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Stricter limit for auth endpoints
  message: "Trop de tentatives de connexion, réessayez plus tard",
  skipSuccessfulRequests: true,
});

const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Very strict for AI endpoints
  message: "Limite de requêtes IA atteinte, réessayez dans 1 minute",
});

// Apply rate limiters
app.use("/api", generalLimiter);
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api/ai", aiLimiter);

// Input sanitization middleware
app.use((req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        // Basic XSS protection - remove script tags and dangerous patterns
        req.body[key] = req.body[key]
          .replace(/<script[^>]*>.*?<\/script>/gi, '')
          .replace(/javascript:/gi, '')
          .replace(/on\w+\s*=/gi, '');
      }
    }
  }
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      
      // Sanitize sensitive data from logs
      if (capturedJsonResponse && !path.includes("/auth/")) {
        const sanitized = { ...capturedJsonResponse };
        if (sanitized.password) delete sanitized.password;
        if (sanitized.session) delete sanitized.session;
        logLine += ` :: ${JSON.stringify(sanitized)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // Ajouter CORS pour permettre au frontend d'accéder à l'API
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'http://localhost:5000');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // Configuration du serveur API (backend)
  const apiPort = 5001;
  server.listen({
    port: apiPort,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`API backend serving on port ${apiPort}`);
  });
  
  // Configuration du serveur frontend
  if (app.get("env") === "development") {
    const clientApp = express();
    const clientServer = createServer(clientApp);
    
    // Démarrer le serveur frontend
    setupVite(clientApp, clientServer).then(() => {
      clientApp.listen({
        port: 5000,
        host: "0.0.0.0",
        reusePort: true,
      }, () => {
        log(`Frontend client serving on port 5000`);
      });
    });
  } else {
    // En production, servir les fichiers statiques sur un autre port
    const clientApp = express();
    serveStatic(clientApp);
    
    clientApp.listen({
      port: 5000,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      log(`Production frontend serving on port 5000`);
    });
  }
})();
