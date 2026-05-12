"use client";

import { X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { MapSystemDTO, MapEventDTO } from "./types";

/**
 * SystemPanel — répond à "qu'est-ce qui se passe SUR ce système ?".
 * Chaque section répond à une question concrète d'un pilote, en langage naturel.
 * Pas de dump JSON, pas d'IDs bruts, pas de timestamps ISO.
 */

interface Props {
  system: MapSystemDTO;
  onClose: () => void;
}

interface StructureRow {
  structureId: string;
  systemId: number;
  allianceId: number | null;
  structureTypeId: number;
  vulnerableStartUtc: string | null;
  vulnerableEndUtc: string | null;
}

interface CampaignRow {
  campaignId: number;
  eventType: string;
  startTime: string;
  defenderId: number | null;
}

interface DetailPayload {
  system: MapSystemDTO;
  structures: StructureRow[];
  campaigns: CampaignRow[];
  events: MapEventDTO[];
  comments: Array<{ id: string; body: string; pinned: boolean; createdAt: string }>;
  pins: Array<{ id: string; label: string; kind: string; note: string | null }>;
}

interface SovInfo {
  alliances: Array<{ id: number; name: string }>;
}

interface KillSummary {
  killId: number;
  killTime: string;
  victim: {
    shipTypeId: number;
    shipName: string;
    allianceId: number | null;
    allianceName: string | null;
  };
  attackers: {
    count: number;
    primaryAllianceId: number | null;
    primaryAllianceName: string | null;
  };
  totalValue: number;
  npc: boolean;
  solo: boolean;
  zkillUrl: string;
}

interface KillsPayload {
  systemId: number;
  kills: KillSummary[];
  fromCache: boolean;
}

// IHUB = 32458, TCU = 32226 (sov structures)
const STRUCTURE_LABELS: Record<number, string> = {
  32458: "IHUB",
  32226: "TCU",
};
function structureLabel(typeId: number): string {
  return STRUCTURE_LABELS[typeId] ?? `Structure #${typeId}`;
}

const REINFORCE_MIN_AHEAD_MS = 20 * 3600 * 1000;

function formatIsk(value: number): string {
  if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B ISK`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(0)}M ISK`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(0)}k ISK`;
  return `${value.toFixed(0)} ISK`;
}

function diffHuman(ms: number): string {
  const abs = Math.abs(ms);
  const h = Math.floor(abs / 3600000);
  const m = Math.floor((abs % 3600000) / 60000);
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h${String(m).padStart(2, "0")}`;
}

const LEVEL_LABELS = {
  calm: { txt: "Calme", icon: "🟢", color: "text-emerald-400" },
  watch: { txt: "À surveiller", icon: "🟡", color: "text-amber-300" },
  warm: { txt: "Activité PvP", icon: "🟠", color: "text-orange-300" },
  hot: { txt: "Combat actif", icon: "🔴", color: "text-red-400" },
  burning: { txt: "Brûlant", icon: "🔥", color: "text-red-500" },
} as const;

function activityPhrase(s: MapSystemDTO): { headline: string; sub: string } {
  if (!s.activity) {
    return { headline: "Pas de données d'activité ESI", sub: "Le worker n'a pas encore tourné." };
  }
  const { shipKills, shipJumps, shipKillsAvg24h, podKills, npcKills } = s.activity;

  let headline: string;
  if (shipKills === 0) headline = "Aucun kill cette heure";
  else if (shipKills === 1) headline = "1 kill cette heure";
  else headline = `${shipKills} kills cette heure`;

  // Ratio vs baseline si pertinent
  const meaningful = shipKills >= 5 && shipKillsAvg24h > 3;
  if (meaningful) {
    const ratio = shipKills / Math.max(0.5, shipKillsAvg24h);
    if (ratio >= 1.5) headline += ` (×${ratio.toFixed(1)} baseline)`;
  }

  // Trafic narratif
  let traffic: string;
  if (shipJumps === 0) traffic = "aucun trafic";
  else if (shipJumps < 20) traffic = `${shipJumps} jumps, faible trafic`;
  else if (shipJumps < 80) traffic = `${shipJumps} jumps, trafic modéré`;
  else if (shipJumps < 200) traffic = `${shipJumps} jumps, trafic élevé`;
  else traffic = `${shipJumps} jumps, trafic intense`;

  // Détails secondaires
  const bits: string[] = [traffic];
  if (podKills > 0) bits.push(`${podKills} pod${podKills > 1 ? "s" : ""}`);
  if (npcKills >= 50) bits.push(`${npcKills} NPC kills (ratting)`);

  return { headline, sub: bits.join(" · ") };
}

