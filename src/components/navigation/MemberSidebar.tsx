"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Megaphone, Calendar, BookOpen,
  Users, User, FileText, Shield, ExternalLink, MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { hasMinRole } from "@/types/roles";
import type { UserRole } from "@/types/roles";
import { Badge } from "@/components/ui/Badge";
import { SITE_CONFIG } from "@/config/site";

// ── Labels ────────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<UserRole, string> = {
  candidate:  "Candidat",
  member_uz:  "Urban Zone",
  member:     "Membre",
  officer:    "Officier",
  director:   "Directeur",
  ceo:        "CEO",
  admin:      "Administrateur",
  suspended:  "Suspendu",
};

const ROLE_BADGE_VARIANT: Record<UserRole, "muted" | "gold" | "default"> = {
  candidate:  "muted",
  member_uz:  "default",
  member:     "gold",
  officer:    "gold",
  director:   "gold",
  ceo:        "gold",
  admin:      "gold",
  suspended:  "muted",
};

// ── NavItem ────────────────────────────────────────────────────────────────

interface NavItemProps {
  href: string;
  icon: React.ElementType;
  label: string;
  external?: boolean;
}

function NavItem({ href, icon: Icon, label, external }: NavItemProps) {
  const pathname = usePathname();
  const isActive =
    pathname === href ||
    (href !== "/membre" && pathname.startsWith(href));

  const cls = cn(
    "flex items-center gap-3 px-3 py-2.5 rounded text-sm transition-colors duration-150",
    isActive
      ? "bg-gold/10 text-gold border border-gold/20"
      : "text-text-secondary hover:text-text-primary hover:bg-bg-elevated border border-transparent"
  );

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
        <Icon size={15} className="flex-shrink-0" />
        <span>{label}</span>
        <ExternalLink size={10} className="ml-auto text-text-muted opacity-60" />
      </a>
    );
  }

  return (
    <Link href={href} className={cls}>
      <Icon size={15} className="flex-shrink-0" />
      <span>{label}</span>
    </Link>
  );
}

// ── MobileNavItem ──────────────────────────────────────────────────────────

function MobileNavItem({ href, icon: Icon, label }: { href: string; icon: React.ElementType; label: string }) {
  const pathname = usePathname();
  const isActive =
    pathname === href ||
    (href !== "/membre" && pathname.startsWith(href));

  return (
    <Link
      href={href}
      className={cn(
        "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded text-[11px] transition-colors whitespace-nowrap",
        isActive ? "text-gold" : "text-text-muted hover:text-text-secondary"
      )}
    >
      <Icon size={15} />
      <span>{label}</span>
    </Link>
  );
}

// ── MemberSidebar (desktop, fixed) ────────────────────────────────────────

export function MemberSidebar() {
  const { data: session } = useSession();
  if (!session) return null;

  const role = (session.user.role ?? "candidate") as UserRole;
  const isMember  = hasMinRole(role, "member_uz");
  const isOfficer = hasMinRole(role, "officer");

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
              <Badge variant={ROLE_BADGE_VARIANT[role]} className="text-[10px] px-1.5 py-0">
                {ROLE_LABELS[role]}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* ── Navigation principale ── */}
      <nav className="flex-1 p-3 space-y-0.5">
        <NavItem href="/membre"            icon={LayoutDashboard} label="Tableau de bord" />

        {isMember && (
          <>
            <NavItem href="/membre/annonces"   icon={Megaphone}       label="Annonces" />
            <NavItem href="/membre/calendrier" icon={Calendar}         label="Calendrier" />
            <NavItem href="/membre/guides"     icon={BookOpen}         label="Guides" />
            <NavItem href="/membre/annuaire"   icon={Users}            label="Annuaire" />
          </>
        )}

        {/* ── Divider ── */}
        <div className="pt-3 mt-3 border-t border-border-subtle space-y-0.5">
          <NavItem href="/membre/profil" icon={User} label="Mon profil" />
          {role === "candidate" && (
            <NavItem href="/membre/candidature" icon={FileText} label="Ma candidature" />
          )}
          <NavItem
            href={SITE_CONFIG.links.discord}
            icon={MessageSquare}
            label="Discord"
            external
          />
        </div>

        {/* ── Zone Staff ── */}
        {isOfficer && (
          <div className="pt-3 mt-3 border-t border-border-subtle space-y-0.5">
            <p className="text-[10px] font-semibold tracking-extra-wide uppercase text-text-muted px-3 pb-1">
              Staff
            </p>
            <NavItem href="/staff/candidatures" icon={Shield} label="Zone Staff" />
          </div>
        )}
      </nav>
    </aside>
  );
}

// ── MemberMobileNav (sticky strip, mobile only) ────────────────────────────

export function MemberMobileNav() {
  const { data: session } = useSession();
  if (!session) return null;

  const role = (session.user.role ?? "candidate") as UserRole;
  const isMember  = hasMinRole(role, "member_uz");
  const isOfficer = hasMinRole(role, "officer");

  return (
    <div className="lg:hidden sticky top-16 z-30 bg-bg-deep/95 backdrop-blur border-b border-border overflow-x-auto">
      <div className="flex items-center px-2 py-1 min-w-max">
        <MobileNavItem href="/membre"            icon={LayoutDashboard} label="Accueil" />
        {isMember && (
          <>
            <MobileNavItem href="/membre/annonces"   icon={Megaphone}   label="Annonces" />
            <MobileNavItem href="/membre/calendrier" icon={Calendar}     label="Calendrier" />
            <MobileNavItem href="/membre/guides"     icon={BookOpen}     label="Guides" />
            <MobileNavItem href="/membre/annuaire"   icon={Users}        label="Annuaire" />
          </>
        )}
        <MobileNavItem href="/membre/profil" icon={User} label="Profil" />
        {role === "candidate" && (
          <MobileNavItem href="/membre/candidature" icon={FileText} label="Candidature" />
        )}
        {isOfficer && (
          <MobileNavItem href="/staff/candidatures" icon={Shield} label="Staff" />
        )}
      </div>
    </div>
  );
}
