/**
 * ESI — fetch securise d'un personnage EVE Online.
 *
 * Retourne `null` en cas d'erreur (timeout, ESI down, reponse invalide).
 * Regle d'or : null = "on ne sait pas", jamais "pas de corporation".
 * L'appelant ne doit JAMAIS ecraser un corporationId valide avec null.
 *
 * Retry: 3 tentatives avec backoff exponentiel (500ms, 1s, 2s).
 */

const ESI_BASE    = "https://esi.evetech.net/latest";
const ESI_TIMEOUT = 5_000;
const MAX_RETRIES = 3;
const BASE_DELAY  = 500; // ms

export interface EsiCharacterInfo {
  corporationId: number;
  securityStatus: number;
}

/**
 * Recupere corporation_id et security_status d'un personnage.
 * Retourne null si la requete echoue apres 3 tentatives.
 */
export async function fetchCharacterInfo(
  characterId: string,
): Promise<EsiCharacterInfo | null> {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(`${ESI_BASE}/characters/${characterId}/`, {
        signal: AbortSignal.timeout(ESI_TIMEOUT),
      });

      // 4xx = erreur client, pas la peine de retry
      if (res.status >= 400 && res.status < 500) return null;

      // 5xx ou autre = retry
      if (!res.ok) {
        if (attempt < MAX_RETRIES - 1) {
          await sleep(BASE_DELAY * 2 ** attempt);
          continue;
        }
        return null;
      }

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
      // Timeout ou erreur reseau → retry avec backoff
      if (attempt < MAX_RETRIES - 1) {
        await sleep(BASE_DELAY * 2 ** attempt);
        continue;
      }
      return null;
    }
  }
  return null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
