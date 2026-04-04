import { Button } from "@/components/ui/Button";
import { Container } from "@/components/layout/Container";
import { cn } from "@/lib/utils/cn";
import type { CTAConfig } from "@/types/content";

interface HeroProps {
  eyebrow?: string;
  headline: string;
  subheadline?: string;
  primaryCTA?: CTAConfig;
  secondaryCTA?: CTAConfig;
  className?: string;
}

export function Hero({ eyebrow, headline, subheadline, primaryCTA, secondaryCTA, className }: HeroProps) {
  return (
    <section
      className={cn(
        "relative min-h-[92vh] flex items-center overflow-hidden",
        "bg-bg-deep",
        className
      )}
    >
      {/* Fond : grille tactique subtile */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(240,176,48,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(240,176,48,0.8) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />

      {/* Vignette */}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-b from-bg-deep/60 via-transparent to-bg-deep"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-r from-bg-deep/90 via-transparent to-bg-deep/30"
      />

      {/* Accent lumineux doré centré-bas */}
      <div
        aria-hidden
        className="absolute bottom-0 left-1/4 w-1/2 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent"
      />
      <div
        aria-hidden
        className="absolute bottom-0 left-1/4 w-1/2 h-32 bg-gradient-to-t from-gold/5 to-transparent"
      />

      <Container className="relative z-10 py-24 sm:py-32">
        <div className="max-w-3xl animate-fade-in">
          {eyebrow && (
            <p className="text-gold text-xs font-semibold tracking-extra-wide uppercase mb-6">
              {eyebrow}
            </p>
          )}

          <h1
            className="font-display font-bold text-5xl sm:text-6xl lg:text-7xl text-text-primary leading-[1.05] tracking-tight mb-6"
            style={{ whiteSpace: "pre-line" }}
          >
            {headline}
          </h1>

          {subheadline && (
            <p className="text-text-secondary text-lg sm:text-xl leading-relaxed max-w-xl mb-10">
              {subheadline}
            </p>
          )}

          {(primaryCTA ?? secondaryCTA) && (
            <div className="flex flex-wrap gap-4">
              {primaryCTA && (
                <Button
                  as="a"
                  href={primaryCTA.href}
                  variant={primaryCTA.variant ?? "primary"}
                  size="lg"
                  {...(primaryCTA.external
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                >
                  {primaryCTA.label}
                </Button>
              )}
              {secondaryCTA && (
                <Button
                  as="a"
                  href={secondaryCTA.href}
                  variant={secondaryCTA.variant ?? "ghost"}
                  size="lg"
                  {...(secondaryCTA.external
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                >
                  {secondaryCTA.label}
                </Button>
              )}
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}
