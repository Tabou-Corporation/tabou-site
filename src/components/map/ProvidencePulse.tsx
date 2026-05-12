"use client";

import { useEffect, useState } from "react";
import { Section } from "@/components/blocks/Section";
import { ProvidenceMap } from "./ProvidenceMap";
import { SituationPanel } from "./SituationPanel";
import { SystemPanel } from "./SystemPanel";
import { HallOfFamePanel } from "./HallOfFamePanel";
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

            {/* Option A — carte pleine largeur, SystemPanel en slide-over */}
            <div className="relative h-[72vh] min-h-[580px]">
              <ProvidenceMap
                state={state}
                selectedSystemId={selectedId}
                onSelectSystem={setSelectedId}
              />

              {/* Slide-over drawer — s'ouvre par-dessus la carte sans la réduire */}
              <div
                className={`
                  absolute inset-y-0 right-0 z-20
                  w-full sm:w-[400px]
                  transition-transform duration-300 ease-in-out
                  ${selectedSystem ? "translate-x-0" : "translate-x-full"}
                `}
              >
                {selectedSystem && (
                  <div className="h-full bg-bg-deep/95 border-l border-border shadow-2xl overflow-y-auto backdrop-blur-sm">
                    <SystemPanel
                      system={selectedSystem}
                      onClose={() => setSelectedId(null)}
                    />
                  </div>
                )}
              </div>

              {/* Hint discret quand rien n'est sélectionné */}
              {!selectedSystem && (
                <div className="absolute bottom-4 right-4 pointer-events-none">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-text-muted bg-bg-deep/80 border border-border px-3 py-1.5 rounded">
                    Cliquez sur un système
                  </span>
                </div>
              )}
            </div>

          </div>
        ) : (
          <div className="h-[64vh] min-h-[520px] flex items-center justify-center bg-bg-elevated border border-border rounded-md text-text-muted">
            {error ? `Erreur : ${error}` : "Chargement de la carte…"}
          </div>
        )}
      </Section>

      {/* ── Section 2 : Hall of Fame hero (full-bleed, gère son layout) ── */}
      <HallOfFamePanel />
    </>
  );
}
