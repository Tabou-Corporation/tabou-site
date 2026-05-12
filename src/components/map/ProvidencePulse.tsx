"use client";

import { useEffect, useState } from "react";
import { Section, SectionHeader } from "@/components/blocks/Section";
import { ProvidenceMap } from "./ProvidenceMap";
import { SituationPanel } from "./SituationPanel";
import { SystemPanel } from "./SystemPanel";
import { HallOfFamePanel } from "./HallOfFamePanel";
import { PodiumPreviewStrip, ScrollHint } from "./PodiumPreviewStrip";
import type { MapStateDTO } from "./types";

const POLL_MS = 60_000;

/**
 * Orchestration de la page Providence Pulse, alignée sur le système de design
 * Tabou (Section / Container / SectionHeader).
 *
 *  Section 1 — Situation actuelle (alertes prioritaires) + carte interactive
 *              avec drill-down dans une fenêtre latérale.
 *  Section 2 — Hall of Fame all-time Tabou + Urban Zone (classement pilotes, source zKill stats).
 *
 * Les anciens panneaux (légende, sources externes, timeline géopolitique) ont
 * été retirés : la légende est implicite dans la SituationPanel, la fraîcheur
 * ESI/zKill apparaît en discret dans chaque header de panneau, et la timeline
 * était bruit pur après nettoyage des faux "structure vulnérable".
 */
export function ProvidencePulse({ initialState }: { initialState: MapStateDTO | null }) {
  const [state, setState] = useState<MapStateDTO | null>(initialState);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(initialState ? null : "Pas de données initiales");

  useEffect(() => {
    let cancelled = false;
    async function poll() {
      try {
        const r = await fetch("/api/map/state", { cache: "no-store" });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const data = (await r.json()) as MapStateDTO;
        if (!cancelled) { setState(data); setError(null); }
      } catch (e) {
        if (!cancelled) setError(String(e));
      }
    }
    const id = setInterval(poll, POLL_MS);
    if (!initialState) void poll();
    return () => { cancelled = true; clearInterval(id); };
  }, [initialState]);

  const selectedSystem = state && selectedId != null
    ? state.systems.find((s) => s.system.systemId === selectedId) ?? null
    : null;

  return (
    <>
      {/* ── Section 1 : Situation + carte interactive ─────────────────── */}
      <Section bg="default" spacing="md">
        {state ? (
          <div className="space-y-6">
            <SituationPanel state={state} onPickSystem={setSelectedId} />

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4">
              <div className="h-[64vh] min-h-[520px]">
                <ProvidenceMap
                  state={state}
                  selectedSystemId={selectedId}
                  onSelectSystem={setSelectedId}
                />
              </div>

              <div className="h-[64vh] min-h-[520px]">
                {selectedSystem ? (
                  <SystemPanel
                    system={selectedSystem}
                    onClose={() => setSelectedId(null)}
                  />
                ) : (
                  <aside className="h-full bg-bg-elevated border border-border rounded-md p-6 flex flex-col items-center justify-center text-center">
                    <div className="text-gold text-xs font-semibold tracking-extra-wide uppercase mb-3">
                      Détail système
                    </div>
                    <p className="text-text-secondary text-sm leading-relaxed max-w-xs">
                      Cliquez sur un système de la carte (ou sur une alerte ci-dessus)
                      pour voir tension, sov, structures et combats récents.
                    </p>
                  </aside>
                )}
              </div>
            </div>

            {/* Option E — scroll hint animé en bas de la carte */}
            <ScrollHint targetId="hall-of-fame" />
          </div>
        ) : (
          <div className="h-[64vh] min-h-[520px] flex items-center justify-center bg-bg-elevated border border-border rounded-md text-text-muted">
            {error ? `Erreur : ${error}` : "Chargement de la carte…"}
          </div>
        )}
      </Section>

      {/* Option B — strip podium preview (remplace Separator) */}
      <PodiumPreviewStrip targetId="hall-of-fame" />

      {/* ── Section 2 : Hall of Fame all-time Tabou + Urban Zone ──────── */}
      <Section id="hall-of-fame" bg="surface" spacing="md">
        <SectionHeader
          eyebrow="Hall of Fame"
          headline="Classement all-time — Tabou × Urban Zone"
          description="Classement cumulé des pilotes par kills depuis la création de chaque corporation, toutes régions confondues. Source : zKillboard."
        />
        <HallOfFamePanel />
      </Section>
    </>
  );
}
