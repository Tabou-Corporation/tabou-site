import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { hasMinRole } from "@/types/roles";
import { Container } from "@/components/layout/Container";
import { Separator } from "@/components/ui/Separator";
import { PilotGrid } from "@/components/blocks/PilotGrid";
import type { UserRole } from "@/types/roles";

export const dynamic = "force-dynamic";

export default async function AnnuairePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const role = (session.user.role ?? "candidate") as UserRole;
  if (!hasMinRole(role, "member_uz")) redirect("/membre");

  const members = await prisma.user.findMany({
    where: {
      role: { in: ["member_uz", "member", "officer", "director", "ceo", "admin"] },
    },
    select: {
      id:            true,
      name:          true,
      image:         true,
      role:          true,
      specialty:     true,
      bio:           true,
      corporationId: true,
      createdAt:     true,
    },
    orderBy: [{ role: "asc" }, { name: "asc" }],
  });

  const total     = members.length;
  const officers  = members.filter((m) => ["officer", "director", "ceo", "admin"].includes(m.role)).length;
  const uzCount   = members.filter((m) => m.role === "member_uz").length;

  return (
    <div className="py-10 sm:py-14">
      <Container>
        {/* ── Header ── */}
        <div className="mb-8">
          <p className="text-gold text-xs font-semibold tracking-extra-wide uppercase mb-2">
            Espace membre
          </p>
          <h1 className="font-display font-bold text-3xl sm:text-4xl text-text-primary">
            Annuaire des Pilotes
          </h1>
          <p className="text-text-muted text-sm mt-2">
            <span className="text-text-secondary font-semibold">{total}</span> pilote{total > 1 ? "s" : ""} actif{total > 1 ? "s" : ""}
            {uzCount   > 0 && <> · <span className="text-text-secondary">{uzCount}</span> Urban Zone</>}
            {officers  > 0 && <> · <span className="text-gold/70">{officers}</span> officier{officers > 1 ? "s" : ""}</>}
          </p>
        </div>

        <Separator gold className="mb-8" />

        {/* ── Grille animée ── */}
        <PilotGrid members={members} />
      </Container>
    </div>
  );
}
