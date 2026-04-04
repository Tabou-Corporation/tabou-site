import { cn } from "@/lib/utils/cn";
import { Container } from "./Container";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
  children?: React.ReactNode;
}

export function PageHeader({ eyebrow, title, description, className, children }: PageHeaderProps) {
  return (
    <header
      className={cn(
        "pt-24 pb-14 relative overflow-hidden",
        "bg-bg-deep border-b border-border",
        className
      )}
    >
      {/* Grille décorative subtile */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(240,176,48,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(240,176,48,0.4) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />
      {/* Dégradé de base */}
      <div
        aria-hidden
        className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent"
      />

      <Container className="relative">
        {eyebrow && (
          <p className="text-gold text-xs font-semibold tracking-extra-wide uppercase mb-4">
            {eyebrow}
          </p>
        )}
        <h1 className="font-display font-bold text-4xl sm:text-5xl text-text-primary leading-tight mb-4">
          {title}
        </h1>
        {description && (
          <p className="text-text-secondary text-lg max-w-2xl leading-relaxed">
            {description}
          </p>
        )}
        {children && <div className="mt-6">{children}</div>}
      </Container>
    </header>
  );
}
