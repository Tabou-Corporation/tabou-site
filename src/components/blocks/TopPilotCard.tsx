import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import type { TopPilot } from "@/lib/zkillboard/top-pilot";

interface TopPilotCardProps {
  pilot: TopPilot;
  sectionLabel?: string;
  periodLabel?: string;
}

export function TopPilotCard({ pilot, sectionLabel = "Focus", periodLabel = "All-time" }: TopPilotCardProps) {
  return (
    <Link
      href={pilot.zkillUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "w-[260px] flex flex-col",
        "border-l-2 border-l-gold/70",
        "hover:border-l-gold transition-colors duration-200",
        "group"
      )}
    >
      {/* ── Header ── */}
      <div className="px-4 pb-2">
        <span className="text-gold/50 text-xs font-bold tracking-extra-wide uppercase">
          {sectionLabel}
        </span>
      </div>

      {/* ── Pilote ── */}
      <div className="flex items-center gap-3 px-4 pb-4">
        {/* Portrait */}
        <div className="flex-shrink-0 relative">
          <div className="w-16 h-16 rounded-sm overflow-hidden border border-gold/40 bg-bg-elevated">
            <Image
              src={pilot.portraitUrl}
              alt={pilot.name}
              width={64}
              height={64}
              className="w-full h-full object-cover"
              priority
              unoptimized
            />
          </div>
          {/* Badge #1 */}
          <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-gold flex items-center justify-center text-bg-deep text-[10px] font-black leading-none">
            1
          </span>
        </div>

        {/* Infos */}
        <div className="flex-1 min-w-0">
          <p className="text-text-primary text-sm font-display font-semibold truncate group-hover:text-gold transition-colors">
            {pilot.name}
          </p>
          <p className="text-gold text-xs font-bold mt-0.5">
            ◆ {pilot.kills.toLocaleString("fr-FR")} kills
          </p>
          <p className="text-text-muted text-xs">{periodLabel}</p>
        </div>
      </div>
    </Link>
  );
}
