import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { hasMinRole, canManageRecruitment } from "@/types/roles";
import { MainNav } from "@/components/navigation/MainNav";
import { Footer } from "@/components/layout/Footer";
import type { UserRole } from "@/types/roles";

/**
 * Zone STAFF — V6
 *
 * Protection double :
 * 1. Middleware (Edge) : cookie de session présent
 * 2. Ce layout (Server) : rôle >= officer vérifié côté serveur
 *
 * Navigation contextuelle :
 *   officer (recruitment) / director+ : Candidatures
 *   officer+ : + Annonce, + Guide, + Événement
 *   director+ : Membres, Admin, Contenu
 */
export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const role = (session.user.role ?? "candidate") as UserRole;
  const specialty = session.user.specialty ?? null;

  // Accès zone staff : officer ou director+
  if (!hasMinRole(role, "officer")) redirect("/membre");

  const isOfficer = role === "officer";
  const isDirectorPlus = hasMinRole(role, "director");
  const hasRecruitment = canManageRecruitment(role, specialty);

  return (
    <>
      <MainNav />
      <div className="border-b border-gold/20 bg-gold/5 pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center gap-6 overflow-x-auto">
          <span className="text-gold text-xs font-semibold tracking-extra-wide uppercase flex-shrink-0">
            Staff
          </span>
          <nav className="flex items-center gap-4 flex-shrink-0">
            {hasRecruitment && (
              <Link href="/staff/candidatures" className="text-text-secondary text-xs hover:text-gold transition-colors whitespace-nowrap">
                Candidatures
              </Link>
            )}
            {(isOfficer || isDirectorPlus) && (
              <>
                <span className="text-border">·</span>
                <Link href="/staff/annonces/new" className="text-text-secondary text-xs hover:text-gold transition-colors whitespace-nowrap">
                  + Annonce
                </Link>
                <Link href="/staff/guides/new" className="text-text-secondary text-xs hover:text-gold transition-colors whitespace-nowrap">
                  + Guide
                </Link>
                <Link href="/staff/calendrier/new" className="text-text-secondary text-xs hover:text-gold transition-colors whitespace-nowrap">
                  + Événement
                </Link>
              </>
            )}
            {isDirectorPlus && (
              <>
                <span className="text-border">·</span>
                <Link href="/staff/membres" className="text-text-secondary text-xs hover:text-gold transition-colors whitespace-nowrap">
                  Membres
                </Link>
                <Link href="/staff/admin" className="text-gold text-xs hover:text-gold-light transition-colors whitespace-nowrap font-semibold">
                  Admin
                </Link>
                <Link href="/staff/admin/contenu" className="text-gold/80 text-xs hover:text-gold transition-colors whitespace-nowrap">
                  Contenu
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
      <main className="flex-1 flex flex-col">
        {children}
      </main>
      <Footer />
    </>
  );
}
