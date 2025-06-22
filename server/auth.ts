import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { pool } from "./db";

declare module "express-session" {
  interface SessionData {
    userId: number;
  }
}

const pgSession = connectPgSimple(session);

export function setupSession() {
  return session({
    store: new pgSession({
      pool: pool,
      tableName: "sessions",
      createTableIfMissing: false,
    }),
    secret: process.env.SESSION_SECRET || "fallback-secret-key-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true in production with HTTPS
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
  });
}

export function requireAuth(req: any, res: any, next: any) {
  if (req.session?.userId) {
    return next();
  }
  return res.status(401).json({ message: "Authentication required" });
}