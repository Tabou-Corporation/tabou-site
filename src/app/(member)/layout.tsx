import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { MainNav } from "@/components/navigation/MainNav";
import { Footer } from "@/components/layout/Footer";

/**
 * Layout zone membre — V2
 *
 * Double protection :
 * 1. Middleware (Edge) : redirection rapide avant le rendu
 * 2. Ce layout (Server) : vérification côté serveur en rendu SSR
 *
 * En V4 : ajouter une sidebar membre avec navigation contextuelle.
 */
export default async function MemberLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session) {
    redirect("/auth/login");
  }

  return (
    <>
      <MainNav />
      <main className="flex-1 flex flex-col pt-16">
        {children}
      </main>
      <Footer />
    </>
  );
}
