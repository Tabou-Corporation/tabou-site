import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Fusionne les classes Tailwind proprement.
 * Résout les conflits de classes (ex: p-4 + p-6 → p-6).
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
