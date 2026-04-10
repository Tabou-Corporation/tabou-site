/**
 * Client API Janice — appraisal d'items EVE Online.
 *
 * Janice (janice.e-351.com) évalue des items EVE à partir d'un copier-coller
 * depuis le jeu. Retourne les prix Jita buy/sell en temps réel.
 *
 * Requiert la variable d'environnement JANICE_API_KEY.
 */

const JANICE_BASE = "https://janice.e-351.com/api/rest/v2";

// ── Types ────────────────────────────────────────────────────────────────────

export interface JaniceItem {
  /** Type ID EVE */
  typeId: number;
  /** Nom de l'item */
  name: string;
  /** Quantité */
  quantity: number;
  /** Prix unitaire Jita buy */
  jitaBuy: number;
  /** Prix unitaire Jita sell */
  jitaSell: number;
  /** Prix total Jita buy (quantity × jitaBuy) */
  totalBuy: number;
  /** Prix total Jita sell (quantity × jitaSell) */
  totalSell: number;
}

export interface JaniceAppraisal {
  /** Items parsés et évalués */
  items: JaniceItem[];
  /** Valeur totale Jita buy */
  totalBuyPrice: number;
  /** Valeur totale Jita sell */
  totalSellPrice: number;
  /** Items non reconnus (noms bruts) */
  failures: string[];
}

// ── Client ───────────────────────────────────────────────────────────────────

/**
 * Envoie un paste d'items EVE à l'API Janice et retourne l'évaluation.
 * @param rawPaste Le texte copié depuis EVE (un item par ligne)
 * @throws Error si l'API key est manquante, le paste est vide, ou l'API échoue
 */
export async function appraiseItems(rawPaste: string): Promise<JaniceAppraisal> {
  const apiKey = process.env.JANICE_API_KEY;
  if (!apiKey) {
    throw new Error("JANICE_API_KEY non configurée.");
  }

  const trimmed = rawPaste.trim();
  if (!trimmed) {
    throw new Error("Aucun item à évaluer.");
  }

  const url = new URL(`${JANICE_BASE}/appraisal`);
  url.searchParams.set("market", "2");          // Jita
  url.searchParams.set("designation", "appraisal");
  url.searchParams.set("pricing", "buy");
  url.searchParams.set("pricingVariant", "immediate");
  url.searchParams.set("persist", "false");      // Pas besoin de sauvegarder chez Janice
  url.searchParams.set("compactize", "true");

  const res = await fetch(url.toString(), {
    method: "POST",
    headers: {
      "Content-Type": "text/plain",
      "X-ApiKey": apiKey,
      "Accept": "application/json",
    },
    body: trimmed,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("[janice] API erreur", res.status, text);
    throw new Error(`Janice API erreur (${res.status})`);
  }

  const data = await res.json();

  // Parser la réponse Janice → format interne simplifié
  const items: JaniceItem[] = (data.items ?? []).map((item: Record<string, unknown>) => {
    const itemType = item.itemType as Record<string, unknown> | undefined;
    const immediatePrices = item.immediatePrices as Record<string, unknown> | undefined;

    return {
      typeId:   itemType?.eid as number ?? 0,
      name:     itemType?.name as string ?? "Inconnu",
      quantity: item.amount as number ?? 0,
      jitaBuy:  immediatePrices?.buyPrice as number ?? 0,
      jitaSell: immediatePrices?.sellPrice as number ?? 0,
      totalBuy:  immediatePrices?.buyPriceTotal as number ?? 0,
      totalSell: immediatePrices?.sellPriceTotal as number ?? 0,
    };
  });

  return {
    items,
    totalBuyPrice:  data.immediatePrices?.totalBuyPrice as number ?? 0,
    totalSellPrice: data.immediatePrices?.totalSellPrice as number ?? 0,
    failures: data.failures ?? [],
  };
}
