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

// ─── Spécialités officer ───────────────────────────────────────────────────────

export const SPECIALTY_LABELS: Record<string, string> = {
  pvp:           "PvP",
  pve:           "PvE",
  industry:      "Industrie",
  exploration:   "Exploration",
  communication: "Communication",
  recruitment:   "Recrutement",
};

// ─── Catégories de guides ─────────────────────────────────────────────────────

export const CATEGORY_LABELS: Record<string, string> = {
  general:   "Général",
  pvp:       "PvP",
  logistics: "Logistique",
  fits:      "Fits",
  other:     "Autre",
};

export const CATEGORY_ORDER = ["general", "pvp", "logistics", "fits", "other"] as const;
