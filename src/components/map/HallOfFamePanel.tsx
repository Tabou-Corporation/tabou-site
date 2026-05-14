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

interface CareerStats {
  kills: number;
  iskDestroyed: number;
  soloKills: number;
  iskDestroyedSolo: number;
  dangerRatio: number;
  avgGangSize: number;
  favoriteShips: Array<{ shipTypeId: number; shipName: string | null; kills: number }>;
  killsThisMonth: number;
  killsLastMonth: number;
}

interface Entry {
  characterId: number;
  characterName: string | null;
  kills: number;
  corpIds: number[];
  career?: CareerStats;
}

type SortMode = "kills" | "solo" | "isk" | "month";

interface CorpTotal {
  corpId: number;
  shipsDestroyed: number;
  shipsLost: number;
  iskDestroyed: number;
  iskLost: number;
  pilotCount: number;
}

interface BiggestKill {
  killId: number;
  totalValue: number;
  killTime: string;
  solarSystemId: number;
  victimShipTypeId: number;
  victimShipName: string | null;
  victimCharacterId: number | null;
  victimCharacterName: string | null;
  victimCorpId: number | null;
  finalBlowCharacterId: number | null;
  finalBlowCharacterName: string | null;
  finalBlowCorpId: number | null;
  zkillUrl: string;
}

interface HeatmapData {
  matrix: number[][];
  byHour: number[];
  max: number;
  peakHour: { hour: number; count: number };
}

interface ShipClassRow {
  category: string;
  shipsDestroyed: number;
  shipsLost: number;
  iskDestroyed: number;
}

interface TopShipEntry {
  shipTypeId: number;
  shipName: string | null;
  kills: number;
}

interface SoloStats {
  soloKills: number;
  iskDestroyedSolo: number;
  soloRatio: number;
  dangerRatio: number;
  avgGangSize: number;
}

interface Payload {
  entries: Entry[];
  totals: CorpTotal[];
  biggestKill: BiggestKill | null;
  heatmap: HeatmapData;
  shipClasses: ShipClassRow[];
  topShips: TopShipEntry[];
  soloStats: SoloStats;
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
  const [sortMode, setSortMode] = useState<SortMode>("kills");

  useEffect(() => {
    let cancelled = false;

    async function load(attempt = 0) {
      try {
        const r = await fetch("/api/map/stats/corp");
        const text = await r.text();
        if (!text) throw new Error("Réponse vide du serveur");
        let parsed: (Payload & { error?: string });
        try {
          parsed = JSON.parse(text) as Payload & { error?: string };
        } catch {
          throw new Error("Réponse serveur invalide");
        }
        // Le 503 renvoie { error, entries: [], totals: [] } sans heatmap/etc.
        // → on le traite comme une erreur, pas comme des données valides.
        if (!r.ok || parsed.error) {
          throw new Error(parsed.error || `Erreur ${r.status}`);
        }
        if (!parsed.entries || !parsed.heatmap || !parsed.soloStats) {
          throw new Error("Données incomplètes");
        }
        if (!cancelled) { setData(parsed); setError(null); setLoading(false); }
      } catch (e) {
        // 2 retries espacés — le 1er hit peut timeout sur cache froid (zKill lent),
        // mais les fetchs en cours peuplent le cache DB en arrière-plan.
        if (attempt < 2 && !cancelled) {
          setTimeout(() => { if (!cancelled) void load(attempt + 1); }, 3000);
          return;
        }
        if (!cancelled) { setError(String(e)); setLoading(false); }
      }
    }

    setLoading(true);
    void load();
    return () => { cancelled = true; };
  }, []);

  const entries = useMemo(() => data?.entries ?? [], [data]);
  const totals = useMemo(() => data?.totals ?? [], [data]);

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
        </div>
      </section>

