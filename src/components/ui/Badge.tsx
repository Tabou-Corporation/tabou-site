import { cn } from "@/lib/utils/cn";

type BadgeVariant = "default" | "gold" | "red" | "muted" | "outline";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-bg-elevated text-text-secondary border border-border",
  gold: "bg-gold/10 text-gold border border-gold/30",
  red: "bg-red/10 text-red-light border border-red/30",
  muted: "bg-bg-elevated text-text-muted border border-border-subtle",
  outline: "bg-transparent text-text-secondary border border-border",
};

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium tracking-wide",
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
