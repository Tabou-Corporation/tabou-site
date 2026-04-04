import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { hasMinRole } from "@/types/roles";
import { MainNav } from "@/components/navigation/MainNav";
import { Footer } from "@/components/layout/Footer";
import type { UserRole } from "@/types/roles";

/**
 * Zone STAFF — V3+
 *
 * Protection double :
 * 1. Middleware (Edge) : cookie de session présent
 * 2. Ce layout (Server) : rôle >= recruiter vérifié côté serveur
 *
 * Routes actives en V3 :
 *   /staff/candidatures       → Gestion des candidatures (recruteur+)
 *   /staff/candidatures/[id]  → Détail candidature (recruteur+)
 */
export default async function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const role = (session.user.role ?? "candidate") as UserRole;
  if (!hasMinRole(role, "recruiter")) redirect("/membre");

  return (
    <>
      <MainNav />
      {/* Bandeau zone staff */}
      <div className="border-b border-gold/20 bg-gold/5 pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center gap-6">
          <span className="text-gold text-xs font-semibold tracking-extra-wide uppercase">
            Zone recrutement
          </span>
          <nav className="flex items-center gap-4">
            <Link
              href="/staff/candidatures"
              className="text-text-secondary text-xs hover:text-gold transition-colors"
            >
              Candidatures
            </Link>
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