function structurePhrase(s: StructureRow, allianceName: string | null): { state: string; detail: string; severity: "calm" | "warn" | "alert" } {
  const label = structureLabel(s.structureTypeId);
  const owner = allianceName ? ` (${allianceName})` : "";
  const now = Date.now();

  if (!s.vulnerableStartUtc) {
    return { state: `${label}${owner}`, detail: "Pas de fenêtre annoncée.", severity: "calm" };
  }
  const start = new Date(s.vulnerableStartUtc).getTime();
  const end = s.vulnerableEndUtc ? new Date(s.vulnerableEndUtc).getTime() : start + 3600 * 1000;
  const aheadMs = start - now;

  if (aheadMs > REINFORCE_MIN_AHEAD_MS) {
    // Vraiment reinforced
    return {
      state: `${label}${owner} — EN REINFORCED`,
      detail: `Fenêtre finale dans ${diffHuman(aheadMs)}.`,
      severity: "alert",
    };
  }
  if (aheadMs > 0) {
    // Fenêtre quotidienne à venir
    return {
      state: `${label}${owner}`,
      detail: `Prochaine fenêtre dans ${diffHuman(aheadMs)}.`,
      severity: "calm",
    };
  }
  if (end > now) {
    // Actuellement dans la fenêtre
    return {
      state: `${label}${owner} — fenêtre ouverte`,
      detail: `Se referme dans ${diffHuman(end - now)}.`,
      severity: "warn",
    };
  }
  return { state: `${label}${owner}`, detail: "Statut inconnu.", severity: "calm" };
}

function campaignPhrase(c: CampaignRow): { title: string; detail: string } {
  const kind = c.eventType === "ihub_defense" ? "Défense IHUB"
    : c.eventType === "tcu_defense" ? "Défense TCU"
    : c.eventType;
  const since = Date.now() - new Date(c.startTime).getTime();
  return { title: kind, detail: `Démarrée il y a ${diffHuman(since)}.` };
}

/* ─────────────────── Helpers UI ─────────────────── */

/** Petit label inline pour annoter la source + la fenêtre de chaque chiffre. */
function SourceTag({ source, window }: { source: "ESI" | "zKill"; window: string }) {
  return (
    <span className="text-[9px] font-mono uppercase tracking-wider text-text-muted/80 ml-1.5">
      · {source} · {window}
    </span>
  );
}

