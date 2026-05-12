"use client";

import { useEffect, useMemo, useState } from "react";

/**
 * Hall of Fame Tabou + Urban Zone — classement all-time des pilotes par kills,
 * fusionné entre les deux corps. Source : zKillboard stats endpoint (toutes
 * régions, depuis la création de chaque corp).
 *
 * Refonte hero : le podium est l'élément principal de la section, pas un teaser.
 * - Hero immersif avec fond gradient + texture
 * - Podium massif (180px #1, 90px #2/#3) au centre
 * - Stats corp sobres en dessous
 * - CTA discret vers le tableau complet
 * - Tableau classement complet à la suite (id="leaderboard-table")
 */

interface Entry {
  characterId: number;
  characterName: string | null;
  kills: number;
  corpIds: number[];
}

interface CorpTotal {
  corpId: number;
  shipsDestroyed: number;
  shipsLost: number;
  iskDestroyed: number;
  iskLost: number;
  pilotCount: number;
}

interface Payload {
  entries: Entry[];
  totals: CorpTotal[];
  fromCache: boolean;
  fetchedAt: string;
}

const CORP_LABELS: Record<number, string> = {
  98809880: "Tabou",
  98215397: "Urban Zone",
};
const CORP_SHORT: Record<number, string> = {
  98809880: "T",
  98215397: "UZ",
};
const CORP_COLOR: Record<number, string> = {
  98809880: "from-gold/30 to-gold/0 text-gold border-gold/60",
  98215397: "from-sky-400/30 to-sky-400/0 text-sky-300 border-sky-400/60",
};

function formatIsk(value: number): string {
  if (value >= 1e12) return `${(value / 1e12).toFixed(2)} T`;
  if (value >= 1e9) return `${(value / 1e9).toFixed(1)} Bn`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(0)} M`;
  return `${Math.round(value)}`;
}

function freshnessLabel(iso: string): string {
  const min = (Date.now() - new Date(iso).getTime()) / 60000;
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${Math.round(min)}min`;
  return `il y a ${(min / 60).toFixed(1)}h`;
}

