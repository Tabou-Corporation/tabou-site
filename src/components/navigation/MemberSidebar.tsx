"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Megaphone, Calendar, BookOpen, Users,
  User, FileText, MessageSquare, ExternalLink,
  ClipboardList, Megaphone as MegaphoneIcon, BookPlus, CalendarPlus,
  UsersRound, LayoutGrid, PanelLeft, Shield,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { hasMinRole, canManageRecruitment, parseSpecialties } from "@/types/roles";
import type { UserRole } from "@/types/roles";
import { Badge } from "@/components/ui/Badge";
import { SITE_CONFIG } from "@/config/site";
import { ROLE_LABELS, ROLE_BADGE_VARIANT } from "@/lib/constants/labels";

// ── NavItem ────────────────────────────────────────────────────────────────

interface NavItemProps {
  href: string;
  icon: React.ElementType;
  label: string;
  external?: boolean;
  exact?: boolean;
  badge?: number;
  muted?: boolean;
}

function NavItem({ href, icon: Icon, label, external, exact, badge, muted }: NavItemProps) {
  const pathname = usePathname();
  const isActive = exact
    ? pathname === href
    : pathname === href || (href.length > 7 && pathname.startsWith(href));

  const cls = cn(
    "flex items-center gap-2.5 px-3 py-2 rounded text-sm transition-colors duration-150",
    isActive
      ? "bg-gold/10 text-gold border border-gold/20"
      : muted
        ? "text-text-muted hover:text-text-secondary hover:bg-bg-elevated border border-transparent text-xs"
        : "text-text-secondary hover:text-text-primary hover:bg-bg-elevated border border-transparent"
  );

  const content = (
    <>
      <Icon size={muted ? 13 : 15} className="flex-shrink-0" />
      <span className="flex-1">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="bg-gold text-bg-deep text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none flex-shrink-0">
          {badge}
        </span>
      )}
      {external && (
        <ExternalLink size={10} className="ml-auto text-text-muted opacity-60 flex-shrink-0" />
      )}
    </>
  );

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
        {content}
      </a>
    );
  }

  return <Link href={href} className={cls}>{content}</Link>;
}

// ── Séparateur de section ──────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold tracking-extra-wide uppercase text-text-muted px-3 pt-3 pb-1">
      {children}
    </p>
  );
}

// ── Props partagées ────────────────────────────────────────────────────────

interface SidebarProps {
  pendingCount?: number;
}

// ── MemberSidebar (desktop, fixed) ────────────────────────────────────────

export function MemberSidebar({ pendingCount = 0 }: SidebarProps) {
  const { data: session } = useSession();
  if (!session) return null;

  const role    = (session.user.role ?? "candidate") as UserRole;
  const domains = parseSpecialties(session.user.specialties);

  const isMember      = hasMinRole(role, "member_uz");
  const isOfficer     = hasMinRole(role, "officer");
  const isDirector    = hasMinRole(role, "director");
  const hasRecruiting = canManageRecruitment(role, domains);
  // Officers with content domains can access CMS activities
  const hasContentDomain = isDirector || domains.some((d) => d !== "recruitment");

  return (
    <aside className="hidden lg:flex flex-col fixed top-16 left-0 w-64 h-[calc(100vh-4rem)] bg-bg-deep border-r border-border z-30 overflow-y-auto">

      {/* ── Identité ── */}
      <div className="p-4 border-b border-border-subtle">
        <div className="flex items-center gap-3">
          {session.user.image ? (
            <Image
              src={session.user.image}
              alt={session.user.name ?? "Portrait"}
              width={40}
              height={40}
              className="rounded-full border border-gold/20 flex-shrink-0"
              unoptimized
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-bg-elevated border border-border flex items-center justify-center flex-shrink-0">
              <User size={18} className="text-text-muted" />
            </div>
          )}
          <div className="min-w-0">
            <p className="text-text-primary text-sm font-display font-semibold truncate leading-tight">
              {session.user.name ?? "Pilote"}
            </p>
            <div className="mt-1">
              <Badge variant={ROLE_BADGE_VARIANT[role] ?? "default"} className="text-[10px] px-1.5 py-0">
                {ROLE_LABELS[role] ?? role}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 p-3 space-y-0.5 pb-6">

        {/* Espace membre */}
        <SectionLabel>Membre</SectionLabel>
        <NavItem href="/membre"            icon={LayoutDashboard} label="Tableau de bord" exact />
        {isMember && (
          <>
            <NavItem href="/membre/annonces"   icon={Megaphone}   label="Annonces" />
            <NavItem href="/membre/calendrier" icon={Calendar}    label="Calendrier" />
            <NavItem href="/membre/guides"     icon={BookOpen}    label="Guides" />
            <NavItem href="/membre/annuaire"   icon={Users}       label="Annuaire" />
          </>
        )}
        {role === "candidate" && (
          <NavItem href="/membre/candidature" icon={FileText} label="Ma candidature" />
        )}

        {/* Profil & outils */}
        <div className="border-t border-border-subtle mt-2 pt-1 space-y-0.5">
          <NavItem href="/membre/profil"        icon={User}           label="Mon profil" />
          <NavItem href={SITE_CONFIG.links.discord} icon={MessageSquare} label="Discord" external />
        </div>

        {/* ── Zone Staff ── */}
        {isOfficer && (
          <div className="border-t border-border-subtle mt-2 pt-1 space-y-0.5">
            <SectionLabel>Staff</SectionLabel>

            {hasRecruiting && (
              <NavItem
                href="/staff/candidatures"
                icon={ClipboardList}
                label="Candidatures"
                badge={pendingCount}
              />
            )}

            {/* Actions rapides */}
            <NavItem href="/staff/annonces/new"   icon={MegaphoneIcon} label="+ Annonce"     muted exact />
            <NavItem href="/staff/guides/new"     icon={BookPlus}      label="+ Guide"       muted exact />
            <NavItem href="/staff/calendrier/new" icon={CalendarPlus}  label="+ Événement"   muted exact />
          </div>
        )}

        {/* ── Administration ── */}
        {isDirector && (
          <div className="border-t border-border-subtle mt-2 pt-1 space-y-0.5">
            <SectionLabel>Administration</SectionLabel>
            <NavItem href="/staff/membres"      icon={UsersRound} label="Membres" />
            <NavItem href="/staff/admin"        icon={LayoutGrid} label="Admin"   exact />
            <NavItem href="/staff/admin/contenu" icon={PanelLeft} label="Contenu" />
          </div>
        )}

        {/* Officer avec domaine contenu : accès CMS activités */}
        {isOfficer && !isDirector && hasContentDomain && (
          <div className="border-t border-border-subtle mt-2 pt-1 space-y-0.5">
            <NavItem href="/staff/admin/contenu?tab=activities" icon={PanelLeft} label="Contenu activités" muted exact />
          </div>
        )}

        {/* Officer sans director : lien admin simplifié */}
        {isOfficer && !isDirector && !hasContentDomain && (
          <div className="border-t border-border-subtle mt-2 pt-1 space-y-0.5">
            <NavItem href="/staff/admin" icon={Shield} label="Vue d'ensemble" exact />
          </div>
        )}

      </nav>
    </aside>
  );
}

