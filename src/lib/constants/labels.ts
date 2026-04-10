/**
 * Tables de correspondance centralisées — labels, badges et ordres de tri.
 * Source unique pour toute l'UI : staff + espace membre.
 */

// ─── Statuts de candidature ───────────────────────────────────────────────────

export const STATUS_LABELS: Record<string, string> = {
  PENDING:   "En attente",
  INTERVIEW: "Entretien",
  ACCEPTED:  "Acceptée",
  REJECTED:  "Refusée",
};

export const STATUS_BADGE: Record<string, "muted" | "gold" | "red"> = {
  PENDING:   "muted",
  INTERVIEW: "gold",
  ACCEPTED:  "gold",
  REJECTED:  "red",
};

export const STATUS_ORDER: Record<string, number> = {
  PENDING: 0, INTERVIEW: 1, ACCEPTED: 2, REJECTED: 3,
};

// ─── Rôles utilisateurs ───────────────────────────────────────────────────────

export const ROLE_LABELS: Record<string, string> = {
  candidate:  "Candidat",
  member_uz:  "Urban Zone",
  member:     "Membre",
  officer:    "Officier",
  director:   "Directeur",
  ceo:        "CEO",
  admin:      "Administrateur",
  suspended:  "Suspendu",
};

/** Variante Badge pour chaque rôle (utilise la palette complète du composant Badge). */
export const ROLE_BADGE_VARIANT: Record<string, "muted" | "gold" | "default"> = {
  candidate:  "muted",
  member_uz:  "default",
  member:     "gold",
  officer:    "gold",
  director:   "gold",
  ceo:        "gold",
  admin:      "gold",
  suspended:  "muted",
};

/** Alias simplifié (muted/gold) pour les contextes staff ne nécessitant pas "default". */
export const ROLE_BADGE: Record<string, "muted" | "gold"> = {
  candidate:  "muted",
  member_uz:  "muted",
  member:     "muted",
  officer:    "gold",
  director:   "gold",
  ceo:        "gold",
  admin:      "gold",
  suspended:  "muted",
};

export const ROLE_ORDER: Record<string, number> = {
  admin: 0, ceo: 1, director: 2, officer: 3, member: 4, member_uz: 5, candidate: 6, suspended: 7,
};

// ─── Domaines officier ────────────────────────────────────────────────────────

export const DOMAIN_LABELS: Record<string, string> = {
  pvp:         "PVP",
  pve:         "PVE",
  industry:    "Industrie",
  exploration: "Exploration",
  diplomacy:   "Diplomatie",
  recruitment: "Recrutement",
};

/** @deprecated — utiliser DOMAIN_LABELS */
export const SPECIALTY_LABELS = DOMAIN_LABELS;

// ─── Domaines de contenu (annonces / événements) ─────────────────────────────

export const CONTENT_DOMAIN_LABELS: Record<string, string> = {
  general:     "Général",
  pvp:         "PVP",
  pve:         "PVE",
  industry:    "Industrie",
  exploration: "Exploration",
  diplomacy:   "Diplomatie",
};

// ─── Catégories de guides ─────────────────────────────────────────────────────

export const CATEGORY_LABELS: Record<string, string> = {
  general:     "Général",
  pvp:         "PVP",
  pve:         "PVE",
  fits:        "Fits",
  logistics:   "Logistique",
  industry:    "Industrie",
  exploration: "Exploration",
  diplomacy:   "Diplomatie",
  other:       "Autre",
};

export const CATEGORY_ORDER = [
  "general", "pvp", "pve", "fits", "logistics", "industry", "exploration", "diplomacy", "other",
] as const;

// ─── Marché entre membres ─────────────────────────────────────────────────────

export const LISTING_TYPE_LABELS: Record<string, string> = {
  SELL:     "Vente",
  BUY:      "Achat",
  EXCHANGE: "Échange",
};

export const LISTING_TYPE_BADGE: Record<string, "gold" | "default" | "muted"> = {
  SELL:     "gold",
  BUY:      "default",
  EXCHANGE: "muted",
};

export const LISTING_STATUS_LABELS: Record<string, string> = {
  OPEN:    "En cours",
  SOLD:    "Conclu",
  CLOSED:  "Fermée",
  EXPIRED: "Expirée",
};

export const LISTING_STATUS_BADGE: Record<string, "muted" | "gold" | "red"> = {
  OPEN:    "gold",
  SOLD:    "muted",
  CLOSED:  "muted",
  EXPIRED: "muted",
};

export const OFFER_STATUS_LABELS: Record<string, string> = {
  PENDING:   "En attente",
  ACCEPTED:  "Acceptée",
  REJECTED:  "Refusée",
  WITHDRAWN: "Retirée",
};

export const OFFER_STATUS_BADGE: Record<string, "muted" | "gold" | "red"> = {
  PENDING:   "muted",
  ACCEPTED:  "gold",
  REJECTED:  "red",
  WITHDRAWN: "muted",
};
