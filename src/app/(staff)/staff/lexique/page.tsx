import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { hasMinRole } from "@/types/roles";
import type { UserRole } from "@/types/roles";
import { Container } from "@/components/layout/Container";
import { Separator } from "@/components/ui/Separator";
import { LexiqueStaffClient } from "./LexiqueStaffClient";

export default async function StaffLexiquePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const role = (session.user.role ?? "candidate") as UserRole;
  if (!hasMinRole(role, "officer")) redirect("/membre");

  const terms = await prisma.glossaryTerm.findMany({
    include: { author: { select: { name: true } } },
    orderBy: [{ category: "asc" }, { term: "asc" }],
  });

  const serialized = terms.map((t) => ({
    id: t.id,
    term: t.term,
    literal: t.literal,
    definition: t.definition,
    category: t.category,
    authorName: t.author.name ?? "Membre",
    createdAt: t.createdAt.toISOString(),
  }));

  return (
    <div className="py-10 sm:py-14">
      <Container size="lg">
        <div>
          <p className="text-gold text-xs font-semibold tracking-extra-wide uppercase mb-2">
            Zone staff
          </p>
          <h1 className="font-display font-bold text-3xl text-text-primary">
            Lexique — Modération
          </h1>
          <p className="text-text-muted text-sm mt-1.5">
            {terms.length} terme{terms.length > 1 ? "s" : ""} dans le lexique
          </p>
        </div>

        <Separator gold className="my-6" />

        <LexiqueStaffClient terms={serialized} />
      </Container>
    </div>
  );
}
