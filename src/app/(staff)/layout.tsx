import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { hasMinRole, canManageRecruitment } from "@/types/roles";
import { MainNav } from "@/components/navigation/MainNav";
import { Footer } from "@/components/layout/Footer";
import type { UserRole } from "@/types/roles";

/**
 * Zone STAFF — V7
 *
 * Protection double :
 * 1. Middleware (Edge) : cookie de session présent
 * 2. Ce layout (Server) : rôle >= officer vérifié côté serveur
 *
 * Navigation contextuelle + badge candidatures en attente.
 */
export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const role      = (session.user.role ?? "candidate") as UserRole;
  const specialty = session.user.specialty ?? null;

  if (!hasMinRole(role, "officer")) redirect("/membre");

  const isOfficer      = role === "officer";
  const isDirectorPlus = hasMinRole(role, "director");
  const hasRecruitment = canManageRecruitment(role, specialty);

  // Compteur candidatures PENDING — visible dans la barre
  const pendingCount = hasRecruitment
    ? await prisma.application.count({ where: { status: "PENDING" } })
    : 0;

  return (
    <>
      <MainNav />
      <div className="border-b border-gold/20 bg-gold/5 pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center gap-6 overflow-x-auto">

          {/* Label zone */}
          <span className="text-gold text-xs font-semibold tracking-extra-wide uppercase flex-shrink-0">
            Staff
          </span>

          <nav className="flex items-center gap-1 flex-shrink-0">

            {/* ── Recrutement ── */}
            {hasRecruitment && (
              <Link
                href="/staff/candidatures"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-text-secondary text-xs hover:text-gold hover:bg-gold/5 transition-colors whitespace-nowrap"
              >
                Candidatures
                {pendingCount > 0 && (
                  <span className="bg-gold text-bg-deep text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                    {pendingCount}
                  </span>
                )}
              </Link>
            )}

            {/* ── Actions rapides ── */}
            {(isOfficer || isDirectorPlus) && (
              <>
                <span className="text-border mx-1">·</span>
                <Link href="/staff/annonces/new" className="px-2.5 py-1 rounded text-text-secondary text-xs hover:text-gold hover:bg-gold/5 transition-colors whitespace-nowrap">
                  + Annonce
                </Link>
                <Link href="/staff/guides/new" className="px-2.5 py-1 rounded text-text-secondary text-xs hover:text-gold hover:bg-gold/5 transition-colors whitespace-nowrap">
                  + Guide
                </Link>
                <Link href="/staff/calendrier/new" className="px-2.5 py-1 rounded text-text-secondary text-xs hover:text-gold hover:bg-gold/5 transition-colors whitespace-nowrap">
                  + Événement
                </Link>
              </>
            )}

            {/* ── Administration ── */}
            {isDirectorPlus && (
              <>
                <span className="text-border mx-1">·</span>
                <Link href="/staff/membres" className="px-2.5 py-1 rounded text-text-secondary text-xs hover:text-gold hover:bg-gold/5 transition-colors whitespace-nowrap">
                  Membres
                </Link>
                <Link href="/staff/admin" className="px-2.5 py-1 rounded text-gold text-xs hover:text-gold-light hover:bg-gold/5 transition-colors whitespace-nowrap font-semibold">
                  Admin
                </Link>
                <Link href="/staff/admin/contenu" className="px-2.5 py-1 rounded text-gold/70 text-xs hover:text-gold hover:bg-gold/5 transition-colors whitespace-nowrap">
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