      {/* ─── Combat Intelligence : best kill + heatmap + ship classes + solo ── */}
      {!loading && !error && data && data.heatmap && data.soloStats && (
        <section className="bg-bg-surface py-16 sm:py-20 border-b border-border">
          <div className="max-w-7xl mx-auto px-6 space-y-10">
            <div className="text-center">
              <p className="text-gold text-xs font-semibold tracking-extra-wide uppercase mb-2">
                Combat intelligence
              </p>
              <h3 className="font-display text-2xl sm:text-3xl text-text-primary">
                Records, prime time et style de jeu
              </h3>
            </div>

            {/* Best kill — hero card */}
            {data.biggestKill && <BiggestKillCard kill={data.biggestKill} />}

            {/* Grille : Heatmap + Solo combat */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <HeatmapCard heatmap={data.heatmap} />
              </div>
              <div>
                <SoloCard solo={data.soloStats} />
              </div>
            </div>

            {/* Grille : Ship classes + Top ships */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <ShipClassesCard rows={data.shipClasses ?? []} />
              <TopShipsCard ships={data.topShips ?? []} />
            </div>
          </div>
        </section>
      )}

      {/* Empty state hors hero pour ne pas casser la structure du hero */}
      {!loading && !error && entries.length === 0 && (
        <section className="bg-bg-surface py-12 text-center text-text-secondary text-sm">
          Aucune donnée zKill disponible pour le moment.
        </section>
      )}

      {/* ─── Tableau classement complet — tabs de tri + lignes enrichies ── */}
      {!loading && !error && entries.length > 3 && (
        <section
          id="leaderboard-table"
          className="bg-bg-surface py-16 sm:py-20"
        >
          <div className="max-w-5xl mx-auto px-6">
            <div className="mb-6">
              <p className="text-gold text-xs font-semibold tracking-extra-wide uppercase mb-2">
                Classement complet
              </p>
              <h3 className="font-display text-2xl text-text-primary">
                Top {entries.length} pilotes
              </h3>
            </div>

            {/* Tabs de tri */}
            <SortTabs mode={sortMode} onChange={setSortMode} />

            <SortedLeaderboard entries={entries} mode={sortMode} />

            {data && (
              <p className="mt-6 text-center text-[10px] font-mono uppercase tracking-wider text-text-muted">
                zKillboard · all-time · mis à jour {freshnessLabel(data.fetchedAt)}
                {data.fromCache && " · cache"} · enrichissement carrière sur top 20
              </p>
            )}
          </div>
        </section>
      )}
    </>
  );
}

/* ─────────────────────── Tri / Tabs ─────────────────────── */

function SortTabs({ mode, onChange }: { mode: SortMode; onChange: (m: SortMode) => void }) {
  const tabs: Array<{ key: SortMode; label: string; sub: string }> = [
    { key: "kills",  label: "Kills",      sub: "all-time corp" },
    { key: "solo",   label: "Solo",       sub: "kills solo carrière" },
    { key: "isk",    label: "ISK détruits", sub: "carrière" },
    { key: "month",  label: "Ce mois-ci", sub: "kills mois courant" },
  ];
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {tabs.map((t) => (
        <button
          key={t.key}
          type="button"
          onClick={() => onChange(t.key)}
          className={`px-3 py-2 rounded border transition-colors ${
            mode === t.key
              ? "bg-gold/15 border-gold/60 text-gold"
              : "bg-bg-elevated border-border text-text-secondary hover:text-text-primary hover:border-text-muted"
          }`}
        >
          <span className="text-xs font-mono uppercase tracking-wider font-semibold">{t.label}</span>
          <span className="block text-[9px] font-mono text-text-muted/70 mt-0.5">{t.sub}</span>
        </button>
      ))}
    </div>
  );
}

function SortedLeaderboard({ entries, mode }: { entries: Entry[]; mode: SortMode }) {
  const sorted = useMemo(() => {
    const arr = [...entries];
    if (mode === "solo") arr.sort((a, b) => (b.career?.soloKills ?? -1) - (a.career?.soloKills ?? -1));
    else if (mode === "isk") arr.sort((a, b) => (b.career?.iskDestroyed ?? -1) - (a.career?.iskDestroyed ?? -1));
    else if (mode === "month") arr.sort((a, b) => (b.career?.killsThisMonth ?? -1) - (a.career?.killsThisMonth ?? -1));
    return arr;
  }, [entries, mode]);

  // Valeur max selon le mode pour la barre de progression
  const max = useMemo(() => {
    if (sorted.length === 0) return 1;
    const first = sorted[0]!;
    if (mode === "kills") return first.kills || 1;
    if (mode === "solo") return first.career?.soloKills || 1;
    if (mode === "isk") return first.career?.iskDestroyed || 1;
    if (mode === "month") return first.career?.killsThisMonth || 1;
    return 1;
  }, [sorted, mode]);

  return (
    <div className="bg-bg-elevated border border-border rounded-md overflow-hidden">
      <div className="grid grid-cols-[2rem_1fr_minmax(4rem,6rem)] sm:grid-cols-[3rem_1fr_minmax(6rem,8rem)_minmax(9rem,14rem)] items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 border-b border-border bg-bg-deep/60">
        <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted">#</span>
        <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted">Pilote</span>
        <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted text-right">
          {sortLabel(mode)}
        </span>
        <span className="hidden sm:block text-[10px] font-mono uppercase tracking-wider text-text-muted">Progression</span>
      </div>
      <ul className="divide-y divide-border">
        {sorted.map((e, i) => (
          <LeaderRow
            key={e.characterId}
            entry={e}
            rank={i + 1}
            mode={mode}
            maxValue={max}
          />
        ))}
      </ul>
    </div>
  );
}

