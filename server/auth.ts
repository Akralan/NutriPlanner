import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

interface AuthRequest extends Request {
  userId?: number;
}

interface JWTPayload {
  userId: number;
  email: string;
  iat: number;
  exp: number;
}

export function generateToken(userId: number, email: string): string {
  const jwtSecret = process.env.JWT_SECRET || process.env.SESSION_SECRET;
  if (!jwtSecret || jwtSecret.length < 32) {
    throw new Error("JWT_SECRET must be set and at least 32 characters long");
  }

  return jwt.sign(
    { userId, email },
    jwtSecret,
    { 
      expiresIn: '24h',
      issuer: 'meal-planner-app',
      audience: 'meal-planner-users'
    }
  );
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    const jwtSecret = process.env.JWT_SECRET || process.env.SESSION_SECRET;
    if (!jwtSecret) {
      throw new Error("JWT_SECRET not configured");
    }

    const decoded = jwt.verify(token, jwtSecret, {
      issuer: 'meal-planner-app',
      audience: 'meal-planner-users'
    }) as JWTPayload;

    return decoded;
  } catch (error) {
    return null;
  }
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "Authentication token required" });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }

  req.userId = decoded.userId;
  next();
}