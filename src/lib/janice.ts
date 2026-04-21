/**
 * Appraisal d'items EVE Online — ESI + Fuzzwork.
 *
 * 1. Parse le copier-coller EVE (nom + quantité)
 * 2. Résout les noms → typeIDs via ESI public (POST /universe/ids/)
 * 3. Récupère les prix Jita via Fuzzwork (GET /aggregates/)
 *
 * 100% gratuit, aucune clé API requise.
 */

const ESI_BASE = "https://esi.evetech.net/latest";
const FUZZWORK_BASE = "https://market.fuzzwork.co.uk";
/** Jita 4-4 CNAP station ID */
const JITA_STATION = 60003760;
/** Amarr VIII (Oris) - Emperor Family Academy station ID */
const AMARR_STATION = 60008494;

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
  /** Prix unitaire Amarr buy (comparatif) */
  amarrBuy?: number;
  /** Prix total Amarr buy (quantity × amarrBuy) */
  totalAmarrBuy?: number;
}

export interface JaniceAppraisal {
  /** Items parsés et évalués */
  items: JaniceItem[];
  /** Valeur totale Jita buy */
  totalBuyPrice: number;
  /** Valeur totale Jita sell */
  totalSellPrice: number;
  /** Valeur totale Amarr buy (comparatif) */
  totalAmarrBuyPrice: number;
  /** Items non reconnus (noms bruts) */
  failures: string[];
}

// ── Parser du copier-coller EVE ──────────────────────────────────────────────

interface ParsedLine {
  name: string;
  quantity: number;
}

/**
 * Parse le format copier-coller EVE.
 * Supporte plusieurs formats :
 *   - "Tritanium\t5000"           (inventaire, cargo)
 *   - "Tritanium 5000"            (simplifié)
 *   - "Tritanium x5000"           (format x)
 *   - "Tritanium"                 (quantité = 1)
 *   - "5000 Tritanium"            (quantité en premier)
 *   - "Tritanium\t5 000"          (séparateur de milliers FR)
 */
function parseEvePaste(raw: string): ParsedLine[] {
  const lines = raw.split("\n").map((l) => l.trim()).filter(Boolean);
  const results: ParsedLine[] = [];

  for (const line of lines) {
    // Ignorer les lignes qui ressemblent à des headers
    if (/^(name|item|type)\t/i.test(line)) continue;

    // Format tab-separated (inventaire EVE) : "Nom\tQuantité\t..."
    const tabParts = line.split("\t");
    if (tabParts.length >= 2) {
      const name = tabParts[0]!.trim();
      // La quantité peut être en 2e ou dernière colonne selon le contexte
      const qtyStr = tabParts[1]!.trim().replace(/[\s\u00a0.]/g, "").replace(",", "");
      const qty = parseInt(qtyStr, 10);
      if (name && qty > 0) {
        results.push({ name, quantity: qty });
        continue;
      }
    }

    // Format "Nom x1234" ou "Nom x 1234"
    const xMatch = line.match(/^(.+?)\s*x\s*([\d\s\u00a0.,]+)$/i);
    if (xMatch) {
      const name = xMatch[1]!.trim();
      const qty = parseInt(xMatch[2]!.replace(/[\s\u00a0.,]/g, ""), 10);
      if (name && qty > 0) {
        results.push({ name, quantity: qty });
        continue;
      }
    }

    // Format "1234 Nom" (quantité en premier)
    const qtyFirstMatch = line.match(/^([\d\s\u00a0.,]+)\s+(.+)$/);
    if (qtyFirstMatch) {
      const qty = parseInt(qtyFirstMatch[1]!.replace(/[\s\u00a0.,]/g, ""), 10);
      const name = qtyFirstMatch[2]!.trim();
      if (name && qty > 0 && !/^\d/.test(name)) {
        results.push({ name, quantity: qty });
        continue;
      }
    }

    // Format "Nom 1234" (quantité en dernier, séparée par espace)
    const spaceMatch = line.match(/^(.+?)\s+([\d\s\u00a0.,]+)$/);
    if (spaceMatch) {
      const name = spaceMatch[1]!.trim();
      const qty = parseInt(spaceMatch[2]!.replace(/[\s\u00a0.,]/g, ""), 10);
      if (name && qty > 0) {
        results.push({ name, quantity: qty });
        continue;
      }
    }

    // Juste un nom sans quantité → quantité = 1
    if (/^[a-zA-Z]/.test(line)) {
      results.push({ name: line, quantity: 1 });
    }
  }

  // Regrouper les doublons
  const merged = new Map<string, ParsedLine>();
  for (const item of results) {
    const key = item.name.toLowerCase();
    const existing = merged.get(key);
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      merged.set(key, { ...item });
    }
  }

  return Array.from(merged.values());
}

// ── ESI : noms → typeIDs ─────────────────────────────────────────────────────

interface ESIIdResult {
  inventory_types?: Array<{ id: number; name: string }>;
}

