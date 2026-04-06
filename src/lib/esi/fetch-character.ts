/**
 * ESI — fetch sécurisé d'un personnage EVE Online.
 *
 * Retourne `null` en cas d'erreur (timeout, ESI down, réponse invalide).
 * Règle d'or : null = "on ne sait pas", jamais "pas de corporation".
 * L'appelant ne doit JAMAIS écraser un corporationId valide avec null.
 */

const ESI_BASE    = "https://esi.evetech.net/latest";
const ESI_TIMEOUT = 5_000;

export interface EsiCharacterInfo {
  corporationId: number;
  securityStatus: number;
}

/**
 * Récupère corporation_id et security_status d'un personnage.
 * Retourne null si la requête échoue pour quelque raison que ce soit.
 */
export async function fetchCharacterInfo(
  characterId: string,
): Promise<EsiCharacterInfo | null> {
  try {
    const res = await fetch(`${ESI_BASE}/characters/${characterId}/`, {
      signal: AbortSignal.timeout(ESI_TIMEOUT),
      // Pas de next.revalidate — utilisé dans un cron, pas un RSC
    });

    if (!res.ok) return null;

    const data = (await res.json()) as {
      corporation_id?: number;
      security_status?: number;
    };

    if (typeof data.corporation_id !== "number") return null;

    return {
      corporationId: data.corporation_id,
      securityStatus: data.security_status ?? 0,
    };
  } catch {
    return null;
  }
}
