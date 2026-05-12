import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { hasMinRole, type UserRole } from "@/types/roles";
import { MapAdminClient } from "./MapAdminClient";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function MapAdminPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const role = (session.user.role ?? "candidate") as UserRole;
  if (!hasMinRole(role, "officer")) redirect("/membre");

  const [recentEvents, recentComments, pins] = await Promise.all([
    prisma.mapEvent.findMany({
      where: { source: "manual" },
      orderBy: { occurredAt: "desc" },
      take: 30,
    }),
    prisma.mapComment.findMany({ orderBy: { createdAt: "desc" }, take: 30 }),
    prisma.mapPin.findMany({ orderBy: { createdAt: "desc" } }),
  ]).catch(() => [[], [], []] as const);

  return (
    <div className="p-6 space-y-6">
      <header>
        <h1 className="font-display text-2xl text-gold">Providence Pulse — Admin</h1>
        <p className="text-text-secondary text-sm">
          Création d&apos;événements manuels, commentaires éditoriaux, épingles. Lancement de la synchro ESI à la demande.
        </p>
      </header>

      <MapAdminClient
        initialEvents={recentEvents.map((e) => ({
          ...e,
          occurredAt: e.occurredAt.toISOString(),
          createdAt: e.createdAt.toISOString(),
        }))}
        initialComments={recentComments.map((c) => ({
          ...c,
          createdAt: c.createdAt.toISOString(),
          updatedAt: c.updatedAt.toISOString(),
        }))}
        initialPins={pins.map((p) => ({
          ...p,
          createdAt: p.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
