import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import type { TopPilot } from "@/lib/zkillboard/top-pilot";

interface TopPilotCardProps {
  pilot: TopPilot;
}

export function TopPilotCard({ pilot }: TopPilotCardProps) {
  return (
    <Link
      href={pilot.zkillUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "w-[210px] flex flex-col",
        "bg-bg-deep/85 backdrop-blur-sm",
        "border border-gold/30 border-l-2 border-l-gold",
        "hover:border-gold/60 hover:border-l-gold transition-colors duration-200",
        "group"
      )}
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gold/15">
        <span className="text-gold text-2xs font-bold tracking-extra-wide uppercase">
          Focus
        </span>
        <span className="text-gold text-xs">👑</span>
      </div>

      {/* ── Pilote ── */}
      <div className="flex items-center gap-3 px-3 py-3">
        {/* Portrait */}
        <div className="flex-shrink-0 relative">
          <div className="w-12 h-12 rounded-sm overflow-hidden border border-gold/40 bg-bg-elevated">
            <Image
              src={pilot.portraitUrl}
              alt={pilot.name}
              width={48}
              height={48}
              className="w-full h-full object-cover"
              unoptimized
            />
          </div>
          {/* Badge #1 */}
          <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-gold flex items-center justify-center text-bg-deep text-[9px] font-black leading-none">
            1
          </span>
        </div>

        {/* Infos */}
        <div className="flex-1 min-w-0">
          <p className="text-text-primary text-xs font-display font-semibold truncate group-hover:text-gold transition-colors">
            {pilot.name}
          </p>
          <p className="text-gold text-2xs font-bold mt-0.5">
            ◆ {pilot.kills.toLocaleString("fr-FR")} kills
          </p>
          <p className="text-text-muted text-2xs">All‑time</p>
        </div>
      </div>
    </Link>
  );
}
