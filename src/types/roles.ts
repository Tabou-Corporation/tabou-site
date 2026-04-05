/**
 * Rôles Tabou — V8
 * Hiérarchie : suspended < candidate < member_uz < member < officer < director < ceo < admin
 * Officiers multi-domaines : chaque officier peut cumuler plusieurs domaines.
 */
export type UserRole =
  | "admin"
  | "ceo"
  | "director"
  | "officer"
  | "member"
  | "member_uz"
  | "candidate"
  | "suspended";

/** Domaines officier (un officer peut en avoir plusieurs). */
export type OfficerDomain =
  | "pvp"
  | "pve"
  | "industry"
  | "exploration"
  | "diplomacy"
  | "recruitment";

/** Tous les domaines valides (pour validation serveur). */
export const ALL_DOMAINS: OfficerDomain[] = [
  "pvp", "pve", "industry", "exploration", "diplomacy", "recruitment",
];

/** Domaines de contenu (hors recruitment qui est spécial). */
export const CONTENT_DOMAINS: OfficerDomain[] = [
  "pvp", "pve", "industry", "exploration", "diplomacy",
];

export const ROLE_LEVEL: Record<UserRole, number> = {
  admin:     7,
  ceo:       6,
  director:  5,
  officer:   4,
  member:    3,
  member_uz: 2,
  candidate: 1,
  suspended: 0,
};

export function hasMinRole(role: UserRole, required: UserRole): boolean {
  return (ROLE_LEVEL[role] ?? 0) >= (ROLE_LEVEL[required] ?? 0);
}

// ─── Helpers de parsing ──────────────────────────────────────────────────────

/** Parse le champ JSON `specialties` de la DB en tableau de domaines. */
export function parseSpecialties(raw: string | null | undefined): OfficerDomain[] {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr.filter((d: unknown) => ALL_DOMAINS.includes(d as OfficerDomain)) as OfficerDomain[];
  } catch {
    return [];
  }
}

// ─── Permissions par domaine ─────────────────────────────────────────────────

/** Catégories de guides autorisées par domaine. */
export const DOMAIN_GUIDE_CATEGORIES: Record<OfficerDomain, string[]> = {
  pvp:         ["pvp", "fits"],
  pve:         ["pve"],
  industry:    ["industry", "logistics"],
  exploration: ["exploration"],
  diplomacy:   ["diplomacy"],
  recruitment: ["general"],
};

/** Domaines d'événements/annonces autorisés par domaine officer. */
export const DOMAIN_CONTENT_SCOPES: Record<OfficerDomain, string[]> = {
  pvp:         ["pvp"],
  pve:         ["pve"],
  industry:    ["industry"],
  exploration: ["exploration"],
  diplomacy:   ["diplomacy"],
  recruitment: [],  // pas de contenu annonces/events pour recruitment
};

/** Catégories d'activités CMS que chaque domaine peut éditer. */
export const DOMAIN_ACTIVITY_CATEGORIES: Record<OfficerDomain, string[]> = {
  pvp:         ["pvp"],
  pve:         ["pve"],
  industry:    ["industry"],
  exploration: ["exploration"],
  diplomacy:   [],       // pas de section activité "diplomatie" pour l'instant
  recruitment: [],
};

// ─── Fonctions de permission ─────────────────────────────────────────────────

/** Peut gérer le recrutement (candidatures) ? */
export function canManageRecruitment(role: UserRole, domains: OfficerDomain[]): boolean {
  if (hasMinRole(role, "director")) return true;
  return role === "officer" && domains.includes("recruitment");
}

/** Peut créer un guide dans cette catégorie ? */
export function canCreateGuideCategory(
  role: UserRole,
  domains: OfficerDomain[],
  category: string
): boolean {
  if (hasMinRole(role, "director")) return true;
  if (role !== "officer" || domains.length === 0) return false;
  // Merge all allowed categories from all domains
  const allowed = new Set(domains.flatMap((d) => DOMAIN_GUIDE_CATEGORIES[d] ?? []));
  return allowed.has(category);
}

/** Peut créer/éditer une annonce ou un événement dans ce domaine ? */
export function canCreateInDomain(
  role: UserRole,
  domains: OfficerDomain[],
  targetDomain: string
): boolean {
  if (hasMinRole(role, "director")) return true;
  if (role !== "officer" || domains.length === 0) return false;
  if (targetDomain === "general") return false; // general = director+ uniquement
  const allowed = new Set(domains.flatMap((d) => DOMAIN_CONTENT_SCOPES[d] ?? []));
  return allowed.has(targetDomain);
}

/** Peut éditer la section d'activité CMS pour cette catégorie ? */
export function canEditActivityCategory(
  role: UserRole,
  domains: OfficerDomain[],
  activityCategory: string
): boolean {
  if (hasMinRole(role, "director")) return true;
  if (role !== "officer" || domains.length === 0) return false;
  const allowed = new Set(domains.flatMap((d) => DOMAIN_ACTIVITY_CATEGORIES[d] ?? []));
  return allowed.has(activityCategory);
}

/** Peut créer du contenu (officer+) ? */
export function canCreateContent(role: UserRole): boolean {
  return hasMinRole(role, "officer");
}

/** Récupère la liste des domaines d'annonces/events accessibles à cet utilisateur. */
export function getAllowedContentDomains(role: UserRole, domains: OfficerDomain[]): string[] {
  if (hasMinRole(role, "director")) {
    return ["general", "pvp", "pve", "industry", "exploration", "diplomacy"];
  }
  if (role !== "officer") return [];
  return [...new Set(domains.flatMap((d) => DOMAIN_CONTENT_SCOPES[d] ?? []))];
}

/** Récupère toutes les catégories de guides accessibles à cet utilisateur. */
export function getAllowedGuideCategories(role: UserRole, domains: OfficerDomain[]): string[] {
  if (hasMinRole(role, "director")) {
    return ["general", "pvp", "pve", "fits", "logistics", "industry", "exploration", "diplomacy"];
  }
  if (role !== "officer") return [];
  return [...new Set(domains.flatMap((d) => DOMAIN_GUIDE_CATEGORIES[d] ?? []))];
}

// ─── Visibilité contenu ──────────────────────────────────────────────────────

export type ContentVisibility =
  | "public"
  | "candidate"
  | "member_uz"
  | "member"
  | "officer"
  | "director"
  | "ceo"
  | "admin";

export function canView(role: UserRole, visibility: ContentVisibility): boolean {
  if (visibility === "public") return true;
  if (visibility === "admin") return role === "admin";
  const visMap: Record<ContentVisibility, UserRole> = {
    public: "candidate", candidate: "candidate", member_uz: "member_uz",
    member: "member", officer: "officer", director: "director",
    ceo: "ceo", admin: "admin",
  };
  return hasMinRole(role, visMap[visibility] ?? "admin");
}
