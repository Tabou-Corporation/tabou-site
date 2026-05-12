/**
 * Score de tension V1 — composite explicable, jamais prédictif.
 *
 * Chaque composante ∈ [0, 1]. Pondérations dans WEIGHTS.
 * Le score final est aussi clampé [0, 1].
 *
 * IMPORTANT : si une composante manque (source down), elle vaut `null`
 * et est exclue du calcul + renormalisation des poids restants. Aucune
 * valeur n'est inventée. Le breakdown renvoyé liste explicitement
 * quelles sources ont contribué et lesquelles manquent.
 */

export interface TensionInput {
  /** Kills (ship+pod, 1h glissante) sur ce système, depuis MapSystemActivity. */
  shipKills1h?: number | null;
  /** Moyenne 24h du shipKills, pour comparer la pointe vs baseline. */
  shipKillsAvg24h?: number | null;
  /** NPC kills 1h — proxy d'activité PvE/anomalies sansha. */
  npcKills1h?: number | null;
  /** Jumps 1h, depuis ESI /universe/system_jumps/. */
  shipJumps1h?: number | null;
  /** Moyenne 24h des jumps. */
  shipJumpsAvg24h?: number | null;
  /** Nb de campagnes sov actives sur ce système. */
  activeCampaigns?: number | null;
  /** Nb de structures sov reinforced (vulnérable dans <24h ou en cours). */
  reinforcedStructures?: number | null;
  /** Nb de structures sov présentes (TCU+IHUB). */
  totalStructures?: number | null;
  /** Y a-t-il eu un changement de sov dans les 7 derniers jours ? */
  recentSovChange?: boolean | null;
  /** Age du snapshot le plus ancien parmi les sources (en minutes). */
  oldestSnapshotAgeMin?: number | null;
}

export interface TensionBreakdown {
  score: number;
  components: {
    activity: number | null;
    movement: number | null;
    sov_war: number | null;
    structure: number | null;
    political: number | null;
  };
  recencyModifier: number;
  /** Sources qui ont effectivement contribué (les autres = null = data manquante). */
  contributingSources: string[];
  missingSources: string[];
}

const WEIGHTS = {
  activity: 0.30,
  movement: 0.15,
  sov_war: 0.25,
  structure: 0.20,
  political: 0.10,
} as const;

/** Saturation logarithmique : kills↑ amène vite vers 1, mais sans plafonner brusquement. */
function sat(value: number, halfPoint: number): number {
  if (value <= 0) return 0;
  return value / (value + halfPoint);
}

/**
 * Ratio vs baseline borné [0, 3] puis normalisé. 1 = normal, 3+ = anormal.
 * `minMeaningful` : seuil ABSOLU en dessous duquel comparer current/baseline
 * n'a pas de sens. Ex. 7 jumps vs baseline 2 → ratio 3.5× mathématiquement
 * mais 7 jumps c'est du bruit. Sous le seuil on retombe sur la saturation.
 */
function ratio(current: number, baseline: number, minMeaningful: number): number {
  if (baseline <= 0.5 || current < minMeaningful) {
    return sat(current, minMeaningful);
  }
  const r = current / baseline;
  return Math.min(1, Math.max(0, (r - 1) / 2)); // r=1→0, r=3→1
}

function activityComponent(i: TensionInput): number | null {
  if (i.shipKills1h == null) return null;
  // Saturation absolue + écart à baseline. Seuil "kills significatifs" = 5.
  const abs = sat(i.shipKills1h, 8);
  const rel = i.shipKillsAvg24h != null ? ratio(i.shipKills1h, i.shipKillsAvg24h, 5) : abs;
  return Math.max(abs, rel);
}

function movementComponent(i: TensionInput): number | null {
  if (i.shipJumps1h == null) return null;
  // Seuil "trafic significatif" = 30 jumps/h. En dessous, un spike est juste
  // du bruit (un seul scout qui passe).
  const abs = sat(i.shipJumps1h, 200);
  const rel = i.shipJumpsAvg24h != null ? ratio(i.shipJumps1h, i.shipJumpsAvg24h, 30) : abs;
  return Math.max(abs, rel);
}

function sovWarComponent(i: TensionInput): number | null {
  if (i.activeCampaigns == null) return null;
  // 1 campagne = 0.6, 2+ = 1.
  if (i.activeCampaigns <= 0) return 0;
  if (i.activeCampaigns === 1) return 0.6;
  return 1;
}

function structureComponent(i: TensionInput): number | null {
  if (i.reinforcedStructures == null) return null;
  const total = i.totalStructures ?? 0;
  if (i.reinforcedStructures <= 0) return 0;
  // Au moins 1 reinforced = 0.5 ; tout reinforced = 1.
  if (total <= 0) return 0.5;
  return Math.min(1, 0.5 + (i.reinforcedStructures / total) * 0.5);
}

function politicalComponent(i: TensionInput): number | null {
  if (i.recentSovChange == null) return null;
  return i.recentSovChange ? 0.8 : 0.0;
}

/** Modificateur de fraîcheur : -0.05 si snapshot > 60min, -0.15 si > 6h. */
function recencyModifier(i: TensionInput): number {
  const age = i.oldestSnapshotAgeMin ?? 0;
  if (age > 360) return -0.15;
  if (age > 60) return -0.05;
  return 0;
}

export function computeTension(input: TensionInput): TensionBreakdown {
  const components = {
    activity: activityComponent(input),
    movement: movementComponent(input),
    sov_war: sovWarComponent(input),
    structure: structureComponent(input),
    political: politicalComponent(input),
  };

  let weighted = 0;
  let weightSum = 0;
  const contributing: string[] = [];
  const missing: string[] = [];

  for (const key of Object.keys(WEIGHTS) as Array<keyof typeof WEIGHTS>) {
    const v = components[key];
    if (v == null) {
      missing.push(key);
      continue;
    }
    weighted += v * WEIGHTS[key];
    weightSum += WEIGHTS[key];
    contributing.push(key);
  }

  // Renormalisation : si certaines sources manquent, on garde la même échelle.
  const base = weightSum > 0 ? weighted / weightSum : 0;
  const rec = recencyModifier(input);
  const score = Math.min(1, Math.max(0, base + rec));

  return {
    score,
    components,
    recencyModifier: rec,
    contributingSources: contributing,
    missingSources: missing,
  };
}

/** Catégorie discrète pour la couleur de la carte. */
export type TensionLevel = "calm" | "watch" | "warm" | "hot" | "burning";

export function levelForScore(score: number): TensionLevel {
  if (score < 0.15) return "calm";
  if (score < 0.35) return "watch";
  if (score < 0.55) return "warm";
  if (score < 0.80) return "hot";
  return "burning";
}

export const LEVEL_COLORS: Record<TensionLevel, string> = {
  calm: "#3a8060",
  watch: "#c9a227",
  warm: "#d97706",
  hot: "#dc2626",
  burning: "#9d174d",
};
