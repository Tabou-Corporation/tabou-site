/**
 * GET /api/map/sov — proxy ESI sovereignty/map filtré aux systèmes Providence + adj.
 *
 * - Pas d'appel ESI direct côté browser (règle: tout passe par le backend).
 * - Cache ESI partagé avec les workers (sovereignty.ts).
 * - Résolution des noms d'alliances via POST /universe/names/, cachée 24h.
 */

import { NextResponse } from "next/server";
import { esiFetch } from "@/lib/map/esi/cache";
import { SDE_SYSTEM_IDS } from "@/lib/map/sde";
import {
  FACTION_COLOR,
  ALLIANCE_PALETTE,
  CVA_ALLIANCE_ID,
  CVA_COLOR,
  FORCED_ALLIANCE_COLORS,
  OTHERS_COLOR,
} from "@/lib/map/sov-palette";

export const dynamic = "force-dynamic";

interface EsiSov {
  system_id: number;
  alliance_id?: number;
  corporation_id?: number;
  faction_id?: number;
}

interface EsiName { id: number; name: string; category: string }

const URL_SOV = "https://esi.evetech.net/latest/sovereignty/map/";
const URL_NAMES = "https://esi.evetech.net/latest/universe/names/";

/**
 * Cache mémoire process-level de la réponse sov calculée.
 * Évite de relire le blob ESI en DB + refaire le POST names à chaque appel.
 * TTL 5min — la sov EVE bouge très lentement.
 */
let sovMemo: { payload: unknown; ts: number } | null = null;
const SOV_MEMO_TTL_MS = 5 * 60 * 1000;

export async function GET() {
  // Court-circuit mémoire — zéro lecture DB sur container chaud
  if (sovMemo && Date.now() - sovMemo.ts < SOV_MEMO_TTL_MS) {
    return NextResponse.json(sovMemo.payload, {
      headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=600" },
    });
  }

  const sovRes = await esiFetch<EsiSov[]>(URL_SOV, 3600);
  if (!sovRes.data) {
    return NextResponse.json(
      { error: "Sov data unavailable", reason: sovRes.error ?? null },
      { status: 503 },
    );
  }

  const interesting = new Set(SDE_SYSTEM_IDS);
  const filtered = sovRes.data.filter((r) => interesting.has(r.system_id));

  // Resoudre les noms d'alliances présentes
  const allianceIds = [...new Set(filtered.map((r) => r.alliance_id).filter((id): id is number => !!id))];
  const allianceCount = new Map<number, number>();
  for (const r of filtered) if (r.alliance_id) allianceCount.set(r.alliance_id, (allianceCount.get(r.alliance_id) ?? 0) + 1);

  const nameMap: Record<number, string> = {};
  if (allianceIds.length > 0) {
    try {
      const namesRes = await fetch(URL_NAMES, {
        method: "POST",
        headers: { "Content-Type": "application/json", "User-Agent": "Tabou-ProvidencePulse/1.0" },
        body: JSON.stringify(allianceIds),
        signal: AbortSignal.timeout(8000),
      });
      if (namesRes.ok) {
        const arr = (await namesRes.json()) as EsiName[];
        for (const n of arr) nameMap[n.id] = n.name;
      }
    } catch { /* names decorative */ }
  }

  // Top alliances trié desc, couleurs forcées (CVA + Red Alliance) prioritaires
  const sortedIds = [...allianceCount.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id);
  const allianceColor: Record<number, string> = { ...FORCED_ALLIANCE_COLORS };
  let idx = 0;
  for (const id of sortedIds) {
    if (allianceColor[id]) continue;
    if (idx >= ALLIANCE_PALETTE.length) break;
    allianceColor[id] = ALLIANCE_PALETTE[idx++]!;
  }

  const alliances = sortedIds.map((id) => ({
    id,
    name: nameMap[id] ?? `Alliance ${id}`,
    count: allianceCount.get(id) ?? 0,
    color: allianceColor[id] ?? OTHERS_COLOR,
    isCva: id === CVA_ALLIANCE_ID,
  }));

  const sov: Record<number, { allianceId: number | null; corporationId: number | null; factionId: number | null }> = {};
  for (const r of filtered) {
    sov[r.system_id] = {
      allianceId: r.alliance_id ?? null,
      corporationId: r.corporation_id ?? null,
      factionId: r.faction_id ?? null,
    };
  }

  const payload = {
    sov,
    alliances,
    cvaSystems: filtered.filter((r) => r.alliance_id === CVA_ALLIANCE_ID).map((r) => r.system_id),
    factionColors: Object.fromEntries(FACTION_COLOR),
    othersColor: OTHERS_COLOR,
    cvaColor: CVA_COLOR,
    fromCache: sovRes.fromCache,
    fetchedAt: new Date().toISOString(),
  };

  sovMemo = { payload, ts: Date.now() };

  return NextResponse.json(payload, {
    headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=600" },
  });
}