function sortLabel(mode: SortMode): string {
  if (mode === "solo") return "Kills solo";
  if (mode === "isk") return "ISK détruits";
  if (mode === "month") return "Ce mois";
  return "Kills";
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
  mode,
  maxValue,
}: {
  entry: Entry;
  rank: number;
  mode: SortMode;
  maxValue: number;
}) {
  const portrait = `https://images.evetech.net/characters/${entry.characterId}/portrait?size=64`;

  // Valeur affichée selon le mode de tri actif
  let value: number;
  let valueDisplay: string;
  if (mode === "solo") {
    value = entry.career?.soloKills ?? 0;
    valueDisplay = value.toLocaleString("fr-FR");
  } else if (mode === "isk") {
    value = entry.career?.iskDestroyed ?? 0;
    valueDisplay = formatIsk(value);
  } else if (mode === "month") {
    value = entry.career?.killsThisMonth ?? 0;
    valueDisplay = value.toLocaleString("fr-FR");
  } else {
    value = entry.kills;
    valueDisplay = value.toLocaleString("fr-FR");
  }

  const pct = maxValue > 0 ? Math.round((value / maxValue) * 100) : 0;

  // Tendance ce mois vs mois précédent (visible en mode kills)
  const thisMonth = entry.career?.killsThisMonth ?? 0;
  const lastMonth = entry.career?.killsLastMonth ?? 0;
  const trend = thisMonth > lastMonth + 2 ? "up" : thisMonth < lastMonth - 2 ? "down" : "flat";

  // Achievements automatiques
  const achievements = computeAchievements(entry);

  return (
    <li>
      <a
        href={`https://zkillboard.com/character/${entry.characterId}/`}
        target="_blank"
        rel="noreferrer noopener"
        className="grid grid-cols-[2rem_1fr_minmax(4rem,6rem)] sm:grid-cols-[3rem_1fr_minmax(6rem,8rem)_minmax(9rem,14rem)] items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 hover:bg-bg-deep/40 transition-colors"
      >
        <span className="font-mono text-sm text-text-muted text-center tabular-nums">{rank}</span>

        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={portrait}
            alt=""
            width={36}
            height={36}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover bg-bg-deep shrink-0"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm font-semibold text-text-primary truncate">
                {entry.characterName ?? `Pilote ${entry.characterId}`}
              </span>
              {achievements.map((a) => (
                <AchievementBadge key={a.id} icon={a.icon} tip={a.tip} />
              ))}
            </div>
            <div className="mt-1 flex items-center gap-1.5 flex-wrap">
              {entry.corpIds.map((c) => (
                <CorpBadge key={c} corpId={c} small />
              ))}
              {/* Vaisseaux favoris (mini icônes) */}
              {entry.career?.favoriteShips.slice(0, 3).map((s) => (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  key={s.shipTypeId}
                  src={`https://images.evetech.net/types/${s.shipTypeId}/icon?size=32`}
                  alt={s.shipName ?? ""}
                  title={`${s.shipName ?? "Ship"} · ${s.kills.toLocaleString("fr-FR")} kills`}
                  className="w-4 h-4 rounded-sm bg-bg-deep opacity-80"
                />
              ))}
              {/* Trend ce mois (visible en mode kills uniquement, et seulement si différent) */}
              {mode === "kills" && entry.career && (thisMonth > 0 || lastMonth > 0) && (
                <span
                  className={`text-[9px] font-mono uppercase tracking-wider px-1 py-0.5 rounded border ${
                    trend === "up"
                      ? "text-emerald-400 border-emerald-500/40 bg-emerald-500/10"
                      : trend === "down"
                      ? "text-red-400 border-red-500/40 bg-red-500/10"
                      : "text-text-muted border-border bg-bg-deep/60"
                  }`}
                  title={`${thisMonth} kills ce mois · ${lastMonth} mois dernier`}
                >
                  {trend === "up" ? "↗" : trend === "down" ? "↘" : "→"} {thisMonth}
                </span>
              )}
            </div>
          </div>
        </div>

        <span className="font-mono text-sm sm:text-base font-semibold text-emerald-400 text-right tabular-nums">
          {valueDisplay}
        </span>

        {/* Barre de progression — masquée sur mobile (manque de place) */}
        <div className="hidden sm:block relative h-2 rounded-full bg-bg-deep overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500/80 to-emerald-400/60 rounded-full"
            style={{ width: `${pct}%` }}
          />
        </div>
      </a>
    </li>
  );
}

