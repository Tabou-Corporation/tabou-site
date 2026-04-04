import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { MainNav } from "@/components/navigation/MainNav";
import { Footer } from "@/components/layout/Footer";
import { MemberSidebar, MemberMobileNav } from "@/components/navigation/MemberSidebar";

/**
 * Layout zone membre — V3
 *
 * Double protection :
 * 1. Middleware (Edge) : redirection rapide avant le rendu
 * 2. Ce layout (Server) : vérification côté serveur en rendu SSR
 *
 * Navigation : sidebar fixe desktop + strip mobile horizontal.
 */
export default async function MemberLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session) redirect("/login");
  if (session.user.role === "suspended") redirect("/login?error=suspended");

  return (
    <>
      <MainNav />
      {/* Sidebar desktop fixe — lg+ seulement */}
      <MemberSidebar />
      <main className="flex-1 flex flex-col pt-16 lg:pl-64">
        {/* Strip navigation mobile — sticky sous la MainNav */}
        <MemberMobileNav />
        {children}
      </main>
      <div className="lg:pl-64">
        <Footer />
      </div>
    </>
  );
}