/** Sparkline kills 3h, 12 buckets de 15min — gauche = -3h, droite = maintenant. */
function SparklineKills({ kills }: { kills: KillSummary[] }) {
  const buckets = useMemo(() => {
    const now = Date.now();
    const arr: number[] = Array.from({ length: 12 }, () => 0);
    for (const k of kills) {
      const ageMin = (now - new Date(k.killTime).getTime()) / 60_000;
      if (ageMin < 0 || ageMin > 180) continue;
      const idx = 11 - Math.floor(ageMin / 15); // 0 = -3h, 11 = maintenant
      if (idx >= 0 && idx < 12) arr[idx] = (arr[idx] ?? 0) + 1;
    }
    return arr;
  }, [kills]);
  const max = Math.max(1, ...buckets);
  const total = buckets.reduce((a, b) => a + b, 0);

  return (
    <div>
      <div className="flex items-end gap-0.5 h-12 mb-1">
        {buckets.map((v, i) => {
          const pct = max > 0 ? (v / max) * 100 : 0;
          const isLastHour = i >= 8; // les 4 derniers buckets = dernière heure
          let bg = "bg-bg-deep";
          if (v > 0) {
            bg = isLastHour ? "bg-gradient-to-t from-red-500/80 to-amber-400/80" : "bg-amber-500/50";
          }
          return (
            <div
              key={i}
              className="flex-1 flex items-end h-full"
              title={`${v} kill${v > 1 ? "s" : ""} · -${(11 - i) * 15} à -${(12 - i) * 15} min`}
            >
              <div
                className={`w-full rounded-t-sm ${bg} transition-all`}
                style={{ height: v === 0 ? "2px" : `${Math.max(10, pct)}%` }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-[9px] font-mono uppercase tracking-wider text-text-muted">
        <span>-3h</span>
        <span>-2h</span>
        <span>-1h</span>
        <span className="text-gold">maintenant</span>
      </div>
      {total > 0 && (
        <p className="mt-2 text-[11px] text-text-secondary">
          <strong className="text-amber-200">{total}</strong> killmail{total > 1 ? "s" : ""} sur 3h ·{" "}
          <strong className="text-amber-200">
            {buckets.slice(8).reduce((a, b) => a + b, 0)}
          </strong>{" "}
          dans la dernière heure
        </p>
      )}
    </div>
  );
}

export function SystemPanel({ system, onClose }: Props) {
  const [detail, setDetail] = useState<DetailPayload | null>(null);
  const [sovInfo, setSovInfo] = useState<SovInfo | null>(null);
  const [kills, setKills] = useState<KillSummary[] | null>(null);
  const [killsLoading, setKillsLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  // Timestamps de fraîcheur pour chaque source
  const [esiFetchedAt, setEsiFetchedAt] = useState<number | null>(null);
  const [zkillFetchedAt, setZkillFetchedAt] = useState<number | null>(null);
  // Tick toutes les 30s pour recalculer la fraîcheur affichée
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setKillsLoading(true);
    setDetail(null);
    setKills(null);
    setEsiFetchedAt(null);
    setZkillFetchedAt(null);
    // Fetch indépendants — sov est rapide (<1s, cache), system détail est lent
    // (~5s getMapState). On affiche le nom d'alliance dès que sov arrive.
    fetch(`/api/map/sov`)
      .then((r) => r.json())
      .then((sov) => { if (!cancelled) setSovInfo(sov as SovInfo); })
      .catch(() => { /* silent */ });
    fetch(`/api/map/system/${system.system.systemId}`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) {
          setDetail(d as DetailPayload);
          setEsiFetchedAt(Date.now());
        }
      })
      .catch(() => { /* keep null */ })
      .finally(() => { if (!cancelled) setLoading(false); });

    // Fetch zKill séparément — peut être lent (3-5s) au premier hit
    fetch(`/api/map/kills/system/${system.system.systemId}`)
      .then((r) => r.json())
      .then((data: KillsPayload) => {
        if (!cancelled) {
          setKills(data.kills ?? []);
          setZkillFetchedAt(Date.now());
        }
      })
      .catch(() => { if (!cancelled) setKills([]); })
      .finally(() => { if (!cancelled) setKillsLoading(false); });
    return () => { cancelled = true; };
  }, [system.system.systemId]);

  const allianceName = useMemo(() => {
    if (!system.sov?.allianceId || !sovInfo) return null;
    return sovInfo.alliances.find((a) => a.id === system.sov!.allianceId)?.name ?? null;
  }, [system.sov, sovInfo]);

  const lvl = LEVEL_LABELS[system.level];
  const act = activityPhrase(system);
  const structures = detail?.structures ?? [];
  const campaigns = detail?.campaigns ?? [];

  // Détection de "présence non-sov" : alliances étrangères impliquées dans des
  // killmails (côté victime OU attaquant primaire). Le sov holder lui-même est
  // exclu, donc dans un système CVA :
  //   - hostiles invasifs apparaissent comme victimes (CVA les dunk)
  //   - hostiles agressifs apparaissent comme attaquants (CVA se fait dunk)
  // On compte les deux côtés ; les victimes pèsent ×2 (mourir sur place implique
  // qu'on est venu y fight, signal plus fort que "j'ai aidé à un kill").
  const hostileAlliances = useMemo(() => {
    if (!kills || kills.length === 0) return [];
    const sovAllianceId = system.sov?.allianceId ?? null;
    const counts = new Map<number, { name: string; weight: number; deaths: number; killsBy: number }>();
    for (const k of kills) {
      // Victime non-sov
      if (k.victim.allianceId && k.victim.allianceId !== sovAllianceId) {
        const aid = k.victim.allianceId;
        const prev = counts.get(aid) ?? { name: k.victim.allianceName ?? `Alliance #${aid}`, weight: 0, deaths: 0, killsBy: 0 };
        prev.weight += 2;
        prev.deaths += 1;
        counts.set(aid, prev);
      }
      // Attaquant primaire non-sov
      const aaid = k.attackers.primaryAllianceId;
      if (aaid && aaid !== sovAllianceId) {
        const prev = counts.get(aaid) ?? { name: k.attackers.primaryAllianceName ?? `Alliance #${aaid}`, weight: 0, deaths: 0, killsBy: 0 };
        prev.weight += 1;
        prev.killsBy += 1;
        counts.set(aaid, prev);
      }
    }
    return [...counts.entries()]
      .map(([id, v]) => ({ id, name: v.name, deaths: v.deaths, killsBy: v.killsBy, weight: v.weight }))
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 3);
  }, [kills, system.sov]);

  // Total ISK détruit dans la fenêtre récente
  const iskDestroyed = useMemo(() => {
    if (!kills) return 0;
    return kills.reduce((acc, k) => acc + (k.totalValue || 0), 0);
  }, [kills]);

  // Events alertants des dernières 24h
  const recentAlerts = useMemo(() => {
    if (!detail?.events) return [];
    const cutoff = Date.now() - 24 * 3600 * 1000;
    return detail.events
      .filter((e) => (e.severity === "alert" || e.severity === "warn")
        && new Date(e.occurredAt).getTime() > cutoff)
      .slice(0, 5);
  }, [detail?.events]);

  // Fraîcheur des données : on prend le timestamp le plus récent et on retombe sur l'autre
  const mostRecent = Math.max(esiFetchedAt ?? 0, zkillFetchedAt ?? 0);
  const freshness = mostRecent > 0 ? diffHuman(Date.now() - mostRecent) : null;

  return (
    <aside className="h-full overflow-y-auto bg-bg-elevated border border-border rounded-md">
      <header className="sticky top-0 bg-bg-elevated/95 backdrop-blur px-5 py-4 border-b border-border z-10">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-gold text-[10px] font-semibold tracking-extra-wide uppercase mb-1">
              Détail système
            </p>
            <h2 className="font-display text-2xl text-text-primary leading-tight truncate">
              {system.system.name}
            </h2>
            <p className="text-xs text-text-muted mt-0.5">
              {system.system.regionName} · sec {system.system.security.toFixed(1)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer le panneau"
            className="p-1.5 hover:bg-bg-deep rounded text-text-secondary transition-colors shrink-0"
          >
            <X size={18} />
          </button>
        </div>
        {/* Chip fraîcheur globale — option 4 */}
        {freshness && (
          <div className="mt-3 flex items-center gap-2 text-[9px] font-mono uppercase tracking-wider text-text-muted">
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-bg-deep border border-border">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              MAJ il y a {freshness}
            </span>
            <span className="text-text-muted/60">
              {esiFetchedAt ? "ESI" : ""}{esiFetchedAt && zkillFetchedAt ? " + " : ""}{zkillFetchedAt ? "zKill" : ""}
            </span>
          </div>
        )}
      </header>

      <div className="p-5 space-y-6 text-sm">
        {/* ━━━ Question 1 : Que se passe-t-il là maintenant ? ━━━ */}
        <section>
          <h3 className="text-gold text-[10px] font-semibold tracking-extra-wide uppercase mb-2">
            État actuel
          </h3>
          <div className="flex items-center gap-2 mb-1.5">
            <span aria-hidden className="text-base">{lvl.icon}</span>
            <span className={`font-semibold ${lvl.color}`}>{lvl.txt}</span>
          </div>
          <p className="text-text-primary leading-snug">
            {act.headline}
            <SourceTag source="ESI" window="1h" />
          </p>
          <p className="text-text-secondary text-xs mt-1 leading-relaxed">{act.sub}</p>
          {hostileAlliances.length > 0 && (
            <p className="text-amber-200 text-xs mt-2 leading-relaxed bg-amber-500/5 border border-amber-500/30 rounded px-2.5 py-1.5">
              Présence détectée : <strong className="text-amber-100">{hostileAlliances[0]!.name}</strong>
              {(() => {
                const h = hostileAlliances[0]!;
                const bits: string[] = [];
                if (h.deaths > 0) bits.push(`${h.deaths} mort${h.deaths > 1 ? "s" : ""}`);
                if (h.killsBy > 0) bits.push(`${h.killsBy} kill${h.killsBy > 1 ? "s" : ""}`);
                return bits.length > 0 ? ` (${bits.join(", ")})` : "";
              })()}
              {hostileAlliances.length > 1 && ` · +${hostileAlliances.length - 1} autre${hostileAlliances.length > 2 ? "s" : ""}`}
              {iskDestroyed > 100_000_000 && ` · ${formatIsk(iskDestroyed)} détruits`}
            </p>
          )}
        </section>

        {/* ━━━ Question 2 : Quand a-t-il pété, et combien ? — Timeline 3h ━━━ */}
        {(killsLoading || (kills && kills.length > 0) || (system.activity?.shipKills ?? 0) > 0) && (() => {
          // Détection du décalage ESI / zKill : ESI 1h annonce X kills mais zKill
          // n'a encore que Y < X killmails sur la dernière heure → délai d'ingestion.
          const esiKills1h = system.activity?.shipKills ?? 0;
          const zkillKills1h = (kills ?? []).filter((k) => {
            const ageMin = (Date.now() - new Date(k.killTime).getTime()) / 60_000;
            return ageMin <= 60;
          }).length;
          const lagDetected = !killsLoading && esiKills1h > zkillKills1h;
          const missing = esiKills1h - zkillKills1h;

          return (
          <section>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gold text-[10px] font-semibold tracking-extra-wide uppercase">
                Activité récente
                <SourceTag source="zKill" window="3h" />
              </h3>
              {kills && kills.length > 0 && (
                <a
                  href={`https://zkillboard.com/system/${system.system.systemId}/`}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-[10px] text-gold/70 hover:text-gold hover:underline"
                >
                  zKill →
                </a>
              )}
            </div>

            {/* Note de décalage ESI ↔ zKill (latence d'ingestion typique 5-15 min) */}
            {lagDetected && (
              <p className="text-[11px] text-amber-300/90 italic bg-amber-500/5 border border-amber-500/20 rounded px-2.5 py-1.5 mb-3 leading-relaxed">
                <span className="not-italic">ⓘ</span> {missing} killmail{missing > 1 ? "s" : ""} annoncé{missing > 1 ? "s" : ""} par ESI mais pas encore indexé{missing > 1 ? "s" : ""} par zKill — latence d&apos;ingestion typique 5-15 min.
              </p>
            )}

            {killsLoading ? (
              <p className="text-xs text-text-muted italic">Chargement depuis zKillboard…</p>
            ) : kills && kills.length === 0 ? (
              <p className="text-xs text-text-muted italic">
                {esiKills1h > 0 ? "Pas encore de killmail indexé sur zKill." : "Pas de kill récent."}
              </p>
            ) : (
              <>
                {/* Sparkline timeline — option 3 */}
                <div className="bg-bg-deep/40 border border-border/50 rounded-md p-3 mb-3">
                  <SparklineKills kills={kills!} />
                </div>

                {/* Liste des 5 derniers killmails */}
                <ul className="space-y-1.5">
                  {kills!.slice(0, 5).map((k) => {
                    const ago = diffHuman(Date.now() - new Date(k.killTime).getTime());
                    const value = formatIsk(k.totalValue);
                    return (
                      <li key={k.killId}>
                        <a
                          href={k.zkillUrl}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="block hover:bg-bg-deep/40 rounded px-2 py-1.5 -mx-2 transition-colors"
                        >
                          <div className="flex items-center justify-between gap-2 text-xs">
                            <span className="text-text-primary truncate">
                              <strong className="text-amber-200">{k.victim.shipName}</strong>
                              {k.victim.allianceName && (
                                <span className="text-text-muted"> ({k.victim.allianceName})</span>
                              )}
                            </span>
                            <span className="text-text-muted shrink-0">il y a {ago}</span>
                          </div>
                          <div className="text-[11px] text-text-secondary truncate mt-0.5">
                            {k.attackers.primaryAllianceName ? (
                              <>par <strong className="text-text-primary">{k.attackers.primaryAllianceName}</strong></>
                            ) : (
                              <>par {k.attackers.count} attaquant{k.attackers.count > 1 ? "s" : ""}</>
                            )}
                            {k.attackers.primaryAllianceName && ` · ${k.attackers.count} attackers`}
                            {" · "}<span className="text-text-muted">{value}</span>
                          </div>
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </section>
          );
        })()}

        {/* ━━━ Question 3 : Qui contrôle, et quelles structures ? ━━━ */}
        <section>
          <h3 className="text-gold text-[10px] font-semibold tracking-extra-wide uppercase mb-2">
            Souveraineté
          </h3>
          {allianceName ? (
            <p className="text-text-primary">{allianceName}</p>
          ) : system.sov?.allianceId ? (
            <p className="text-text-secondary italic text-xs">Alliance #{system.sov.allianceId}</p>
          ) : system.system.inRegion ? (
            <p className="text-text-secondary italic text-xs">Sans souveraineté</p>
          ) : (
            <p className="text-text-secondary italic text-xs">Hors région Providence/Catch</p>
          )}
          {system.recentSovChange && (
            <p className="text-amber-300 text-xs mt-1.5">⚠ Changement de sov dans les 7 derniers jours</p>
          )}

          {/* Structures intégrées dans la même section */}
          {structures.length > 0 && (
            <ul className="space-y-2 mt-3">
              {structures.map((s) => {
                const owner = sovInfo?.alliances.find((a) => a.id === s.allianceId)?.name ?? null;
                const p = structurePhrase(s, owner);
                const tone = p.severity === "alert" ? "text-red-400 border-red-500/50"
                  : p.severity === "warn" ? "text-amber-300 border-amber-500/40"
                  : "text-text-primary border-border";
                return (
                  <li key={s.structureId} className={`border-l-2 pl-3 py-0.5 ${tone}`}>
                    <p className="text-xs font-medium">{p.state}</p>
                    <p className="text-[11px] text-text-secondary mt-0.5">{p.detail}</p>
                  </li>
                );
              })}
            </ul>
          )}

          {/* Campagne sov active intégrée */}
          {system.activeCampaigns > 0 && campaigns.length > 0 && (
            <ul className="space-y-1.5 mt-3">
              {campaigns.map((c) => {
                const p = campaignPhrase(c);
                return (
                  <li key={c.campaignId} className="border-l-2 border-red-500/60 pl-2.5">
                    <p className="text-xs font-medium text-red-400">{p.title}</p>
                    <p className="text-[11px] text-text-secondary">{p.detail}</p>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* ━━━ Notes éditoriales Tabou ━━━ */}
        {detail?.comments && detail.comments.length > 0 && (
          <section>
            <h3 className="text-gold text-[10px] font-semibold tracking-extra-wide uppercase mb-1.5">
              Notes Tabou
            </h3>
            <ul className="space-y-2">
              {detail.comments.map((c) => (
                <li key={c.id} className="text-xs border-l-2 border-gold/50 pl-3 py-0.5">
                  <p className="whitespace-pre-wrap text-text-primary leading-relaxed">{c.body}</p>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* ━━━ Historique alertes 24h ━━━ */}
        {recentAlerts.length > 0 && (
          <section>
            <h3 className="text-gold text-[10px] font-semibold tracking-extra-wide uppercase mb-1.5">
              Historique 24h
            </h3>
            <ul className="space-y-1">
              {recentAlerts.map((e) => {
                const ago = diffHuman(Date.now() - new Date(e.occurredAt).getTime());
                const tone = e.severity === "alert" ? "text-red-400" : "text-amber-300";
                return (
                  <li key={e.id} className="text-xs flex gap-2 items-baseline">
                    <span className={tone}>●</span>
                    <span className="text-text-muted whitespace-nowrap">il y a {ago}</span>
                    <span className="text-text-primary flex-1">{e.title}</span>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {loading && <p className="text-xs text-text-muted">Chargement…</p>}

        {/* Footer sources */}
        <p className="text-[9px] font-mono uppercase tracking-wider text-text-muted/60 pt-3 border-t border-border/40">
          Sources : ESI (compteurs 1h rolling) · zKill (killmails 3h)
        </p>
      </div>
    </aside>
  );
}
