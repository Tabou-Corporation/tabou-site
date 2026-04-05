import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import type { TopPilot } from "@/lib/zkillboard/top-pilot";

const RANK_STYLES = [
  "bg-gold text-bg-deep",       // #1
  "bg-text-muted/60 text-bg-deep", // #2
  "bg-amber-700/80 text-bg-deep",  // #3
] as const;

interface TopPilotPodiumProps {
  pilots: TopPilot[];
}

export function TopPilotPodium({ pilots }: TopPilotPodiumProps) {
  if (!pilots.length) return null;

  return (
    <div className="w-full flex flex-col">
      {/* ── Header ── */}
      <div className="px-4 pb-2">
        <span className="text-gold/50 text-xs font-bold tracking-extra-wide uppercase">
          Ce mois
        </span>
      </div>

      {/* ── Podium ── */}
      <div className="flex flex-col gap-1 pb-3">
        {pilots.map((pilot, i) => (
          <Link
            key={pilot.characterId}
            href={pilot.zkillUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-4 py-1.5 hover:bg-gold/5 transition-colors group"
          >
            {/* Portrait + badge rang */}
            <div className="relative flex-shrink-0">
              <div className="w-10 h-10 rounded-sm overflow-hidden border border-gold/30 bg-bg-elevated">
                <Image
                  src={pilot.portraitUrl}
                  alt={pilot.name}
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                />
              </div>
              <span
                className={cn(
                  "absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black leading-none",
                  RANK_STYLES[i]
                )}
              >
                {i + 1}
              </span>
            </div>

            {/* Infos */}
            <div className="flex-1 min-w-0">
              <p className="text-text-primary text-xs font-semibold truncate group-hover:text-gold transition-colors">
                {pilot.name}
              </p>
              <p className="text-gold text-xs font-bold">
                ◆ {pilot.kills.toLocaleString("fr-FR")} kills
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
