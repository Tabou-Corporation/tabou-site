/**
 * Rôles Tabou — V6
 * Hiérarchie : suspended < candidate < member_uz < member < officer < director < ceo < admin
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

export type OfficerSpecialty =
  | "pvp"
  | "pve"
  | "industry"
  | "exploration"
  | "communication"
  | "recruitment";

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

/** Catégories de guides autorisées par spécialité */
export const SPECIALTY_GUIDE_CATEGORIES: Record<OfficerSpecialty, string[]> = {
  pvp:           ["pvp", "fits", "general"],
  pve:           ["general"],
  industry:      ["logistics", "general"],
  exploration:   ["general"],
  communication: ["general", "pvp", "logistics", "fits", "other"],
  recruitment:   ["general"],
};

/** Un officer avec cette spécialité peut-il gérer les candidatures ? */
export function canManageRecruitment(role: UserRole, specialty?: string | null): boolean {
  if (hasMinRole(role, "director")) return true;
  return role === "officer" && specialty === "recruitment";
}

/** Un officer avec cette spécialité peut-il créer un guide dans cette catégorie ? */
export function canCreateGuideCategory(
  role: UserRole,
  specialty: string | null | undefined,
  category: string
): boolean {
  if (hasMinRole(role, "director")) return true;
  if (role !== "officer" || !specialty) return false;
  const allowed = SPECIALTY_GUIDE_CATEGORIES[specialty as OfficerSpecialty] ?? [];
  return allowed.includes(category);
}

/** Peut créer des annonces et événements (tout officer+) */
export function canCreateContent(role: UserRole): boolean {
  return hasMinRole(role, "officer");
}

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