// ── MemberMobileNav (sticky strip, mobile only) ────────────────────────────

function MobileNavItem({ href, icon: Icon, label, badge, exact }: {
  href: string;
  icon: React.ElementType;
  label: string;
  badge?: number;
  exact?: boolean;
}) {
  const pathname = usePathname();
  const isActive = exact
    ? pathname === href
    : pathname === href || (href.length > 7 && pathname.startsWith(href));

  return (
    <Link
      href={href}
      className={cn(
        "relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded text-[11px] transition-colors whitespace-nowrap",
        isActive ? "text-gold" : "text-text-muted hover:text-text-secondary"
      )}
    >
      <Icon size={15} />
      <span>{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="absolute -top-0.5 -right-0.5 bg-gold text-bg-deep text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center leading-none">
          {badge > 9 ? "9+" : badge}
        </span>
      )}
    </Link>
  );
}

export function MemberMobileNav({ pendingCount = 0 }: SidebarProps) {
  const { data: session } = useSession();
  if (!session) return null;

  const role    = (session.user.role ?? "candidate") as UserRole;
  const domains = parseSpecialties(session.user.specialties);

  const isMember      = hasMinRole(role, "member_uz");
  const isOfficer     = hasMinRole(role, "officer");
  const isDirector    = hasMinRole(role, "director");
  const hasRecruiting = canManageRecruitment(role, domains);

  return (
    <div className="lg:hidden sticky top-16 z-30 bg-bg-deep/95 backdrop-blur border-b border-border overflow-x-auto">
      <div className="flex items-center px-2 py-1 min-w-max">
        <MobileNavItem href="/membre" icon={LayoutDashboard} label="Accueil" exact />
        {isMember && (
          <>
            <MobileNavItem href="/membre/annonces"   icon={Megaphone} label="Annonces" />
            <MobileNavItem href="/membre/calendrier" icon={Calendar}  label="Calendrier" />
            <MobileNavItem href="/membre/guides"     icon={BookOpen}  label="Guides" />
            <MobileNavItem href="/membre/annuaire"   icon={Users}     label="Annuaire" />
          </>
        )}
        {role === "candidate" && (
          <MobileNavItem href="/membre/candidature" icon={FileText} label="Candidature" />
        )}
        <MobileNavItem href="/membre/profil" icon={User} label="Profil" />
        {isOfficer && hasRecruiting && (
          <MobileNavItem
            href="/staff/candidatures"
            icon={ClipboardList}
            label="Candidatures"
            badge={pendingCount}
          />
        )}
        {isDirector && (
          <MobileNavItem href="/staff/admin" icon={LayoutGrid} label="Admin" exact />
        )}
      </div>
    </div>
  );
}