/* ─────────────────────── Achievements ─────────────────────── */

interface Achievement {
  id: string;
  icon: string;
  tip: string;
}

function computeAchievements(entry: Entry): Achievement[] {
  const acc: Achievement[] = [];
  const c = entry.career;
  // Paliers de kills carrière
  if (c) {
    if (c.kills >= 10000) acc.push({ id: "10k", icon: "👑", tip: "10 000+ kills carrière" });
    else if (c.kills >= 5000) acc.push({ id: "5k", icon: "💎", tip: "5 000+ kills carrière" });
    else if (c.kills >= 1000) acc.push({ id: "1k", icon: "🎖️", tip: "1 000+ kills carrière" });
    else if (c.kills >= 100) acc.push({ id: "100", icon: "🏅", tip: "100+ kills carrière" });
    // Solo hunter
    if (c.soloKills >= 100) acc.push({ id: "soloMaster", icon: "🥷", tip: "Solo Master (100+ solo kills)" });
    else if (c.soloKills >= 10) acc.push({ id: "soloHunter", icon: "🗡️", tip: "Solo Hunter (10+ solo kills)" });
    // Glass cannon / Danger
    if (c.dangerRatio >= 80) acc.push({ id: "danger", icon: "⚡", tip: `Danger Index ${c.dangerRatio}% — pilote redoutable` });
    // ISK Wallet (≥1 trillion)
    if (c.iskDestroyed >= 1_000_000_000_000) acc.push({ id: "trillion", icon: "💰", tip: "1+ trillion ISK détruit" });
  }
  return acc.slice(0, 3); // Limite affichage
}

function AchievementBadge({ icon, tip }: { icon: string; tip: string }) {
  return (
    <span
      className="text-sm leading-none cursor-help"
      title={tip}
      aria-label={tip}
    >
      {icon}
    </span>
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

/* ─────────────────────── Combat Intelligence ─────────────────────── */

const DAY_LABELS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

function BiggestKillCard({ kill }: { kill: BiggestKill }) {
  const shipIcon = `https://images.evetech.net/types/${kill.victimShipTypeId}/render?size=256`;
  const date = new Date(kill.killTime).toLocaleDateString("fr-FR", {
    day: "numeric", month: "short", year: "numeric",
  });
  const ago = Math.floor((Date.now() - new Date(kill.killTime).getTime()) / (86400 * 1000));

  return (
    <a
      href={kill.zkillUrl}
      target="_blank"
      rel="noreferrer noopener"
      className="group block relative overflow-hidden bg-gradient-to-r from-red-950/40 via-amber-950/30 to-bg-deep border border-red-500/40 rounded-md hover:border-red-400/70 transition-colors"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          background: "radial-gradient(circle at 20% 50%, rgba(220,38,38,0.35) 0%, transparent 60%)",
        }}
      />
      <div className="relative flex items-center gap-4 sm:gap-6 p-5 sm:p-7">
        {/* Render vaisseau */}
        <div className="relative shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={shipIcon}
            alt={kill.victimShipName ?? "Vaisseau"}
            className="w-24 h-24 sm:w-32 sm:h-32 rounded-md object-cover bg-bg-deep ring-2 ring-red-500/40 group-hover:ring-red-400/70 transition-all"
          />
          <span className="absolute -top-2 -left-2 text-3xl drop-shadow-lg">💀</span>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-red-300 text-[10px] font-mono uppercase tracking-[0.2em] mb-1">
            ★ Best Kill all-time
          </p>
          <h4 className="font-display font-bold text-xl sm:text-3xl text-text-primary leading-tight truncate">
            {kill.victimShipName ?? `Vaisseau #${kill.victimShipTypeId}`}
          </h4>
          <p className="mt-1 text-sm text-text-secondary truncate">
            détruit par{" "}
            <strong className="text-amber-200">
              {kill.finalBlowCharacterName ?? "Pilote inconnu"}
            </strong>
            {kill.finalBlowCorpId && CORP_SHORT[kill.finalBlowCorpId] && (
              <span className="text-text-muted"> ({CORP_LABELS[kill.finalBlowCorpId]})</span>
            )}
          </p>
          {kill.victimCharacterName && (
            <p className="mt-0.5 text-xs text-text-muted truncate">
              victime : {kill.victimCharacterName}
            </p>
          )}
          <div className="mt-3 flex items-baseline gap-3 flex-wrap">
            <span className="font-mono text-2xl sm:text-4xl font-bold text-emerald-400 tabular-nums">
              {formatIsk(kill.totalValue)}
            </span>
            <span className="text-text-secondary text-sm">ISK détruits</span>
          </div>
          <p className="mt-2 text-[10px] font-mono uppercase tracking-wider text-text-muted">
            {date} · il y a {ago > 365 ? `${(ago / 365).toFixed(1)} an${ago / 365 >= 2 ? "s" : ""}` : `${ago}j`} ·{" "}
            <span className="text-gold/70 group-hover:text-gold">voir sur zKill →</span>
          </p>
        </div>
      </div>
    </a>
  );
}

