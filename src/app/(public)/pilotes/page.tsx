import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { Container } from "@/components/layout/Container";
import { Separator } from "@/components/ui/Separator";
import { PilotGrid } from "@/components/blocks/PilotGrid";
import { SITE_CONFIG } from "@/config/site";

export const revalidate = 300; // 5 min — liste pilotes change peu

export const metadata: Metadata = {
  title: `Pilotes — ${SITE_CONFIG.fullName}`,
  description: "Découvrez les pilotes actifs des corporations Tabou et Urban Zone.",
  alternates: { canonical: `${SITE_CONFIG.url}/pilotes` },
  openGraph: { url: `${SITE_CONFIG.url}/pilotes` },
};

export const dynamic = "force-dynamic";

export default async function PilotesPage() {
  const members = await prisma.user.findMany({
    where: {
      role: { in: ["member_uz", "member", "officer", "director", "ceo", "admin"] },
    },
    select: {
      id:            true,
      name:          true,
      image:         true,
      role:          true,
      specialties:   true,
      bio:           true,
      corporationId: true,
      createdAt:     true,
    },
    orderBy: [{ role: "asc" }, { name: "asc" }],
  });

  const total    = members.length;
  const officers = members.filter((m) => ["officer", "director", "ceo", "admin"].includes(m.role)).length;
  const uzCount  = members.filter((m) => m.role === "member_uz").length;

  return (
    <div className="py-24 sm:py-28">
      <Container>
        {/* ── Header ── */}
        <div className="mb-10">
          <p className="text-gold text-xs font-semibold tracking-extra-wide uppercase mb-3">
            Les pilotes
          </p>
          <h1 className="font-display font-bold text-4xl sm:text-5xl text-text-primary mb-4">
            Annuaire des Pilotes
          </h1>
          <p className="text-text-secondary text-lg max-w-xl leading-relaxed">
            Capsuliers actifs des corporations <span className="text-gold font-semibold">Tabou</span> et{" "}
            <span className="text-text-primary font-semibold">Urban Zone</span>.
          </p>
          <p className="text-text-muted text-sm mt-3">
            <span className="text-text-secondary font-semibold">{total}</span> pilote{total > 1 ? "s" : ""} actif{total > 1 ? "s" : ""}
            {uzCount  > 0 && <> · <span className="text-text-secondary">{uzCount}</span> Urban Zone</>}
            {officers > 0 && <> · <span className="text-gold/70">{officers}</span> officier{officers > 1 ? "s" : ""}</>}
          </p>
        </div>

        <Separator gold className="mb-10" />

        <PilotGrid members={members} interactive={false} />
      </Container>
    </div>
  );
}
