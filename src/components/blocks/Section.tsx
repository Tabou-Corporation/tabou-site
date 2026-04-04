import { cn } from "@/lib/utils/cn";
import { Container } from "@/components/layout/Container";

interface SectionProps {
  children: React.ReactNode;
  className?: string;
  containerClassName?: string | undefined;
  /** Couleur de fond */
  bg?: "default" | "surface" | "elevated" | "none";
  /** Padding vertical */
  spacing?: "sm" | "md" | "lg" | "xl";
  id?: string;
}

const bgClasses = {
  default: "bg-bg-deep",
  surface: "bg-bg-surface",
  elevated: "bg-bg-elevated",
  none: "",
} as const;

const spacingClasses = {
  sm: "py-12",
  md: "py-16 sm:py-20",
  lg: "py-20 sm:py-28",
  xl: "py-section sm:py-section-lg",
} as const;

export function Section({
  children,
  className,
  containerClassName,
  bg = "default",
  spacing = "md",
  id,
}: SectionProps) {
  return (
    <section id={id} className={cn(bgClasses[bg], spacingClasses[spacing], className)}>
      <Container className={containerClassName}>
        {children}
      </Container>
    </section>
  );
}

interface SectionHeaderProps {
  eyebrow?: string;
  headline: string;
  description?: string;
  centered?: boolean;
  className?: string;
}

export function SectionHeader({
  eyebrow,
  headline,
  description,
  centered = false,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn(centered && "text-center", "mb-12", className)}>
      {eyebrow && (
        <p className="text-gold text-xs font-semibold tracking-extra-wide uppercase mb-3">
          {eyebrow}
        </p>
      )}
      <h2 className="font-display font-bold text-3xl sm:text-4xl text-text-primary leading-tight mb-4">
        {headline}
      </h2>
      {description && (
        <p
          className={cn(
            "text-text-secondary text-lg leading-relaxed",
            centered ? "max-w-2xl mx-auto" : "max-w-2xl"
          )}
        >
          {description}
        </p>
      )}
    </div>
  );
}
