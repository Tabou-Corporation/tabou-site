/**
 * ─── ZKILLBOARD — Fetcher (API réelle) ───────────────────────────────────────
 *
 * Flux : zkillboard kills → ESI killmails (parallel) → ESI /universe/names bulk
 * Caches : kills 60s · killmails ∞ (immuables) · names 24h
 */

import { ZKILL_CONFIG } from "./config";
import type { KillDisplayEntry, ZkillApiEntry } from "./types";

const ESI = "https://esi.evetech.net/latest";

/** Formate une valeur ISK brute → "450 M" | "1.2 B" */
export function formatIsk(value: number): string {
  if (value >= 1_000_000_000) {
    const b = value / 1_000_000_000;
    return `${b % 1 === 0 ? b : b.toFixed(1)} B`;
  }
  return `${Math.round(value / 1_000_000)} M`;
}

/** Formate une date ISO → temps relatif court */
export function formatTimeAgo(isoDate: string): string {
  const diff = (Date.now() - new Date(isoDate).getTime()) / 1000;
  if (diff < 60)    return "< 1 min";
  if (diff < 3600)  return `${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} h`;
  return `${Math.floor(diff / 86400)} j`;
}

export async function fetchCorpKills(): Promise<KillDisplayEntry[]> {
  try {
    // ── 1. Kills de la corpo (pas les pertes) ──────────────────────────
    const zkillRes = await fetch(
      `${ZKILL_CONFIG.apiUrl}/kills/corporationID/${ZKILL_CONFIG.corpId}/`,
      { next: { revalidate: 60 } }
    );
    if (!zkillRes.ok) throw new Error(`zkill ${zkillRes.status}`);
    const zkillData: ZkillApiEntry[] = await zkillRes.json();
    const entries = zkillData.slice(0, ZKILL_CONFIG.displayCount);

    // ── 2. Détails ESI pour chaque killmail (en parallèle) ─────────────
    const killmails = await Promise.all(
      entries.map(async (entry) => {
        const r = await fetch(
          `${ESI}/killmails/${entry.killmail_id}/${entry.zkb.hash}/`,
          { next: { revalidate: 86400 * 30 } } // immuables
        );
        if (!r.ok) return null;
        return { zkb: entry.zkb, km: await r.json(), id: entry.killmail_id };
      })
    );
    const valid = killmails.filter(Boolean) as NonNullable<typeof killmails[number]>[];

    // ── 3. Résolution des noms en batch (1 appel ESI) ──────────────────
    const typeIds  = [...new Set(valid.map((k) => k.km.victim.ship_type_id))];
    const charIds  = [...new Set(
      valid.map((k) => k.km.victim.character_id).filter(Boolean)
    )];
    const allIds = [...typeIds, ...charIds];

    const namesRes = await fetch(`${ESI}/universe/names/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(allIds),
      next: { revalidate: 86400 },
    });
    const namesArr: { id: number; name: string }[] = namesRes.ok
      ? await namesRes.json()
      : [];
    const nameMap = Object.fromEntries(namesArr.map((n) => [n.id, n.name]));

    // ── 4. Assemblage ──────────────────────────────────────────────────
    return valid.map(({ id, km, zkb }) => ({
      id,
      shipName:   nameMap[km.victim.ship_type_id]  ?? "Vaisseau inconnu",
      shipTypeId: km.victim.ship_type_id,
      victimName: nameMap[km.victim.character_id]  ?? "Pilote inconnu",
      iskValue:   formatIsk(zkb.totalValue),
      timeAgo:    formatTimeAgo(km.killmail_time),
      url:        zkb.url,
    }));

  } catch (err) {
    console.error("[KillFeed] Erreur API:", err);
    return [];
  }
}
