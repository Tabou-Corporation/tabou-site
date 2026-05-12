"use client";

import { useEffect, useMemo, useState } from "react";

/**
 * Option B — Strip podium preview qui remplace le séparateur entre la carte
 * et le Hall of Fame. Affiche les 3 meilleurs pilotes all-time avec leurs
 * portraits + un CTA scroll vers le classement.
 *
 * Option E — ScrollHint : indicateur chevron animé au bas de la section carte,
 * incite à scroller vers le classement.
 */

interface Entry {
  characterId: number;
  characterName: string | null;
  kills: number;
  corpIds: number[];
}

const CORP_SHORT: Record<number, string> = {
  98809880: "T",
  98215397: "UZ",
};

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

/* ─────────────────────── Option E : ScrollHint ─────────────────────── */

export function ScrollHint({ targetId }: { targetId: string }) {
  return (
    <div className="flex flex-col items-center gap-2 pt-2 pb-1">
      <button
        type="button"
        onClick={() => scrollTo(targetId)}
        aria-label="Voir le classement"
        className="group flex flex-col items-center gap-1 text-text-muted hover:text-gold transition-colors"
      >
        <span className="text-[10px] font-mono uppercase tracking-[0.2em]">
          Hall of Fame
        </span>
        {/* Trois chevrons empilés avec décalage d'animation pour l'effet cascade */}
        <span className="flex flex-col items-center leading-none">
          {[0, 120, 240].map((delay) => (
            <svg
              key={delay}
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="10"
              viewBox="0 0 16 10"
              fill="none"
              style={{ animationDelay: `${delay}ms` }}
              className="animate-bounce opacity-60 group-hover:opacity-100"
            >
              <path
                d="M1 1l7 7 7-7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ))}
        </span>
      </button>
    </div>
  );
}

/* ──────────────────── Option B : PodiumPreviewStrip ────────────────── */

export function PodiumPreviewStrip({ targetId }: { targetId: string }) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/map/stats/corp")
      .then((r) => r.json())
      .then((d: { entries?: Entry[] }) => {
        setEntries(d.entries?.slice(0, 3) ?? []);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  const medals = ["🥇", "🥈", "🥉"];

  const placeholders = useMemo(
    () => (!loaded ? [0, 1, 2] : []),
    [loaded],
  );

  return (
    <div className="relative border-y border-gold/30 bg-gradient-to-r from-transparent via-gold/5 to-transparent py-5">
      {/* Ligne décorative dorée top */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent" />

      <button
        type="button"
        onClick={() => scrollTo(targetId)}
        className="group w-full flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 px-6"
      >
        {/* Label gauche */}
        <div className="hidden sm:flex flex-col items-end shrink-0">
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-gold/70">
            Hall of Fame
          </span>
          <span className="text-[10px] font-mono text-text-muted">all-time</span>
        </div>

        {/* Podium miniature */}
        <div className="flex items-center gap-5 sm:gap-8">
          {loaded
            ? entries.map((e, i) => (
                <div key={e.characterId} className="flex flex-col items-center gap-1.5">
                  <span className="text-base leading-none">{medals[i]}</span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://images.evetech.net/characters/${e.characterId}/portrait?size=64`}
                    alt={e.characterName ?? ""}
                    width={40}
                    height={40}
                    className={`rounded-full object-cover bg-bg-deep transition-transform group-hover:scale-110 ${
                      i === 0
                        ? "w-12 h-12 ring-2 ring-yellow-400/80 shadow-[0_0_12px_rgba(250,204,21,0.4)]"
                        : "w-9 h-9 ring-1 ring-border"
                    }`}
                  />
                  <span className="text-[10px] font-semibold text-text-primary max-w-[5rem] truncate text-center">
                    {e.characterName ?? `#${e.characterId}`}
                  </span>
                  <div className="flex gap-1">
                    {e.corpIds.map((c) => (
                      <span
                        key={c}
                        className="text-[8px] font-mono uppercase tracking-wider text-text-muted border border-border rounded px-1 py-0.5 bg-bg-deep/60"
                      >
                        {CORP_SHORT[c] ?? c}
                      </span>
                    ))}
                  </div>
                  <span className="text-[10px] font-mono font-bold text-emerald-400 tabular-nums">
                    {e.kills.toLocaleString("fr-FR")}
                  </span>
                </div>
              ))
            : placeholders.map((i) => (
                <div key={i} className="flex flex-col items-center gap-1.5 animate-pulse">
                  <span className="text-base leading-none opacity-30">{medals[i]}</span>
                  <div
                    className={`rounded-full bg-bg-elevated ${
                      i === 0 ? "w-12 h-12" : "w-9 h-9"
                    }`}
                  />
                  <div className="h-2.5 w-14 rounded bg-bg-elevated" />
                  <div className="h-2 w-8 rounded bg-bg-elevated" />
                </div>
              ))}
        </div>

        {/* CTA droit */}
        <div className="flex items-center gap-2 shrink-0 text-gold/70 group-hover:text-gold transition-colors">
          <span className="text-sm font-mono font-semibold hidden sm:block">
            Voir le classement
          </span>
          <span className="sm:hidden text-[10px] font-mono uppercase tracking-wider">
            Voir le classement all-time
          </span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            className="transition-transform group-hover:translate-y-1"
          >
            <path
              d="M6 9l6 6 6-6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </button>
    </div>
  );
}