function scrollToTable() {
  document.getElementById("leaderboard-table")?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

export function HallOfFamePanel() {
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch("/api/map/stats/corp")
      .then((r) => r.json())
      .then((d: Payload) => {
        if (!cancelled) { setData(d); setError(null); }
      })
      .catch((e) => { if (!cancelled) setError(String(e)); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const entries = useMemo(() => data?.entries ?? [], [data]);
  const totals = useMemo(() => data?.totals ?? [], [data]);
  const maxKills = useMemo(() => entries[0]?.kills ?? 1, [entries]);

  const allianceTotals = useMemo(() => {
    return totals.reduce(
      (acc, t) => ({
        shipsDestroyed: acc.shipsDestroyed + t.shipsDestroyed,
        shipsLost: acc.shipsLost + t.shipsLost,
        iskDestroyed: acc.iskDestroyed + t.iskDestroyed,
        iskLost: acc.iskLost + t.iskLost,
      }),
      { shipsDestroyed: 0, shipsLost: 0, iskDestroyed: 0, iskLost: 0 },
    );
  }, [totals]);

  // ─── HERO ─────────────────────────────────────────────────────────────
  return (
    <>
      {/* Hero — fond gradient, full-bleed, démarre direct après la carte */}
      <section
        id="hall-of-fame"
        className="relative overflow-hidden bg-gradient-to-b from-bg-deep via-amber-950/15 to-bg-deep border-y border-gold/20"
      >
        {/* Texture étoilée subtile */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage:
              "radial-gradient(1px 1px at 20% 30%, rgba(255,255,255,0.6) 50%, transparent 50%)," +
              "radial-gradient(1px 1px at 60% 70%, rgba(230,194,101,0.5) 50%, transparent 50%)," +
              "radial-gradient(1px 1px at 80% 20%, rgba(255,255,255,0.4) 50%, transparent 50%)," +
              "radial-gradient(1.5px 1.5px at 35% 80%, rgba(230,194,101,0.6) 50%, transparent 50%)," +
              "radial-gradient(1px 1px at 50% 50%, rgba(255,255,255,0.3) 50%, transparent 50%)",
            backgroundSize: "180px 180px, 240px 240px, 320px 320px, 160px 160px, 280px 280px",
          }}
        />
        {/* Halo doré derrière le podium */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(230,194,101,0.10) 0%, rgba(230,194,101,0.04) 30%, transparent 70%)",
          }}
        />

        <div className="relative max-w-7xl mx-auto px-6 py-16 sm:py-20">
          {/* Header hero — eyebrow + titre */}
          <div className="text-center mb-12 sm:mb-16">
            <p className="text-gold text-xs font-semibold tracking-extra-wide uppercase mb-3">
              ★ Hall of Fame ★
            </p>
            <h2 className="font-display font-bold text-3xl sm:text-5xl text-text-primary leading-tight mb-3">
              Classement all-time
            </h2>
            <p className="text-text-secondary text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
              Les pilotes Tabou et Urban Zone qui dominent depuis la création des corps.
              Toutes régions confondues.
            </p>
          </div>

          {loading && (
            <div className="text-center text-text-muted text-sm italic py-16">
              Chargement du classement…
            </div>
          )}
          {error && (
            <div className="text-center text-red-400 text-sm py-16">
              Erreur : {error}
            </div>
          )}

          {/* Podium massif au centre */}
          {!loading && !error && entries.length > 0 && (
            <>
              <PodiumHero entries={entries} />

              {/* Stats corp en dessous, sobres */}
              <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-3 max-w-4xl mx-auto">
                {totals.map((t) => (
                  <CorpStatChip key={t.corpId} total={t} />
                ))}
                <AllianceChip
                  totals={allianceTotals}
                  pilotCount={entries.length}
                />
              </div>

              {/* CTA discret vers le tableau */}
              <div className="mt-10 text-center">
                <button
                  type="button"
                  onClick={scrollToTable}
                  className="group inline-flex items-center gap-2 text-gold/80 hover:text-gold font-mono text-xs uppercase tracking-[0.2em] transition-colors"
                >
                  <span>Explorer le classement complet</span>
                  <svg
                    width="14"
                    height="14"
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
                </button>
              </div>
            </>
          )}

          {!loading && !error && entries.length === 0 && (
            <div className="text-center text-text-secondary text-sm py-16">
              Aucune donnée zKill disponible pour le moment.
            </div>
          )}
        </div>
      </section>

      {/* ─── Tableau classement complet (rang 4+) ───────────────────────── */}
      {!loading && !error && entries.length > 3 && (
        <section
          id="leaderboard-table"
          className="bg-bg-surface py-16 sm:py-20"
        >
          <div className="max-w-5xl mx-auto px-6">
            <div className="mb-8">
              <p className="text-gold text-xs font-semibold tracking-extra-wide uppercase mb-2">
                Classement complet
              </p>
              <h3 className="font-display text-2xl text-text-primary">
                Top {entries.length} pilotes
              </h3>
            </div>

            <div className="bg-bg-elevated border border-border rounded-md overflow-hidden">
              <div className="grid grid-cols-[2.5rem_1fr_5rem_minmax(8rem,12rem)] sm:grid-cols-[3rem_1fr_6rem_minmax(10rem,16rem)] items-center gap-3 px-4 py-2 border-b border-border bg-bg-deep/60">
                <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted">#</span>
                <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted">Pilote</span>
                <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted text-right">Kills</span>
                <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted">Progression</span>
              </div>
              <ul className="divide-y divide-border">
                {entries.slice(3).map((e, i) => (
                  <LeaderRow
                    key={e.characterId}
                    entry={e}
                    rank={i + 4}
                    maxKills={maxKills}
                  />
                ))}
              </ul>
            </div>

            {data && (
              <p className="mt-6 text-center text-[10px] font-mono uppercase tracking-wider text-text-muted">
                zKillboard · all-time · mis à jour {freshnessLabel(data.fetchedAt)}
                {data.fromCache && " · cache"}
              </p>
            )}
          </div>
        </section>
      )}
    </>
  );
}

/* ─────────────────────── Podium hero ─────────────────────── */

function PodiumHero({ entries }: { entries: Entry[] }) {
  const podium = entries.slice(0, 3);
  if (podium.length === 0) return null;

  // Ordre visuel : 2 (gauche) — 1 (centre, plus grand) — 3 (droite)
  const ordered = [podium[1], podium[0], podium[2]].filter((p): p is Entry => Boolean(p));

  return (
    <div className="flex items-end justify-center gap-8 sm:gap-16 flex-wrap">
      {ordered.map((p) => {
        const rank = entries.indexOf(p) + 1;
        return <PodiumPillar key={p.characterId} entry={p} rank={rank} />;
      })}
    </div>
  );
}

