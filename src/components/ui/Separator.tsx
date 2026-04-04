import { cn } from "@/lib/utils/cn";

interface SeparatorProps {
  className?: string;
  /** Orientation horizontale (défaut) ou verticale */
  orientation?: "horizontal" | "vertical";
  /** Ajoute un gradient doré au centre */
  gold?: boolean;
}

export function Separator({ className, orientation = "horizontal", gold = false }: SeparatorProps) {
  if (orientation === "vertical") {
    return (
      <div
        aria-hidden
        className={cn("w-px self-stretch bg-border", className)}
      />
    );
  }

  return (
    <div
      aria-hidden
      className={cn(
        "h-px w-full",
        gold
          ? "bg-gradient-to-r from-transparent via-gold/40 to-transparent"
          : "bg-border",
        className
      )}
    />
  );
}
