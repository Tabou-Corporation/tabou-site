"use client";

import { useEffect, useMemo, useState } from "react";

/**
 * Hall of Fame Tabou + Urban Zone — classement all-time des pilotes par kills,
 * fusionné entre les deux corps. Source : zKillboard stats endpoint (toutes
 * régions, depuis la création de chaque corp).
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
// Couleur de signature par corp (utilisée pour le badge + l'éventuel halo)
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

  if (loading) {
    return (
      <div className="bg-bg-elevated border border-border rounded-md p-12 text-center text-text-muted text-sm italic">
        Chargement du classement all-time…
      </div>
    );
  }
  if (error) {
    return (
      <div className="bg-bg-elevated border border-border rounded-md p-12 text-center text-red-400 text-sm">
        Erreur : {error}
      </div>
    );
  }
  if (entries.length === 0) {
    return (
      <div className="bg-bg-elevated border border-border rounded-md p-12 text-center text-text-secondary text-sm">
        Aucune donnée zKill disponible pour le moment.
      </div>
    );
  }

  const podium = entries.slice(0, 3);
  const rest = entries.slice(3);

  return (
    <div className="space-y-4">
      {/* En-tête : totaux corp côte à côte */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {totals.map((t) => (
          <CorpStatCard key={t.corpId} total={t} />
        ))}
        <AllianceCard
          totals={allianceTotals}
          pilotCount={entries.length}
        />
      </div>

      {/* Podium top 3 */}
      {podium.length > 0 && (
        <div className="bg-bg-elevated border border-border rounded-md p-4 sm:p-6">
          <h3 className="text-[10px] font-mono uppercase tracking-[0.2em] text-text-muted text-center mb-6">
            ★ Podium all-time ★
          </h3>
          <div className="flex items-end justify-center gap-3 sm:gap-6">
            {/* Réorganisation visuelle : 2 — 1 — 3 (1er au centre, plus haut) */}
            {[podium[1], podium[0], podium[2]]
              .filter((p): p is Entry => Boolean(p))
              .map((p) => (
                <PodiumCard
                  key={p.characterId}
                  entry={p}
                  rank={entries.indexOf(p) + 1}
                />
              ))}
          </div>
        </div>
      )}

      {/* Tableau complet (top 4+) */}
      {rest.length > 0 && (
        <div className="bg-bg-elevated border border-border rounded-md overflow-hidden">
          <div className="grid grid-cols-[2.5rem_1fr_5rem_minmax(8rem,12rem)] sm:grid-cols-[3rem_1fr_6rem_minmax(10rem,16rem)] items-center gap-3 px-4 py-2 border-b border-border bg-bg-deep/60">
            <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted">#</span>
            <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted">Pilote</span>
            <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted text-right">Kills</span>
            <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted">Progression</span>
          </div>
          <ul className="divide-y divide-border max-h-[640px] overflow-y-auto">
            {rest.map((e, i) => (
              <LeaderRow key={e.characterId} entry={e} rank={i + 4} maxKills={maxKills} />
            ))}
          </ul>
        </div>
      )}

      {data && (
        <p className="text-center text-[10px] font-mono uppercase tracking-wider text-text-muted">
          zKillboard · all-time · mis à jour {freshnessLabel(data.fetchedAt)}
          {data.fromCache && " · cache"}
        </p>
      )}
    </div>
  );
}

/* ─────────────────────────── Cards / Rows ─────────────────────────── */

