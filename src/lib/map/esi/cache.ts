/**
 * Cache ESI conforme aux règles CCP :
 *  - On respecte Expires : tant qu'une entrée est fraîche, on retourne le body en DB
 *    sans contacter ESI.
 *  - Quand on doit revalider, on envoie If-None-Match avec l'ETag. Sur 304, on
 *    prolonge l'expiration sans réécrire le body. Sur 200, on remplace tout.
 *  - User-Agent obligatoire (cf. docs ESI).
 *
 * Retourne { data, fromCache, status, expiresAt }. data est `null` uniquement
 * en cas d'erreur réseau OU 5xx persistante OU body invalide. Jamais inventé.
 */

import { prisma } from "@/lib/db";

const USER_AGENT =
  process.env.ESI_USER_AGENT ?? "Tabou-ProvidencePulse/1.0 (+https://tabou.fr/map)";

const FETCH_TIMEOUT_MS = 10_000;

export interface EsiFetchResult<T> {
  data: T | null;
  fromCache: boolean;
  /** 200 | 304 | -1 (erreur). */
  status: number;
  expiresAt: Date | null;
  error?: string;
}

/**
 * Lit Expires si présent, sinon utilise un fallback en secondes.
 * EVE renvoie typiquement un Expires en RFC1123.
 */
function parseExpires(headers: Headers, fallbackSeconds: number): Date {
  const raw = headers.get("expires");
  if (raw) {
    const d = new Date(raw);
    if (!isNaN(d.getTime())) return d;
  }
  return new Date(Date.now() + fallbackSeconds * 1000);
}

/**
 * Fetch ESI avec cache DB.
 * @param url URL complète ESI (sans paramètres aléatoires).
 * @param fallbackTtlSeconds TTL si l'en-tête Expires manque.
 */
export async function esiFetch<T>(
  url: string,
  fallbackTtlSeconds = 300,
): Promise<EsiFetchResult<T>> {
  // 1. Lookup cache.
  const cached = await prisma.mapEsiCache.findUnique({ where: { url } });
  const now = new Date();

  if (cached && cached.expiresAt > now) {
    try {
      return {
        data: JSON.parse(cached.body) as T,
        fromCache: true,
        status: 200,
        expiresAt: cached.expiresAt,
      };
    } catch {
      // Body corrompu → on tombera dans la revalidation.
    }
  }

  // 2. Revalidation conditionnelle.
  const headers: Record<string, string> = {
    Accept: "application/json",
    "User-Agent": USER_AGENT,
  };
  if (cached?.etag) headers["If-None-Match"] = cached.etag;

  let res: Response;
  try {
    res = await fetch(url, {
      headers,
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      // Pas de cache Next.js — on gère nous-mêmes.
      cache: "no-store",
    });
  } catch (err) {
    // Erreur réseau → on rend le stale si on en a un, marqué fromCache=true.
    if (cached) {
      try {
        return {
          data: JSON.parse(cached.body) as T,
          fromCache: true,
          status: cached.lastStatus,
          expiresAt: cached.expiresAt,
          error: `stale (fetch failed: ${String(err)})`,
        };
      } catch { /* ignore */ }
    }
    return { data: null, fromCache: false, status: -1, expiresAt: null, error: String(err) };
  }

  const expiresAt = parseExpires(res.headers, fallbackTtlSeconds);
  const etag = res.headers.get("etag") ?? cached?.etag ?? null;

  if (res.status === 304 && cached) {
    // Pas de body neuf — on prolonge juste l'expiration.
    await prisma.mapEsiCache.update({
      where: { url },
      data: { expiresAt, etag: etag ?? null, lastStatus: 304 },
    });
    try {
      return {
        data: JSON.parse(cached.body) as T,
        fromCache: true,
        status: 304,
        expiresAt,
      };
    } catch {
      return { data: null, fromCache: false, status: 304, expiresAt: null, error: "cached body invalid" };
    }
  }

  if (!res.ok) {
    // 4xx/5xx — on garde le cache existant si possible.
    if (cached) {
      try {
        return {
          data: JSON.parse(cached.body) as T,
          fromCache: true,
          status: cached.lastStatus,
          expiresAt: cached.expiresAt,
          error: `stale (HTTP ${res.status})`,
        };
      } catch { /* ignore */ }
    }
    return { data: null, fromCache: false, status: res.status, expiresAt: null, error: `HTTP ${res.status}` };
  }

  // 200 : on remplace.
  let body: T;
  try {
    body = (await res.json()) as T;
  } catch (err) {
    return { data: null, fromCache: false, status: 200, expiresAt: null, error: `invalid JSON: ${String(err)}` };
  }

  await prisma.mapEsiCache.upsert({
    where: { url },
    create: {
      url,
      body: JSON.stringify(body),
      etag: etag ?? null,
      expiresAt,
      lastStatus: 200,
    },
    update: {
      body: JSON.stringify(body),
      etag: etag ?? null,
      expiresAt,
      lastStatus: 200,
    },
  });

  return { data: body, fromCache: false, status: 200, expiresAt };
}

/** Indicateur "source health" — agrégation des dernières entrées de cache. */
export async function esiHealth(): Promise<{
  oldestExpiresAt: Date | null;
  newestFetchedAt: Date | null;
  entries: number;
}> {
  const [oldest, newest, entries] = await Promise.all([
    prisma.mapEsiCache.findFirst({ orderBy: { expiresAt: "asc" }, select: { expiresAt: true } }),
    prisma.mapEsiCache.findFirst({ orderBy: { fetchedAt: "desc" }, select: { fetchedAt: true } }),
    prisma.mapEsiCache.count(),
  ]);
  return {
    oldestExpiresAt: oldest?.expiresAt ?? null,
    newestFetchedAt: newest?.fetchedAt ?? null,
    entries,
  };
}
