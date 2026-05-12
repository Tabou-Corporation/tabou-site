"use client";

import { useMemo } from "react";
import type { MapStateDTO } from "./types";

/**
 * SituationPanel — répond à "il se passe quoi maintenant à Providence/Catch ?".
 * Synthèse en langage naturel des sources ESI ; ne montre QUE ce qui mérite
 * attention, sinon affiche un état "calme" honnête.
 *
 * Priorité :
 *  1. Campagne sov active        (alert · rouge)
 *  2. Combat actif (kills ≥ 5)   (alert · rouge)
 *  3. Combat modéré (kills 2-4)  (warn · ambre)
 *  4. Trafic intense (≥150 jumps) (info · cyan)
 */

interface Alert {
  kind: "alert" | "warn" | "info";
  icon: string;
  title: string;
  body: string;
  systemId: number | null;
  sortKey: number;
}

const SIGNIFICANT_KILLS = 5;
const MODERATE_KILLS = 2;
const HIGH_TRAFFIC = 150;

function buildAlerts(state: MapStateDTO): Alert[] {
  const alerts: Alert[] = [];
  const inRegion = state.systems.filter((s) => s.system.inRegion);

  // 1. Campagnes sov actives
  for (const s of inRegion) {
    if (s.activeCampaigns > 0) {
      alerts.push({
        kind: "alert",
        icon: "🛡",
        title: `Campagne sov · ${s.system.name}`,
        body: `${s.activeCampaigns} structure${s.activeCampaigns > 1 ? "s" : ""} sous attaque coordonnée`,
        systemId: s.system.systemId,
        sortKey: 0,
      });
    }
  }

  // 2. Combats actifs (kills ≥ 5)
  const hotFights = inRegion
    .filter((s) => s.activity && s.activity.shipKills >= SIGNIFICANT_KILLS)
    .sort((a, b) => (b.activity?.shipKills ?? 0) - (a.activity?.shipKills ?? 0));
  for (const s of hotFights) {
    const k = s.activity!.shipKills;
    const avg = s.activity!.shipKillsAvg24h;
    const r = k / Math.max(0.5, avg);
    const ratioTxt = avg > 3 && r >= 1.5 ? ` (×${r.toFixed(1)} vs baseline)` : "";
    alerts.push({
      kind: "alert",
      icon: "⚔",
      title: `Combat actif · ${s.system.name}`,
      body: `${k} kills cette heure${ratioTxt}`,
      systemId: s.system.systemId,
      sortKey: 100 - k,
    });
  }

  // 3. Combat modéré (kills 2-4) — agrégé
  const lukewarm = inRegion
    .filter((s) => s.activity && s.activity.shipKills >= MODERATE_KILLS && s.activity.shipKills < SIGNIFICANT_KILLS)
    .sort((a, b) => (b.activity?.shipKills ?? 0) - (a.activity?.shipKills ?? 0));
  if (lukewarm.length > 0) {
    const names = lukewarm.slice(0, 3).map((s) => s.system.name).join(", ");
    const total = lukewarm.reduce((acc, s) => acc + (s.activity?.shipKills ?? 0), 0);
    alerts.push({
      kind: "warn",
      icon: "🔥",
      title: "Activité PvP modérée",
      body: `${total} kills sur ${lukewarm.length} système${lukewarm.length > 1 ? "s" : ""} — ${names}${lukewarm.length > 3 ? "…" : ""}`,
      systemId: lukewarm[0]?.system.systemId ?? null,
      sortKey: 300,
    });
  }

  // 4. Trafic intense
  const highTraffic = inRegion
    .filter((s) => s.activity && s.activity.shipJumps >= HIGH_TRAFFIC)
    .sort((a, b) => (b.activity?.shipJumps ?? 0) - (a.activity?.shipJumps ?? 0));
  if (highTraffic.length > 0) {
    const top = highTraffic.slice(0, 3);
    const names = top.map((s) => `${s.system.name} (${s.activity!.shipJumps})`).join(" · ");
    alerts.push({
      kind: "info",
      icon: "🚀",
      title: "Trafic intense",
      body: `${names} — mouvement de flotte probable`,
      systemId: top[0]?.system.systemId ?? null,
      sortKey: 500,
    });
  }

  return alerts.sort((a, b) => a.sortKey - b.sortKey).slice(0, 4);
}

