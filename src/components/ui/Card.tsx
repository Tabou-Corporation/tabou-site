import { cn } from "@/lib/utils/cn";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  /** Ajoute un hover subtil – utile pour les cartes cliquables */
  interactive?: boolean;
  /** Ajoute un accent doré sur la bordure gauche */
  accent?: boolean;
}

export function Card({ children, className, interactive = false, accent = false }: CardProps) {
  return (
    <div
      className={cn(
        "relative bg-bg-surface border border-border rounded-md",
        "shadow-panel",
        accent && "border-l-2 border-l-gold/60",
        interactive && [
          "cursor-pointer",
          "transition-all duration-[180ms]",
          "hover:border-border-accent hover:bg-bg-elevated hover:shadow-glow-gold",
        ],
        className
      )}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function CardHeader({ children, className }: CardHeaderProps) {
  return (
    <div className={cn("px-6 py-5 border-b border-border", className)}>
      {children}
    </div>
  );
}

export function CardBody({ children, className }: CardHeaderProps) {
  return (
    <div className={cn("px-6 py-5", className)}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className }: CardHeaderProps) {
  return (
    <div className={cn("px-6 py-4 border-t border-border", className)}>
      {children}
    </div>
  );
}
