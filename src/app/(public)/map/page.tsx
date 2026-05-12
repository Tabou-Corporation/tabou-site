import type { Metadata } from "next";
import { ProvidencePulse } from "@/components/map/ProvidencePulse";
import { PageHeader } from "@/components/layout/PageHeader";
import { getMapState } from "@/lib/map/state";
import { SITE_CONFIG } from "@/config/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Providence Pulse — Carte de situation",
  description:
    "Carte interactive des régions Providence et Catch (EVE Online) : tensions, "
    + "kills, campagnes de souveraineté, structures vulnérables. Données ESI "
    + "publiques + zKillboard, commentaires éditoriaux Tabou.",
  alternates: { canonical: `${SITE_CONFIG.url}/map` },
  openGraph: { url: `${SITE_CONFIG.url}/map` },
};

export default async function MapPage() {
  // Server-side fetch — la DB peut ne pas être migrée encore.
  let initialState = null;
  try {
    initialState = await getMapState();
  } catch (err) {
    console.error("[map/page] initial state failed:", err);
    // Fallback : le client retentera via /api/map/state.
  }

  return (
    <>
      <PageHeader
        eyebrow="Conscience opérationnelle"
        title="Providence Pulse"
        description="Lecture live des régions Providence et Catch : combats actifs, mouvements de flotte, structures sov en danger. Synthèse des sources publiques ESI et zKillboard."
      />
      <ProvidencePulse initialState={initialState} />
    </>
  );
}