function CorpStatCard({ total }: { total: CorpTotal }) {
  const ratio =
    total.iskLost > 0 ? (total.iskDestroyed / total.iskLost).toFixed(1) : "∞";
  const colorClass = CORP_COLOR[total.corpId] ?? "from-text-muted/20 to-transparent text-text-secondary border-border";

  return (
    <div className={`relative overflow-hidden bg-bg-elevated border rounded-md p-4 ${colorClass.split(" ").filter((c) => c.startsWith("border-")).join(" ")}`}>
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${colorClass.split(" ").filter((c) => c.startsWith("from-") || c.startsWith("to-")).join(" ")}`} />
      <div className="relative">
        <div className={`text-[10px] font-mono uppercase tracking-[0.2em] ${colorClass.split(" ").filter((c) => c.startsWith("text-")).join(" ")}`}>
          {CORP_LABELS[total.corpId] ?? `Corp ${total.corpId}`}
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-3xl font-bold text-text-primary tabular-nums">
            {total.shipsDestroyed.toLocaleString("fr-FR")}
          </span>
          <span className="text-xs text-text-secondary">kills</span>
        </div>
        <div className="mt-2 text-xs text-text-secondary space-y-0.5 font-mono">
          <div>
            <span className="text-emerald-400">{formatIsk(total.iskDestroyed)}</span>
            <span className="text-text-muted"> / </span>
            <span className="text-red-400">{formatIsk(total.iskLost)}</span>
            <span className="text-text-muted"> ISK</span>
          </div>
          <div className="text-text-muted">
            Efficacité {ratio} · {total.pilotCount} pilotes
          </div>
        </div>
      </div>
    </div>
  );
}

function AllianceCard({
  totals,
  pilotCount,
}: {
  totals: { shipsDestroyed: number; shipsLost: number; iskDestroyed: number; iskLost: number };
  pilotCount: number;
}) {
  return (
    <div className="relative overflow-hidden bg-bg-elevated border border-emerald-500/40 rounded-md p-4">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-transparent" />
      <div className="relative">
        <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-emerald-300">
          ★ Alliance combinée
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-3xl font-bold text-text-primary tabular-nums">
            {totals.shipsDestroyed.toLocaleString("fr-FR")}
          </span>
          <span className="text-xs text-text-secondary">kills cumulés</span>
        </div>
        <div className="mt-2 text-xs text-text-secondary space-y-0.5 font-mono">
          <div>
            <span className="text-emerald-400">{formatIsk(totals.iskDestroyed)}</span>
            <span className="text-text-muted"> ISK détruits</span>
          </div>
          <div className="text-text-muted">{pilotCount} pilotes classés</div>
        </div>
      </div>
    </div>
  );
}

/** Carte podium pour les rangs 1-3 — 1 = central, plus haut */
function PodiumCard({ entry, rank }: { entry: Entry; rank: number }) {
  const portrait = `https://images.evetech.net/characters/${entry.characterId}/portrait?size=128`;
  const isFirst = rank === 1;
  const size = isFirst ? "w-24 h-24 sm:w-32 sm:h-32" : "w-16 h-16 sm:w-20 sm:h-20";
  const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : "🥉";
  const heightClass = isFirst ? "pb-2" : "pb-0";
  const ring =
    rank === 1
      ? "ring-2 ring-yellow-400/80 shadow-[0_0_24px_rgba(250,204,21,0.35)]"
      : rank === 2
      ? "ring-2 ring-zinc-300/70"
      : "ring-2 ring-amber-700/70";

  return (
    <a
      href={`https://zkillboard.com/character/${entry.characterId}/`}
      target="_blank"
      rel="noreferrer noopener"
      className={`group flex flex-col items-center text-center ${heightClass} transition-transform hover:-translate-y-1`}
    >
      <span className={`text-2xl ${isFirst ? "sm:text-3xl" : ""}`}>{medal}</span>
      <div className="relative mt-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={portrait}
          alt={entry.characterName ?? `Pilote ${entry.characterId}`}
          className={`${size} rounded-full object-cover ${ring} bg-bg-deep`}
        />
        <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider bg-bg-deep border border-border text-text-primary">
          #{rank}
        </span>
      </div>
      <div className={`mt-4 ${isFirst ? "text-base sm:text-lg" : "text-sm"} font-semibold text-text-primary group-hover:text-gold transition-colors max-w-[10rem] truncate`}>
        {entry.characterName ?? `Pilote ${entry.characterId}`}
      </div>
      <div className="mt-1 flex items-center gap-1.5 flex-wrap justify-center">
        {entry.corpIds.map((c) => (
          <CorpBadge key={c} corpId={c} />
        ))}
      </div>
      <div className={`mt-1 font-mono ${isFirst ? "text-2xl sm:text-3xl" : "text-xl"} font-bold text-emerald-400 tabular-nums`}>
        {entry.kills.toLocaleString("fr-FR")}
      </div>
      <div className="text-[10px] font-mono uppercase tracking-wider text-text-muted">kills</div>
    </a>
  );
}

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
