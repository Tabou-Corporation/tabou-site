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
};

export const ROLE_BADGE: Record<string, "muted" | "gold"> = {
  candidate:  "muted",
  member_uz:  "muted",
  member:     "muted",
  officer:    "gold",
  director:   "gold",
  ceo:        "gold",
  admin:      "gold",
};

export const ROLE_ORDER: Record<string, number> = {
  admin: 0, ceo: 1, director: 2, officer: 3, member: 4, member_uz: 5, candidate: 6,
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
