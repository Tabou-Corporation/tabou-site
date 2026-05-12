"use client";

import { useEffect, useMemo, useState } from "react";
import { SDE_BY_ID } from "@/lib/map/sde";

/**
 * Panneau Activité corp Tabou + Urban Zone — kills & losses des 30 derniers
 * jours sur Providence + Catch uniquement. Deux vues :
 *  - Chronologie : liste antichronologique des killmails
 *  - Par pilote  : agrégation par character_id (K/L, ISK, ships volés)
 *
 * Click sur une ligne → sélectionne le système sur la carte.
 */

interface CorpKillEntry {
  killId: number;
  killTime: string;
  side: "kill" | "loss";
  involvedCorpId: number;
  pilot: { characterId: number | null; characterName: string | null; shipTypeId: number | null };
  ship: { typeId: number; name: string };
  victim: { allianceId: number | null; allianceName: string | null; corporationId: number | null };
  solarSystemId: number;
  totalValue: number;
  attackerCount: number;
  zkillUrl: string;
}

interface Payload {
  entries: CorpKillEntry[];
  fromCache: boolean;
  fetchedAt: string;
}

const CORP_LABELS: Record<number, string> = {
  98809880: "Tabou",
  98215397: "Urban Zone",
};

function formatIsk(value: number): string {
  if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(0)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(0)}k`;
  return `${Math.round(value)}`;
}

function diffHuman(ms: number): string {
  const abs = Math.abs(ms);
  const d = Math.floor(abs / 86400000);
  const h = Math.floor((abs % 86400000) / 3600000);
  const m = Math.floor((abs % 3600000) / 60000);
  if (d > 0) return `${d}j${h > 0 ? ` ${h}h` : ""}`;
  if (h > 0) return `${h}h${m > 0 ? String(m).padStart(2, "0") : ""}`;
  return `${m}min`;
}

type View = "chrono" | "pilots";

export function CorpActivityPanel({
  onPickSystem,
}: {
  onPickSystem: (id: number | null) => void;
}) {
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>("chrono");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch("/api/map/kills/corp")
      .then((r) => r.json())
      .then((d: Payload) => {
        if (!cancelled) { setData(d); setError(null); }
      })
      .catch((e) => { if (!cancelled) setError(String(e)); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const entries = data?.entries ?? [];

  const stats = useMemo(() => {
    let kills = 0, losses = 0, iskKilled = 0, iskLost = 0;
    for (const e of entries) {
      if (e.side === "kill") { kills++; iskKilled += e.totalValue; }
      else { losses++; iskLost += e.totalValue; }
    }
    return { kills, losses, iskKilled, iskLost };
  }, [entries]);

  const pilots = useMemo(() => {
    const byPilot = new Map<number, {
      name: string | null;
      kills: number; losses: number;
      iskKilled: number; iskLost: number;
      shipExamples: Set<number>;
      corpId: number;
      lastActivity: number;
    }>();
    for (const e of entries) {
      const pid = e.pilot.characterId;
      if (!pid) continue;
      const t = new Date(e.killTime).getTime();
      const prev = byPilot.get(pid) ?? {
        name: e.pilot.characterName,
        kills: 0, losses: 0, iskKilled: 0, iskLost: 0,
        shipExamples: new Set<number>(), corpId: e.involvedCorpId,
        lastActivity: 0,
      };
      if (!prev.name && e.pilot.characterName) prev.name = e.pilot.characterName;
      if (e.side === "kill") { prev.kills++; prev.iskKilled += e.totalValue; }
      else { prev.losses++; prev.iskLost += e.totalValue; }
      if (e.pilot.shipTypeId) prev.shipExamples.add(e.pilot.shipTypeId);
      if (t > prev.lastActivity) prev.lastActivity = t;
      byPilot.set(pid, prev);
    }
    return [...byPilot.entries()]
      .map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => (b.kills + b.losses) - (a.kills + a.losses));
  }, [entries]);

  const fresh = data ? freshnessLabel(data.fetchedAt) : "";

  return (
    <div className="space-y-4">
      {/* Barre de filtres + stats */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-bg-elevated border border-border rounded-md px-4 py-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex gap-1 text-xs font-mono">
            {(["chrono", "pilots"] as View[]).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                className={
                  "px-3 py-1.5 rounded border transition-colors " +
                  (v === view
                    ? "bg-gold/15 border-gold/60 text-gold"
                    : "bg-bg-deep border-border text-text-secondary hover:text-text-primary hover:border-text-muted")
                }
              >{v === "chrono" ? "Chronologie" : "Par pilote"}</button>
            ))}
          </div>
          {data && (
            <div className="text-xs text-text-secondary flex items-center gap-2 flex-wrap">
              <span><strong className="text-emerald-400">{stats.kills}</strong> kills</span>
              <span className="text-text-muted">·</span>
              <span><strong className="text-red-400">{stats.losses}</strong> losses</span>
              <span className="text-text-muted">·</span>
              <span>
                <strong className="text-emerald-400">{formatIsk(stats.iskKilled)}</strong>
                {" / "}
                <strong className="text-red-400">{formatIsk(stats.iskLost)}</strong>
                {" ISK"}
              </span>
            </div>
          )}
        </div>
        {fresh && (
          <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted whitespace-nowrap">
            zKill · {fresh}
          </span>
        )}
      </div>

      {/* Contenu */}
      <div className="bg-bg-elevated border border-border rounded-md overflow-hidden">
        {loading && (
          <div className="p-8 text-center text-text-muted text-sm italic">
            Chargement zKillboard…
          </div>
        )}
        {error && (
          <div className="p-8 text-center text-red-400 text-sm">
            Erreur : {error}
          </div>
        )}
        {!loading && !error && entries.length === 0 && (
          <div className="p-8 text-center text-text-secondary text-sm">
            Aucune activité Tabou ni Urban Zone détectée sur Providence/Catch dans les 30 derniers jours.
          </div>
        )}

        {!loading && view === "chrono" && entries.length > 0 && (
          <ul className="divide-y divide-border max-h-[640px] overflow-y-auto">
            {entries.slice(0, 80).map((e) => (
              <ChronoRow key={e.killId} entry={e} onPickSystem={onPickSystem} />
            ))}
          </ul>
        )}

        {!loading && view === "pilots" && pilots.length > 0 && (
          <ul className="divide-y divide-border max-h-[640px] overflow-y-auto">
            {pilots.map((p) => (
              <PilotRow key={p.id} pilot={p} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function ChronoRow({
  entry,
  onPickSystem,
}: {
  entry: CorpKillEntry;
  onPickSystem: (id: number | null) => void;
}) {
  const ago = diffHuman(Date.now() - new Date(entry.killTime).getTime());
  const sysName = SDE_BY_ID.get(entry.solarSystemId)?.name ?? `#${entry.solarSystemId}`;
  const sysRegion = SDE_BY_ID.get(entry.solarSystemId)?.regionName ?? "";
  const isKill = entry.side === "kill";
  const corp = CORP_LABELS[entry.involvedCorpId] ?? `Corp #${entry.involvedCorpId}`;
  const portraitUrl = entry.pilot.characterId
    ? `https://images.evetech.net/characters/${entry.pilot.characterId}/portrait?size=64`
    : null;
  const shipIcon = entry.pilot.shipTypeId
    ? `https://images.evetech.net/types/${entry.pilot.shipTypeId}/icon?size=64`
    : `https://images.evetech.net/types/${entry.ship.typeId}/icon?size=64`;

  return (
    <li>
      <button
        type="button"
        onClick={() => onPickSystem(entry.solarSystemId)}
        className={`w-full text-left flex items-center gap-3 px-4 py-3 hover:bg-bg-deep/40 transition-colors border-l-2 ${
          isKill ? "border-emerald-500/70" : "border-red-500/70"
        }`}
      >
        {/* Portrait pilote + ship overlay */}
        <div className="relative w-12 h-12 shrink-0">
          {portraitUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={portraitUrl} alt="" width={48} height={48} className="w-12 h-12 rounded-sm object-cover" />
          ) : (
            <div className="w-12 h-12 rounded-sm bg-bg-deep border border-border" />
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={shipIcon}
            alt=""
            width={22}
            height={22}
            className="absolute -bottom-1 -right-1 w-6 h-6 rounded-sm border-2 border-bg-elevated bg-bg-deep"
          />
        </div>

        {/* Pilote + ship */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-sm font-semibold text-text-primary truncate">
              {entry.pilot.characterName ?? `Pilote #${entry.pilot.characterId ?? "?"}`}
            </span>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${
              isKill ? "text-emerald-400" : "text-red-400"
            }`}>
              {isKill ? "Kill" : "Loss"}
            </span>
            <span className="text-xs text-text-secondary truncate">{entry.ship.name}</span>
          </div>
          <div className="text-xs text-text-muted mt-0.5 truncate">
            <span
              role="button"
              onClick={(ev) => { ev.stopPropagation(); onPickSystem(entry.solarSystemId); }}
              className="text-gold hover:underline cursor-pointer"
            >{sysName}</span>
            {sysRegion && <span> · {sysRegion}</span>}
            {" · "}{corp}
            {isKill && entry.victim.allianceName && (
              <span className="text-text-secondary"> · vs {entry.victim.allianceName}</span>
            )}
          </div>
        </div>

        {/* ISK + temps */}
        <div className="flex flex-col items-end gap-1 shrink-0 text-right">
          <span className={`text-sm font-mono font-semibold ${
            isKill ? "text-emerald-400" : "text-red-400"
          }`}>
            {formatIsk(entry.totalValue)}
          </span>
          <span className="text-[10px] text-text-muted font-mono">il y a {ago}</span>
          <a
            href={entry.zkillUrl}
            target="_blank"
            rel="noreferrer noopener"
            onClick={(ev) => ev.stopPropagation()}
            className="text-[10px] text-gold/70 hover:text-gold hover:underline"
          >zKill →</a>
        </div>
      </button>
    </li>
  );
}

function PilotRow({
  pilot,
}: {
  pilot: {
    id: number;
    name: string | null;
    kills: number; losses: number;
    iskKilled: number; iskLost: number;
    shipExamples: Set<number>;
    corpId: number;
    lastActivity: number;
  };
}) {
  const portraitUrl = `https://images.evetech.net/characters/${pilot.id}/portrait?size=64`;
  const shipIcons = [...pilot.shipExamples].slice(0, 5);
  const corp = CORP_LABELS[pilot.corpId] ?? `Corp #${pilot.corpId}`;
  const lastAgo = pilot.lastActivity > 0 ? diffHuman(Date.now() - pilot.lastActivity) : null;
  const ratio = pilot.losses > 0 ? (pilot.kills / pilot.losses).toFixed(1) : "∞";

  return (
    <li>
      <a
        href={`https://zkillboard.com/character/${pilot.id}/`}
        target="_blank"
        rel="noreferrer noopener"
        className="flex items-center gap-3 px-4 py-3 hover:bg-bg-deep/40 transition-colors"
      >
        <div className="relative w-12 h-12 shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={portraitUrl} alt="" width={48} height={48} className="w-12 h-12 rounded-sm object-cover" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-text-primary truncate">
            {pilot.name ?? `Pilote #${pilot.id}`}
          </div>
          <div className="text-xs text-text-muted mt-0.5">
            {corp}
            {lastAgo && <span> · actif il y a {lastAgo}</span>}
          </div>
        </div>

        {/* Ships volés (icônes) */}
        {shipIcons.length > 0 && (
          <div className="hidden md:flex items-center gap-1 shrink-0">
            {shipIcons.map((typeId) => (
              <img
                key={typeId}
                src={`https://images.evetech.net/types/${typeId}/icon?size=32`}
                alt=""
                width={24}
                height={24}
                className="w-6 h-6 rounded-sm bg-bg-deep"
              />
            ))}
          </div>
        )}

        {/* Stats */}
        <div className="text-right shrink-0 font-mono">
          <div className="text-sm">
            <span className="text-emerald-400 font-semibold">{pilot.kills}</span>
            <span className="text-text-muted">/</span>
            <span className="text-red-400 font-semibold">{pilot.losses}</span>
            <span className="text-text-muted text-xs ml-1">({ratio})</span>
          </div>
          <div className="text-[10px] text-text-muted">
            <span className="text-emerald-400/80">{formatIsk(pilot.iskKilled)}</span>
            <span className="mx-0.5">/</span>
            <span className="text-red-400/80">{formatIsk(pilot.iskLost)}</span>
            <span className="ml-1">ISK</span>
          </div>
        </div>
      </a>
    </li>
  );
}

function freshnessLabel(iso: string): string {
  const min = (Date.now() - new Date(iso).getTime()) / 60000;
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${Math.round(min)}min`;
  return `il y a ${(min / 60).toFixed(1)}h`;
}
