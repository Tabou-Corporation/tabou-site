import { Button } from "@/components/ui/Button";
import { Container } from "@/components/layout/Container";
import { cn } from "@/lib/utils/cn";
import type { CTAConfig } from "@/types/content";

interface CTAPanelProps {
  eyebrow?: string;
  headline: string;
  description?: string;
  primaryCTA?: CTAConfig;
  secondaryCTA?: CTAConfig;
  className?: string;
  /** Style visuel du panel */
  variant?: "default" | "bordered" | "gold";
}

export function CTAPanel({
  eyebrow,
  headline,
  description,
  primaryCTA,
  secondaryCTA,
  className,
  variant = "default",
}: CTAPanelProps) {
  return (
    <section
      className={cn(
        "py-20 sm:py-28",
        variant === "default" && "bg-bg-surface border-y border-border",
        variant === "bordered" && "bg-bg-deep",
        variant === "gold" && "bg-bg-surface border-y border-gold/20",
        className
      )}
    >
      <Container size="md">
        <div className="text-center space-y-6">
          {eyebrow && (
            <p className="text-gold text-xs font-semibold tracking-extra-wide uppercase">
              {eyebrow}
            </p>
          )}
          <h2 className="font-display font-bold text-3xl sm:text-4xl text-text-primary leading-tight">
            {headline}
          </h2>
          {description && (
            <p className="text-text-secondary text-lg leading-relaxed max-w-xl mx-auto">
              {description}
            </p>
          )}
          {(primaryCTA ?? secondaryCTA) && (
            <div className="flex flex-wrap justify-center gap-4 pt-2">
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
                  variant={secondaryCTA.variant ?? "secondary"}
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