async function resolveTypeIds(
  names: string[]
): Promise<{ resolved: Map<string, number>; failures: string[] }> {
  const resolved = new Map<string, number>();
  const failures: string[] = [];

  // ESI accepte max 500 noms par appel
  const BATCH_SIZE = 500;
  for (let i = 0; i < names.length; i += BATCH_SIZE) {
    const batch = names.slice(i, i + BATCH_SIZE);

    const res = await fetch(`${ESI_BASE}/universe/ids/?language=en`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(batch),
    });

    if (!res.ok) {
      console.error("[appraisal] ESI /universe/ids/ erreur", res.status);
      failures.push(...batch);
      continue;
    }

    const data: ESIIdResult = await res.json();
    const found = new Set<string>();

    for (const item of data.inventory_types ?? []) {
      resolved.set(item.name.toLowerCase(), item.id);
      found.add(item.name.toLowerCase());
    }

    // Identifier les noms non résolus
    for (const name of batch) {
      if (!found.has(name.toLowerCase())) {
        failures.push(name);
      }
    }
  }

  return { resolved, failures };
}

// ── Fuzzwork : typeIDs → prix par station ────────────────────────────────────

interface FuzzworkPriceEntry {
  buy: { percentile: string; max: string };
  sell: { percentile: string; min: string };
}

async function fetchPricesForStation(
  typeIds: number[],
  stationId: number
): Promise<Map<number, { buy: number; sell: number }>> {
  const prices = new Map<number, { buy: number; sell: number }>();
  if (typeIds.length === 0) return prices;

  const BATCH_SIZE = 200;
  for (let i = 0; i < typeIds.length; i += BATCH_SIZE) {
    const batch = typeIds.slice(i, i + BATCH_SIZE);
    const ids = batch.join(",");

    const res = await fetch(
      `${FUZZWORK_BASE}/aggregates/?station=${stationId}&types=${ids}`,
      { headers: { Accept: "application/json" } }
    );

    if (!res.ok) {
      console.error("[appraisal] Fuzzwork erreur station", stationId, res.status);
      continue;
    }

    const data: Record<string, FuzzworkPriceEntry> = await res.json();
    for (const [typeIdStr, entry] of Object.entries(data)) {
      const typeId = parseInt(typeIdStr, 10);
      const buy = parseFloat(entry.buy.percentile) || parseFloat(entry.buy.max) || 0;
      const sell = parseFloat(entry.sell.percentile) || parseFloat(entry.sell.min) || 0;
      prices.set(typeId, { buy, sell });
    }
  }

  return prices;
}

// ── Fonction principale ──────────────────────────────────────────────────────

/**
 * Évalue une liste d'items EVE à partir d'un copier-coller.
 * Utilise ESI (résolution noms) + Fuzzwork (prix Jita).
 *
 * @param rawPaste Le texte copié depuis EVE
 * @throws Error si le paste est vide ou si les APIs échouent
 */
export async function appraiseItems(rawPaste: string): Promise<JaniceAppraisal> {
  const trimmed = rawPaste.trim();
  if (!trimmed) {
    throw new Error("Aucun item à évaluer.");
  }

  // 1. Parser le paste
  const parsed = parseEvePaste(trimmed);
  if (parsed.length === 0) {
    throw new Error("Aucun item reconnu dans le texte collé.");
  }

  // 2. Résoudre noms → typeIDs via ESI
  const uniqueNames = [...new Set(parsed.map((p) => p.name))];
  const { resolved, failures } = await resolveTypeIds(uniqueNames);

  // 3. Récupérer les prix Jita + Amarr en parallèle via Fuzzwork
  const typeIds = [...new Set(resolved.values())];
  const [jitaPrices, amarrPrices] = await Promise.all([
    fetchPricesForStation(typeIds, JITA_STATION),
    fetchPricesForStation(typeIds, AMARR_STATION),
  ]);

  // 4. Assembler les résultats
  const items: JaniceItem[] = [];
  let totalBuyPrice = 0;
  let totalSellPrice = 0;
  let totalAmarrBuyPrice = 0;

  for (const line of parsed) {
    const typeId = resolved.get(line.name.toLowerCase());
    if (!typeId) continue;

    const jita = jitaPrices.get(typeId);
    if (!jita) continue;

    const amarr = amarrPrices.get(typeId);

    const item: JaniceItem = {
      typeId,
      name: line.name,
      quantity: line.quantity,
      jitaBuy: jita.buy,
      jitaSell: jita.sell,
      totalBuy: jita.buy * line.quantity,
      totalSell: jita.sell * line.quantity,
      amarrBuy: amarr?.buy,
      totalAmarrBuy: amarr ? amarr.buy * line.quantity : undefined,
    };

    items.push(item);
    totalBuyPrice += item.totalBuy;
    totalSellPrice += item.totalSell;
    totalAmarrBuyPrice += item.totalAmarrBuy ?? 0;
  }

  if (items.length === 0 && failures.length > 0) {
    throw new Error("Aucun item reconnu. Vérifie les noms (en anglais) ou le format du copier-coller.");
  }

  return {
    items,
    totalBuyPrice,
    totalSellPrice,
    totalAmarrBuyPrice,
    failures,
  };
}