function PodiumPillar({ entry, rank }: { entry: Entry; rank: number }) {
  const portrait = `https://images.evetech.net/characters/${entry.characterId}/portrait?size=256`;
  const isFirst = rank === 1;
  const portraitSize = isFirst ? "w-44 h-44 sm:w-48 sm:h-48" : "w-24 h-24 sm:w-28 sm:h-28";
  const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : "🥉";
  const ring =
    rank === 1
      ? "ring-4 ring-yellow-400/90 shadow-[0_0_60px_rgba(250,204,21,0.45)]"
      : rank === 2
      ? "ring-2 ring-zinc-300/70 shadow-[0_0_24px_rgba(255,255,255,0.15)]"
      : "ring-2 ring-amber-700/70 shadow-[0_0_24px_rgba(180,83,9,0.25)]";

  return (
    <a
      href={`https://zkillboard.com/character/${entry.characterId}/`}
      target="_blank"
      rel="noreferrer noopener"
      className="group flex flex-col items-center text-center transition-transform hover:-translate-y-2 duration-300"
    >
      {/* Médaille flottante */}
      <span className={`${isFirst ? "text-4xl sm:text-5xl" : "text-2xl sm:text-3xl"} drop-shadow-md mb-3`}>
        {medal}
      </span>

      {/* Portrait avec halo */}
      <div className="relative">
        {isFirst && (
          <span
            aria-hidden
            className="absolute inset-0 rounded-full bg-yellow-400/20 blur-2xl animate-pulse"
          />
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={portrait}
          alt={entry.characterName ?? `Pilote ${entry.characterId}`}
          className={`relative ${portraitSize} rounded-full object-cover ${ring} bg-bg-deep`}
        />
        <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] sm:text-xs font-mono uppercase tracking-widest bg-bg-deep border border-gold/40 text-gold whitespace-nowrap">
          #{rank}
        </span>
      </div>

      {/* Nom */}
      <div
        className={`mt-6 ${isFirst ? "text-xl sm:text-2xl" : "text-base sm:text-lg"} font-display font-bold text-text-primary group-hover:text-gold transition-colors max-w-[12rem] truncate`}
      >
        {entry.characterName ?? `Pilote ${entry.characterId}`}
      </div>

      {/* Badges corps */}
      <div className="mt-2 flex items-center gap-1.5 flex-wrap justify-center">
        {entry.corpIds.map((c) => (
          <CorpBadge key={c} corpId={c} />
        ))}
      </div>

      {/* Kills */}
      <div
        className={`mt-3 font-mono ${isFirst ? "text-4xl sm:text-5xl" : "text-2xl sm:text-3xl"} font-bold text-emerald-400 tabular-nums leading-none`}
      >
        {entry.kills.toLocaleString("fr-FR")}
      </div>
      <div className="mt-1 text-[10px] sm:text-xs font-mono uppercase tracking-widest text-text-muted">
        kills
      </div>
    </a>
  );
}

/* ─────────────────────── Stats chips sobres ─────────────────────── */

function CorpStatChip({ total }: { total: CorpTotal }) {
  const ratio =
    total.iskLost > 0 ? (total.iskDestroyed / total.iskLost).toFixed(1) : "∞";
  const colorClass = CORP_COLOR[total.corpId] ?? "from-text-muted/20 to-transparent text-text-secondary border-border";
  const textCls = colorClass.split(" ").filter((c) => c.startsWith("text-")).join(" ");
  const borderCls = colorClass.split(" ").filter((c) => c.startsWith("border-")).join(" ");
  const gradCls = colorClass.split(" ").filter((c) => c.startsWith("from-") || c.startsWith("to-")).join(" ");

  return (
    <div className={`relative overflow-hidden bg-bg-deep/60 backdrop-blur-sm border ${borderCls} rounded-md p-4`}>
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${gradCls} opacity-50`} />
      <div className="relative">
        <div className={`text-[10px] font-mono uppercase tracking-[0.2em] ${textCls}`}>
          {CORP_LABELS[total.corpId] ?? `Corp ${total.corpId}`}
        </div>
        <div className="mt-1.5 flex items-baseline gap-1.5">
          <span className="text-2xl font-bold text-text-primary tabular-nums">
            {total.shipsDestroyed.toLocaleString("fr-FR")}
          </span>
          <span className="text-[11px] text-text-secondary">kills</span>
        </div>
        <div className="mt-1 text-[11px] text-text-secondary font-mono leading-tight">
          {formatIsk(total.iskDestroyed)} ISK · efficacité {ratio}
        </div>
        <div className="text-[10px] text-text-muted font-mono mt-0.5">
          {total.pilotCount} pilotes
        </div>
      </div>
    </div>
  );
}

function AllianceChip({
  totals,
  pilotCount,
}: {
  totals: { shipsDestroyed: number; shipsLost: number; iskDestroyed: number; iskLost: number };
  pilotCount: number;
}) {
  return (
    <div className="relative overflow-hidden bg-bg-deep/60 backdrop-blur-sm border border-emerald-500/40 rounded-md p-4">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-500/15 to-transparent" />
      <div className="relative">
        <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-emerald-300">
          ★ Alliance combinée
        </div>
        <div className="mt-1.5 flex items-baseline gap-1.5">
          <span className="text-2xl font-bold text-text-primary tabular-nums">
            {totals.shipsDestroyed.toLocaleString("fr-FR")}
          </span>
          <span className="text-[11px] text-text-secondary">cumulés</span>
        </div>
        <div className="mt-1 text-[11px] text-text-secondary font-mono leading-tight">
          {formatIsk(totals.iskDestroyed)} ISK détruits
        </div>
        <div className="text-[10px] text-text-muted font-mono mt-0.5">
          {pilotCount} pilotes classés
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────── Leaderboard rows ─────────────────────── */

function LeaderRow({
  entry,
  rank,
  maxKills,
}: {
  entry: Entry;
  rank: number;
  maxKills: number;
}) {
  const portrait = `https://images.evetech.net/characters/${entry.characterId}/portrait?size=64`;
  const pct = Math.round((entry.kills / maxKills) * 100);

  return (
    <li>
      <a
        href={`https://zkillboard.com/character/${entry.characterId}/`}
        target="_blank"
        rel="noreferrer noopener"
        className="grid grid-cols-[2.5rem_1fr_5rem_minmax(8rem,12rem)] sm:grid-cols-[3rem_1fr_6rem_minmax(10rem,16rem)] items-center gap-3 px-4 py-2.5 hover:bg-bg-deep/40 transition-colors"
      >
        <span className="font-mono text-sm text-text-muted text-center tabular-nums">{rank}</span>

        <div className="flex items-center gap-3 min-w-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={portrait}
            alt=""
            width={32}
            height={32}
            className="w-8 h-8 rounded-full object-cover bg-bg-deep shrink-0"
          />
          <div className="min-w-0">
            <div className="text-sm font-semibold text-text-primary truncate">
              {entry.characterName ?? `Pilote ${entry.characterId}`}
            </div>
            <div className="mt-0.5 flex items-center gap-1.5">
              {entry.corpIds.map((c) => (
                <CorpBadge key={c} corpId={c} small />
              ))}
            </div>
          </div>
        </div>

        <span className="font-mono font-semibold text-emerald-400 text-right tabular-nums">
          {entry.kills.toLocaleString("fr-FR")}
        </span>

        <div className="relative h-2 rounded-full bg-bg-deep overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500/80 to-emerald-400/60 rounded-full"
            style={{ width: `${pct}%` }}
          />
        </div>
      </a>
    </li>
  );
}

function CorpBadge({ corpId, small = false }: { corpId: number; small?: boolean }) {
  const color = CORP_COLOR[corpId] ?? "from-text-muted/20 to-transparent text-text-secondary border-border";
  const textCls = color.split(" ").filter((c) => c.startsWith("text-")).join(" ");
  const borderCls = color.split(" ").filter((c) => c.startsWith("border-")).join(" ");
  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded border ${borderCls} ${textCls} ${
        small ? "text-[9px]" : "text-[10px]"
      } font-mono uppercase tracking-wider bg-bg-deep/60`}
    >
      {CORP_SHORT[corpId] ?? `#${corpId}`}
    </span>
  );
}
