import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { hasMinRole, canManageRecruitment } from "@/types/roles";
import { MainNav } from "@/components/navigation/MainNav";
import { Footer } from "@/components/layout/Footer";
import { MemberSidebar, MemberMobileNav } from "@/components/navigation/MemberSidebar";
import type { UserRole } from "@/types/roles";

/**
 * Zone STAFF — V8
 *
 * Même structure de layout que la zone membre :
 * sidebar universelle (membre + staff dans une seule nav).
 * La barre horizontale staff est supprimée.
 */
export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const role      = (session.user.role ?? "candidate") as UserRole;
  const specialty = session.user.specialty ?? null;

  if (!hasMinRole(role, "officer")) redirect("/membre");

  const hasRecruitment = canManageRecruitment(role, specialty);

  const pendingCount = hasRecruitment
    ? await prisma.application.count({ where: { status: "PENDING" } })
    : 0;

  return (
    <>
      <MainNav />
      <MemberSidebar pendingCount={pendingCount} />
      <main className="flex-1 flex flex-col pt-16 lg:pl-64">
        <MemberMobileNav pendingCount={pendingCount} />
        {children}
      </main>
      <div className="lg:pl-64">
        <Footer />
      </div>
    </>
  );
}
