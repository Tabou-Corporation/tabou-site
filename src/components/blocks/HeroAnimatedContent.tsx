import type { CSSProperties } from "react";
import { Button } from "@/components/ui/Button";
import type { CTAConfig } from "@/types/content";

// ─── Props ─────────────────────────────────────────────────────────────────────

interface HeroAnimatedContentProps {
  eyebrow?: string;
  headline?: string;
  subheadline?: string;
  primaryCTA?: CTAConfig;
  secondaryCTA?: CTAConfig;
  /** Active le mode logo : grand emblème + wordmark "TABOU" */
  logoUrl?: string;
}

// Animation CSS avec fill-mode "both" : l'élément est invisible pendant le délai,
// puis remonte en fondu. 100 % CSS, aucun JS requis.
function fadeIn(delay: string, duration = "0.8s"): CSSProperties {
  return {
    animation: `fade-in ${duration} cubic-bezier(0.22, 1, 0.36, 1) ${delay} both`,
  };
}

/** Reveal de lettre — scale + blur → overshoot → settle */
function letterReveal(delay: string): CSSProperties {
  return {
    animation: `letter-reveal 0.7s cubic-bezier(0.22, 1, 0.36, 1) ${delay} both`,
  };
}

// ─── Mode logo : emblème + wordmark ────────────────────────────────────────────

function LogoDisplay({
  logoUrl,
  primaryCTA,
  secondaryCTA,
}: {
  logoUrl: string;
  primaryCTA?: CTAConfig;
  secondaryCTA?: CTAConfig;
}) {
  return (
    <div className="flex flex-col items-center text-center gap-6 sm:gap-8">
      {/* Logo centré au-dessus du wordmark */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={logoUrl}
        alt="Tabou"
        style={fadeIn("2.2s", "1.2s")}
        className="w-36 h-36 sm:w-44 sm:h-44 lg:w-[200px] lg:h-[200px] object-contain drop-shadow-[0_0_48px_rgba(240,176,48,0.25)] animate-glitch-logo"
      />

      {/* Wordmark "TABOU" — lettres staggerées */}
      <h1
        aria-label="TABOU"
        style={{
          textShadow: "0 2px 60px rgba(0,0,0,0.9), 0 0 120px rgba(0,0,0,0.6)",
          gap: "0.35em",
        }}
        className="flex items-center justify-center font-display font-black text-7xl sm:text-8xl lg:text-9xl xl:text-[11rem] text-text-primary leading-none"
      >
        {["T", "A", "B", "O", "U"].map((letter, i) => (
          <span key={letter} style={letterReveal(`${0.3 + i * 0.25}s`)}>
            {letter}
          </span>
        ))}
      </h1>

      {/* CTAs */}
      {(primaryCTA ?? secondaryCTA) && (
        <div style={fadeIn("3.5s", "0.8s")} className="flex flex-wrap justify-center gap-4 mt-2">
          {primaryCTA && (
            <Button
              as="a"
              href={primaryCTA.href}
              variant={primaryCTA.variant ?? "primary"}
              size="lg"
              className="shadow-glow-gold hover:shadow-glow-gold-md transition-shadow"
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
              className="text-gold border-gold/50 hover:border-gold"
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
  );
}

// ─── Mode texte : eyebrow + headline + subheadline + CTAs ──────────────────────

function TextDisplay({
  eyebrow,
  headline,
  subheadline,
  primaryCTA,
  secondaryCTA,
}: Omit<HeroAnimatedContentProps, "logoUrl">) {
  return (
    <div className="max-w-2xl mx-auto text-center">
      {eyebrow && (
        <p
          style={fadeIn("0.1s")}
          className="text-gold text-xs sm:text-sm font-semibold tracking-extra-wide uppercase mb-4"
        >
          {eyebrow}
        </p>
      )}

      {headline && (
        <h1
          style={{
            ...fadeIn(eyebrow ? "0.25s" : "0.1s"),
            whiteSpace: "pre-line",
            textShadow: "0 2px 40px rgba(0,0,0,0.8), 0 0 80px rgba(0,0,0,0.5)",
          }}
          className="font-display font-bold text-5xl sm:text-6xl lg:text-7xl xl:text-8xl text-text-primary leading-[1.02] tracking-tight mb-6"
        >
          {headline}
        </h1>
      )}

      {subheadline && (
        <p
          style={{
            ...fadeIn(eyebrow ? "0.4s" : "0.25s"),
            textShadow: "0 1px 20px rgba(0,0,0,0.6)",
          }}
          className="text-text-secondary text-lg sm:text-xl leading-relaxed max-w-xl mb-10"
        >
          {subheadline}
        </p>
      )}

      {(primaryCTA ?? secondaryCTA) && (
        <div
          style={fadeIn(eyebrow ? "0.55s" : "0.4s")}
          className="flex flex-wrap justify-center gap-4"
        >
          {primaryCTA && (
            <Button
              as="a"
              href={primaryCTA.href}
              variant={primaryCTA.variant ?? "primary"}
              size="lg"
              className="shadow-glow-gold hover:shadow-glow-gold-md transition-shadow"
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
              className="text-gold border-gold/50 hover:border-gold"
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
  );
}

// ─── Export ────────────────────────────────────────────────────────────────────

export function HeroAnimatedContent({
  logoUrl,
  eyebrow,
  headline,
  subheadline,
  primaryCTA,
  secondaryCTA,
}: HeroAnimatedContentProps) {
  if (logoUrl) {
    return (
      <LogoDisplay
        logoUrl={logoUrl}
        {...(primaryCTA   ? { primaryCTA }   : {})}
        {...(secondaryCTA ? { secondaryCTA } : {})}
      />
    );
  }

  return (
    <TextDisplay
      {...(eyebrow     ? { eyebrow }     : {})}
      {...(headline    ? { headline }    : {})}
      {...(subheadline ? { subheadline } : {})}
      {...(primaryCTA   ? { primaryCTA }   : {})}
      {...(secondaryCTA ? { secondaryCTA } : {})}
    />
  );
}
