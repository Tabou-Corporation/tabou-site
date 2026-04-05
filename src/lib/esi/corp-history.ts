/**
 * ESI — historique de corporation d'un personnage.
 *
 * Toutes les requêtes sont mises en cache 1h (revalidate: 3600).
 * Les endpoints utilisés sont publics (aucun scope requis).
 */

import { cache } from "react";

const ESI_BASE = "https://esi.evetech.net/latest";

interface EsiCorpHistoryEntry {
  corporation_id: number;
  start_date: string;
  record_id: number;
  is_deleted?: boolean;
}

interface EsiCorporation {
  name: string;
  ticker: string;
}

export interface CorpHistoryEntry {
  corporationId: number;
  name: string;
  ticker: string;
  startDate: Date;
  isDeleted: boolean;
}

/** Récupère le nom et le ticker d'une corporation (cache React 1h). */
const fetchCorpInfo = cache(async (corpId: number): Promise<EsiCorporation | null> => {
  try {
    const res = await fetch(`${ESI_BASE}/corporations/${corpId}/`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return await res.json() as EsiCorporation;
  } catch {
    return null;
  }
});

/**
 * Retourne les 10 dernières corporations d'un personnage, les plus récentes en premier.
 * Retourne [] en cas d'erreur ou de characterId absent.
 */
export async function fetchCorpHistory(characterId: string): Promise<CorpHistoryEntry[]> {
  try {
    const res = await fetch(`${ESI_BASE}/characters/${characterId}/corporationhistory/`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];

    const raw = await res.json() as EsiCorpHistoryEntry[];

    // Trier par record_id décroissant (plus récent en premier), prendre les 10 premiers
    const sorted = raw
      .sort((a, b) => b.record_id - a.record_id)
      .slice(0, 10);

    // Résoudre les noms en parallèle
    const entries = await Promise.all(
      sorted.map(async (entry) => {
        const info = await fetchCorpInfo(entry.corporation_id);
        return {
          corporationId: entry.corporation_id,
          name:          info?.name   ?? `Corp #${entry.corporation_id}`,
          ticker:        info?.ticker ?? "???",
          startDate:     new Date(entry.start_date),
          isDeleted:     entry.is_deleted ?? false,
        };
      })
    );

    return entries;
  } catch {
    return [];
  }
}
