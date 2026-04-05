import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface SpinnerProps {
  size?: number;
  className?: string;
}

/**
 * Indicateur de chargement inline — s'insère dans un bouton ou un texte.
 * Utilise l'icône Loader2 de Lucide avec une animation spin Tailwind.
 */
export function Spinner({ size = 14, className }: SpinnerProps) {
  return (
    <Loader2
      size={size}
      className={cn("animate-spin shrink-0", className)}
      aria-hidden
    />
  );
}
