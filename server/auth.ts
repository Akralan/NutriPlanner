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
  // Ensure required environment variables
  const sessionSecret = process.env.SESSION_SECRET;
  if (!sessionSecret || sessionSecret.length < 32) {
    throw new Error("SESSION_SECRET must be set and at least 32 characters long");
  }

  const isProduction = process.env.NODE_ENV === "production";
  
  return session({
    store: new pgSession({
      pool: pool,
      tableName: "sessions",
      createTableIfMissing: false,
    }),
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    name: "sessionId", // Hide default session name
    cookie: {
      secure: isProduction, // HTTPS only in production
      httpOnly: true,
      sameSite: "strict", // CSRF protection
      maxAge: 24 * 60 * 60 * 1000, // 24 hours (reduced from 7 days)
    },
    rolling: true, // Reset expiration on activity
  });
}

export function requireAuth(req: any, res: any, next: any) {
  if (req.session?.userId) {
    return next();
  }
  return res.status(401).json({ message: "Authentication required" });
}