function HeatmapCard({ heatmap }: { heatmap: HeatmapData }) {
  const peak = heatmap.peakHour;
  const maxHourly = Math.max(1, ...heatmap.byHour);

  return (
    <div className="h-full bg-bg-elevated border border-border rounded-md p-5">
      <div className="flex items-baseline justify-between mb-1 gap-3 flex-wrap">
        <h4 className="text-gold text-[10px] font-mono uppercase tracking-[0.2em]">
          Prime time PvP
        </h4>
        <span className="text-[11px] text-text-secondary font-mono">
          Pic à <strong className="text-amber-200">{String(peak.hour).padStart(2, "0")}h00 UTC</strong>
          {" · "}{peak.count} kills
        </span>
      </div>
      <p className="text-xs text-text-muted mb-4">
        Heures auxquelles la corporation fight le plus (cumul historique, UTC).
      </p>

      {/* Bars agrégées 24h */}
      <div className="flex items-end gap-[3px] h-20 mb-3">
        {heatmap.byHour.map((v, h) => {
          const pct = (v / maxHourly) * 100;
          const isPeak = h === peak.hour;
          return (
            <div
              key={h}
              className="flex-1 flex items-end h-full"
              title={`${String(h).padStart(2, "0")}h : ${v} kills`}
            >
              <div
                className={`w-full rounded-t-sm transition-all ${
                  isPeak
                    ? "bg-gradient-to-t from-red-500 to-amber-400 shadow-[0_0_8px_rgba(220,38,38,0.4)]"
                    : v === 0
                    ? "bg-bg-deep"
                    : "bg-gradient-to-t from-amber-600/60 to-amber-400/40"
                }`}
                style={{ height: v === 0 ? "2px" : `${Math.max(8, pct)}%` }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-[9px] font-mono uppercase tracking-wider text-text-muted">
        <span>00h</span><span>06h</span><span>12h</span><span>18h</span><span>23h</span>
      </div>

      {/* Mini matrice 7×24 (jour × heure) */}
      <div className="mt-5 pt-4 border-t border-border/40">
        <p className="text-[10px] font-mono uppercase tracking-wider text-text-muted mb-2">
          Activité par jour de la semaine
        </p>
        <div className="space-y-1">
          {heatmap.matrix.map((row, d) => (
            <div key={d} className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-text-muted w-7">{DAY_LABELS[d]}</span>
              <div className="flex gap-[2px] flex-1">
                {row.map((v, h) => {
                  const intensity = heatmap.max > 0 ? v / heatmap.max : 0;
                  return (
                    <div
                      key={h}
                      className="flex-1 h-2.5 rounded-sm"
                      style={{
                        backgroundColor: v === 0
                          ? "rgba(255,255,255,0.04)"
                          : `rgba(250, 204, 21, ${0.15 + intensity * 0.75})`,
                      }}
                      title={`${DAY_LABELS[d]} ${String(h).padStart(2, "0")}h : ${v} kills`}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SoloCard({ solo }: { solo: SoloStats }) {
  return (
    <div className="h-full bg-bg-elevated border border-border rounded-md p-5">
      <h4 className="text-gold text-[10px] font-mono uppercase tracking-[0.2em] mb-1">
        Combat solo
      </h4>
      <p className="text-xs text-text-muted mb-5">
        Le solo PvP — l&apos;art de combattre seul.
      </p>

      <div className="space-y-4">
        <StatTile
          label="Kills solo"
          value={solo.soloKills.toLocaleString("fr-FR")}
          accent="emerald"
        />
        <StatTile
          label="ISK détruits solo"
          value={formatIsk(solo.iskDestroyedSolo)}
          accent="emerald"
        />
        <StatTile
          label="Ratio solo"
          value={`${solo.soloRatio.toFixed(1)} %`}
          sub="des kills sont en solo"
        />
        <StatTile
          label="Taille moyenne de gang"
          value={solo.avgGangSize > 0 ? solo.avgGangSize.toFixed(0) : "—"}
          sub="pilotes par engagement"
        />
      </div>
    </div>
  );
}

function StatTile({
  label, value, sub, accent,
}: {
  label: string; value: string; sub?: string; accent?: "emerald" | "amber";
}) {
  const valueCls = accent === "emerald" ? "text-emerald-400" : "text-text-primary";
  return (
    <div>
      <p className="text-[10px] font-mono uppercase tracking-wider text-text-muted">{label}</p>
      <p className={`mt-0.5 font-mono text-2xl font-bold tabular-nums ${valueCls}`}>{value}</p>
      {sub && <p className="text-[10px] text-text-muted">{sub}</p>}
    </div>
  );
}

function ShipClassesCard({ rows }: { rows: ShipClassRow[] }) {
  const max = Math.max(1, ...rows.map((r) => r.shipsDestroyed));
  const totalKills = rows.reduce((acc, r) => acc + r.shipsDestroyed, 0);
  const visible = rows.filter((r) => r.shipsDestroyed > 0).slice(0, 9);

  return (
    <div className="h-full bg-bg-elevated border border-border rounded-md p-5">
      <h4 className="text-gold text-[10px] font-mono uppercase tracking-[0.2em] mb-1">
        Classes de vaisseaux détruits
      </h4>
      <p className="text-xs text-text-muted mb-4">
        Sur quoi la corp tape (toutes corps cumulées).
      </p>

      <ul className="space-y-2.5">
        {visible.map((r) => {
          const pct = totalKills > 0 ? (r.shipsDestroyed / totalKills) * 100 : 0;
          const barPct = (r.shipsDestroyed / max) * 100;
          return (
            <li key={r.category}>
              <div className="flex items-baseline justify-between text-xs mb-1">
                <span className="text-text-primary font-medium">{r.category}</span>
                <span className="text-text-muted font-mono">
                  <strong className="text-emerald-400">{r.shipsDestroyed}</strong>
                  <span className="text-text-muted/60"> · {pct.toFixed(0)}%</span>
                </span>
              </div>
              <div className="relative h-1.5 rounded-full bg-bg-deep overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500/80 to-amber-400/60 rounded-full"
                  style={{ width: `${barPct}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function TopShipsCard({ ships }: { ships: TopShipEntry[] }) {
  if (ships.length === 0) {
    return (
      <div className="h-full bg-bg-elevated border border-border rounded-md p-5">
        <h4 className="text-gold text-[10px] font-mono uppercase tracking-[0.2em] mb-1">
          Vaisseaux préférés
        </h4>
        <p className="text-xs text-text-muted">Pas de données.</p>
      </div>
    );
  }
  const max = Math.max(1, ...ships.map((s) => s.kills));

  return (
    <div className="h-full bg-bg-elevated border border-border rounded-md p-5">
      <h4 className="text-gold text-[10px] font-mono uppercase tracking-[0.2em] mb-1">
        Vaisseaux préférés
      </h4>
      <p className="text-xs text-text-muted mb-4">
        Les vaisseaux les plus utilisés pour killer.
      </p>

      <ul className="space-y-2">
        {ships.slice(0, 6).map((s, i) => {
          const pct = (s.kills / max) * 100;
          return (
            <li key={s.shipTypeId}>
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://images.evetech.net/types/${s.shipTypeId}/icon?size=32`}
                  alt=""
                  width={28}
                  height={28}
                  className="w-7 h-7 rounded-sm bg-bg-deep shrink-0"
                />
                <span className="text-xs text-text-muted w-4 tabular-nums">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2 mb-1">
                    <span className="text-sm text-text-primary truncate">
                      {s.shipName ?? `Ship #${s.shipTypeId}`}
                    </span>
                    <span className="text-xs font-mono font-semibold text-emerald-400 tabular-nums shrink-0">
                      {s.kills.toLocaleString("fr-FR")}
                    </span>
                  </div>
                  <div className="relative h-1 rounded-full bg-bg-deep overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-500/80 to-amber-400/40 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
