import { Suspense } from "react";
import { Container } from "@/components/layout/Container";
import { KillFeedServer } from "@/components/blocks/KillFeedServer";
import { TopPilotServer } from "@/components/blocks/TopPilotServer";
import { HeroBackground } from "@/components/blocks/HeroBackground";
import { HeroAnimatedContent } from "@/components/blocks/HeroAnimatedContent";
import { AmbientAudio } from "@/components/blocks/AmbientAudio";
import { EveTimeTerminal } from "@/components/blocks/EveTimeTerminal";
import { cn } from "@/lib/utils/cn";
import type { CTAConfig } from "@/types/content";

interface HeroStat {
  label: string;
  value: string;
}

interface HeroProps {
  eyebrow?: string;
  headline?: string;
  subheadline?: string;
  primaryCTA?: CTAConfig;
  secondaryCTA?: CTAConfig;
  /** Image de fond (chemin relatif depuis /public, ex: "/images/hero-bg.jpg") */
  backgroundImage?: string;
  /** Stats affichées en barre en bas du hero */
  stats?: HeroStat[];
  /** URL du logo corporation pour le mode emblème */
  logoUrl?: string;
  /** Chemin vers un fichier audio d'ambiance (relatif à /public) */
  ambientAudio?: string;
  /** Affiche le kill feed + top pilote en streaming (Suspense) */
  showKillFeed?: boolean;
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
  logoUrl,
  showKillFeed = false,
  ambientAudio,
  className,
}: HeroProps) {
  return (
    <section
      className={cn(
        "relative min-h-screen flex flex-col justify-center overflow-hidden",
        "bg-bg-deep",
        className
      )}
    >
      {/* ── Background image ─────────────────────────────────────────── */}
      {backgroundImage ? (
        <>
          {/* Ken Burns + parallaxe souris (client component) */}
          <HeroBackground src={backgroundImage} />
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

      {/* ── Musique d'ambiance ─────────────────────────────────────── */}
      {ambientAudio && <AmbientAudio src={ambientAudio} />}

      {/* ── Gold accent lines ────────────────────────────────────────── */}
      <div
        aria-hidden
        className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent"
      />

      {/* ── Kill Feed + Top Pilote — streaming Suspense ─────────────── */}
      {/* Les fetches zkillboard sont isolés : le hero s'affiche immédiatement,  */}
      {/* les widgets apparaissent dès que l'API répond (ou timeout 5 s).        */}
      {showKillFeed && (
        <div className="absolute left-0 top-[28%] z-20 hidden lg:flex flex-col gap-2">
          <EveTimeTerminal />
          <Suspense fallback={null}>
            <TopPilotServer />
          </Suspense>
          <Suspense fallback={null}>
            <KillFeedServer />
          </Suspense>
        </div>
      )}

      {/* ── Contenu principal ────────────────────────────────────────── */}
      {/* Sur desktop, on compense les 210 px du kill feed à gauche      */}
      {/* pour que le contenu reste visuellement centré sur l'espace libre */}
      <Container className="relative z-10 pt-32 pb-8 flex-1 flex flex-col justify-center">
        <div className={cn(showKillFeed ? "lg:pl-[210px]" : "")}>
          <HeroAnimatedContent
            {...(eyebrow     ? { eyebrow }     : {})}
            {...(headline    ? { headline }    : {})}
            {...(subheadline ? { subheadline } : {})}
            {...(primaryCTA   ? { primaryCTA }   : {})}
            {...(secondaryCTA ? { secondaryCTA } : {})}
            {...(logoUrl      ? { logoUrl }      : {})}
          />
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
