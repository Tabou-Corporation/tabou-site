/**
 * Rôles utilisateur – système complet anticipé dès V0
 *
 * V0/V1 : seul `public` est actif.
 * V2+ : `candidate`, `member` activés via auth.
 * V3+ : `recruiter` activé via pipeline recrutement.
 * V5+ : `officer`, `admin` activés via backoffice.
 */
export type UserRole =
  | "public"
  | "candidate"
  | "member"
  | "recruiter"
  | "officer"
  | "admin";

/**
 * Hiérarchie numérique des rôles (plus grand = plus de permissions).
 * Utile pour les guards conditionnels (`role >= ROLE_LEVEL.member`).
 */
export const ROLE_LEVEL: Record<UserRole, number> = {
  public: 0,
  candidate: 1,
  member: 2,
  recruiter: 3,
  officer: 4,
  admin: 5,
} as const;

/**
 * Vérifie si un rôle possède au moins le niveau requis.
 */
export function hasMinRole(role: UserRole, required: UserRole): boolean {
  return ROLE_LEVEL[role] >= ROLE_LEVEL[required];
}

/**
 * Visibilité d'un contenu selon le rôle.
 * Permet de filtrer les éléments de nav, blocs, pages.
 */
export type ContentVisibility =
  | "public"           // visible par tous
  | "candidate"        // visible par les candidats et +
  | "member"           // visible par les membres authentifiés et +
  | "recruiter"        // visible par les recruteurs et +
  | "officer"          // visible par les officiers et +
  | "admin";           // visible uniquement par les admins

/**
 * Retourne true si le rôle peut voir un contenu avec cette visibilité.
 */
export function canView(role: UserRole, visibility: ContentVisibility): boolean {
  return ROLE_LEVEL[role] >= ROLE_LEVEL[visibility];
}
