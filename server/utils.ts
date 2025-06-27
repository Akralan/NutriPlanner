/**
 * Utilitaires pour l'application NutriPlanner
 */

/**
 * Normalise une adresse email sans supprimer les points dans la partie locale
 * - Convertit en minuscules
 * - Supprime les espaces
 * - Supprime les alias (partie après le +)
 * - Préserve les points dans la partie locale (contrairement à normalizeEmail d'express-validator)
 */
export function customNormalizeEmail(value: string): string {
  if (!value) return value;
  
  // Convertir en minuscules
  let email = value.toLowerCase();
  
  // Supprimer les espaces
  email = email.trim();
  
  // Supprimer les alias (partie après le +)
  const atIndex = email.indexOf('@');
  if (atIndex > 0) {
    const localPart = email.substring(0, atIndex);
    const domainPart = email.substring(atIndex);
    
    const plusIndex = localPart.indexOf('+');
    if (plusIndex > 0) {
      email = localPart.substring(0, plusIndex) + domainPart;
    }
  }
  
  return email;
}
