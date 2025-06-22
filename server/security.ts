import { z } from "zod";

// Sanitization utilities for security
export function sanitizeHtml(input: string): string {
  // Remove HTML tags and dangerous characters
  return input
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .replace(/data:/gi, '') // Remove data: protocol
    .replace(/vbscript:/gi, '') // Remove vbscript: protocol
    .trim();
}

export function validateTextInput(input: string, maxLength: number = 1000): string {
  if (!input || typeof input !== 'string') {
    throw new Error('Input must be a valid string');
  }
  
  if (input.length > maxLength) {
    throw new Error(`Input too long. Maximum ${maxLength} characters allowed`);
  }
  
  // Check for suspicious patterns
  const suspiciousPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /data:text\/html/gi,
    /eval\s*\(/gi,
    /Function\s*\(/gi,
    /setTimeout\s*\(/gi,
    /setInterval\s*\(/gi,
  ];
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(input)) {
      throw new Error('Input contains potentially dangerous content');
    }
  }
  
  return sanitizeHtml(input);
}

// Rate limiting for AI requests
const aiRequestLimits = new Map<string, { count: number; resetTime: number }>();

export function checkAiRateLimit(userId: number, maxRequests: number = 10, windowMs: number = 60000): boolean {
  const now = Date.now();
  const userKey = `ai_${userId}`;
  const userLimit = aiRequestLimits.get(userKey);
  
  if (!userLimit || now > userLimit.resetTime) {
    aiRequestLimits.set(userKey, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (userLimit.count >= maxRequests) {
    return false;
  }
  
  userLimit.count++;
  return true;
}

// Schema for AI meal creation request
export const aiMealRequestSchema = z.object({
  description: z.string()
    .min(5, "Description too short")
    .max(500, "Description too long")
    .refine((val) => {
      try {
        validateTextInput(val, 500);
        return true;
      } catch {
        return false;
      }
    }, "Invalid input format"),
  listId: z.number().int().positive(),
});

export type AiMealRequest = z.infer<typeof aiMealRequestSchema>;

// Validation for AI response
export const aiMealResponseSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  ingredients: z.array(z.object({
    foodItemId: z.number().int().positive(),
    quantity: z.number().positive(),
    unit: z.string().min(1).max(20),
  })).min(1).max(20),
  estimatedCalories: z.number().positive().max(5000),
  estimatedProtein: z.number().positive().max(500),
  estimatedCarbs: z.number().positive().max(500),
  estimatedFat: z.number().positive().max(500),
});

export type AiMealResponse = z.infer<typeof aiMealResponseSchema>;