function summaryHeadline(alerts: Alert[]): string {
  if (alerts.length === 0) return "Calme opérationnel";
  const c = { alert: 0, warn: 0, info: 0 };
  for (const a of alerts) c[a.kind] += 1;
  const parts: string[] = [];
  if (c.alert > 0) parts.push(`${c.alert} alerte${c.alert > 1 ? "s" : ""}`);
  if (c.warn > 0) parts.push(`${c.warn} avertissement${c.warn > 1 ? "s" : ""}`);
  if (c.info > 0) parts.push(`${c.info} signal${c.info > 1 ? "aux" : ""}`);
  return parts.join(" · ");
}

function freshness(state: MapStateDTO): string {
  const newest = state.health.newestFetchedAt;
  if (!newest) return "";
  const min = (Date.now() - new Date(newest).getTime()) / 60_000;
  if (min < 1) return "ESI · maintenant";
  if (min < 60) return `ESI · il y a ${Math.round(min)}min`;
  return `ESI · il y a ${(min / 60).toFixed(1)}h`;
}

const TONE = {
  alert: {
    border: "border-red-500/50",
    bg: "bg-red-500/5",
    dot: "bg-red-500",
    title: "text-red-300",
  },
  warn: {
    border: "border-amber-500/40",
    bg: "bg-amber-500/5",
    dot: "bg-amber-400",
    title: "text-amber-200",
  },
  info: {
    border: "border-sky-400/40",
    bg: "bg-sky-400/5",
    dot: "bg-sky-400",
    title: "text-sky-200",
  },
} as const;

export function SituationPanel({
  state,
  onPickSystem,
}: {
  state: MapStateDTO;
  onPickSystem: (id: number | null) => void;
}) {
  const alerts = useMemo(() => buildAlerts(state), [state]);
  const headline = useMemo(() => summaryHeadline(alerts), [alerts]);
  const fresh = useMemo(() => freshness(state), [state]);
  const hasAlert = alerts.some((a) => a.kind === "alert");
  const statusDot = hasAlert ? "bg-red-500 animate-pulse" : alerts.length > 0 ? "bg-amber-400" : "bg-emerald-500";

  return (
    <section className="bg-bg-elevated border border-border rounded-md">
      <header className="px-5 py-4 border-b border-border flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-gold text-[10px] font-semibold tracking-extra-wide uppercase mb-1.5">
            Situation actuelle
          </p>
          <div className="flex items-center gap-2.5">
            <span className={`w-2.5 h-2.5 rounded-full ${statusDot} shrink-0`} />
            <h2 className="font-display text-xl sm:text-2xl text-text-primary leading-tight truncate">
              {headline}
            </h2>
          </div>
        </div>
        {fresh && (
          <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted shrink-0 mt-1">
            {fresh}
          </span>
        )}
      </header>

      <div className="p-5">
        {alerts.length === 0 ? (
          <p className="text-text-secondary text-sm leading-relaxed">
            Aucun combat actif, aucune campagne sov en cours, trafic normal sur les pipes.
            Les données sont collectées en continu — toute escalade apparaîtra ici en premier.
          </p>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {alerts.map((a, i) => {
              const tone = TONE[a.kind];
              const clickable = a.systemId != null;
              return (
                <li key={`${a.title}-${i}`}>
                  <button
                    type="button"
                    disabled={!clickable}
                    onClick={() => a.systemId != null && onPickSystem(a.systemId)}
                    className={`w-full text-left rounded-md border ${tone.border} ${tone.bg} px-4 py-3 flex items-start gap-3 transition-all ${
                      clickable ? "hover:bg-opacity-15 hover:border-opacity-70 cursor-pointer" : "cursor-default"
                    }`}
                  >
                    <span className="text-lg leading-none mt-0.5" aria-hidden>{a.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-semibold ${tone.title} truncate`}>
                        {a.title}
                      </div>
                      <div className="text-xs text-text-secondary leading-snug mt-0.5">
                        {a.body}
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
