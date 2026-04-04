import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/layout/Container";
import { KillFeed } from "@/components/blocks/KillFeed";
import { cn } from "@/lib/utils/cn";
import type { CTAConfig } from "@/types/content";
import type { KillDisplayEntry } from "@/lib/zkillboard/types";

interface HeroStat {
  label: string;
  value: string;
}

interface HeroProps {
  eyebrow?: string;
  headline: string;
  subheadline?: string;
  primaryCTA?: CTAConfig;
  secondaryCTA?: CTAConfig;
  /** Image de fond (chemin relatif depuis /public, ex: "/images/hero-bg.jpg") */
  backgroundImage?: string;
  /** Stats affichées en barre en bas du hero */
  stats?: HeroStat[];
  /** Kills récents pour le widget zkillboard */
  kills?: KillDisplayEntry[];
  className?: string;
}

export function Hero({
  eyebrow,
  headline,
  subheadline,
  primaryCTA,
  secondaryCTA,
  backgroundImage,
  stats,
  kills,
  className,
}: HeroProps) {
  return (
    <section
      className={cn(
        "relative min-h-screen flex overflow-hidden",
        "bg-bg-deep",
        className
      )}
    >
      {/* ── Background image ─────────────────────────────────────────── */}
      {backgroundImage ? (
        <>
          {/* URL externe : balise img native pour éviter les restrictions Next/Image */}
          {backgroundImage.startsWith("http") ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={backgroundImage}
              alt=""
              className="absolute inset-0 w-full h-full object-cover object-[70%_center] lg:object-[65%_center]"
            />
          ) : (
            <Image
              src={backgroundImage}
              alt=""
              fill
              priority
              className="object-cover object-[70%_center] lg:object-[65%_center]"
              quality={85}
              sizes="100vw"
            />
          )}
          {/* Gradient overlay : sombre gauche (texte), dégagé droite (image visible) */}
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background: "linear-gradient(to right, rgba(5,4,3,0.97) 0%, rgba(5,4,3,0.88) 25%, rgba(5,4,3,0.45) 45%, rgba(5,4,3,0.1) 70%, transparent 100%)",
            }}
          />
          {/* Gradient vertical : assombrir le haut (nav) et le bas (stats) */}
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-b from-bg-deep/60 via-transparent to-bg-deep/80"
          />
        </>
      ) : (
        <>
          {/* Fallback : grille tactique subtile (quand pas d'image) */}
          <div
            aria-hidden
            className="absolute inset-0 opacity-[0.025]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(240,176,48,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(240,176,48,0.8) 1px, transparent 1px)",
              backgroundSize: "80px 80px",
            }}
          />
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-b from-bg-deep/60 via-transparent to-bg-deep"
          />
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-r from-bg-deep/90 via-transparent to-bg-deep/30"
          />
        </>
      )}

      {/* ── Gold accent lines ────────────────────────────────────────── */}
      <div
        aria-hidden
        className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent"
      />

      {/* ── Kill Feed — gauche, centré verticalement ─────────────────── */}
      {kills && kills.length > 0 && (
        <div className="relative z-10 hidden lg:flex items-center self-stretch">
          <KillFeed initialKills={kills} />
        </div>
      )}

      {/* ── Contenu principal — centré ───────────────────────────────── */}
      <Container className="relative z-10 pt-32 pb-8 flex-1 flex flex-col justify-center">
        <div className="max-w-2xl mx-auto text-center animate-fade-in">

          {eyebrow && (
            <p className="text-gold text-xs sm:text-sm font-semibold tracking-extra-wide uppercase mb-4">
              {eyebrow}
            </p>
          )}

          <h1
            className="font-display font-bold text-5xl sm:text-6xl lg:text-7xl xl:text-8xl text-text-primary leading-[1.02] tracking-tight mb-6"
            style={{
              whiteSpace: "pre-line",
              textShadow: "0 2px 40px rgba(0,0,0,0.8), 0 0 80px rgba(0,0,0,0.5)",
            }}
          >
            {headline}
          </h1>

          {subheadline && (
            <p
              className="text-text-secondary text-lg sm:text-xl leading-relaxed max-w-xl mb-10"
              style={{ textShadow: "0 1px 20px rgba(0,0,0,0.6)" }}
            >
              {subheadline}
            </p>
          )}

          {(primaryCTA ?? secondaryCTA) && (
            <div className="flex flex-wrap justify-center gap-4">
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
                  className="animate-pulse text-gold border-gold/50 hover:border-gold"
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

      {/* ── Stats bar en bas du hero ─────────────────────────────────── */}
      {stats && stats.length > 0 && (
        <div className="relative z-10 border-t border-gold/20 bg-bg-deep/60 backdrop-blur-md">
          <Container>
            <div
              className={cn(
                "grid divide-x divide-gold/15",
                stats.length === 3 && "grid-cols-3",
                stats.length === 4 && "grid-cols-2 sm:grid-cols-4",
                stats.length >= 5 && "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5",
              )}
            >
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="flex flex-col items-center text-center py-5 sm:py-6 px-2"
                >
                  <span className="font-display font-bold text-2xl sm:text-3xl text-gold">
                    {stat.value}
                  </span>
                  <span className="text-text-muted text-2xs sm:text-xs font-medium tracking-widest uppercase mt-0.5">
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>
          </Container>
        </div>
      )}

      {/* ── Scroll indicator — après la stats bar dans le flux ──────── */}
      <div className="relative z-10 flex justify-center py-6">
        <div className="animate-bounce-slow flex flex-col items-center gap-2">
          <span className="text-gold animate-pulse text-sm font-semibold tracking-extra-wide uppercase">Découvrir</span>
          <svg
            width="28"
            height="28"
            viewBox="0 0 20 20"
            fill="none"
            className="text-gold animate-pulse"
          >
            <path
              d="M10 4v10m0 0l-4-4m4 4l4-4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    </section>
  );
}
