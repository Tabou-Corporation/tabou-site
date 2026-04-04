import { redirect } from "next/navigation";
import Image from "next/image";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { hasMinRole } from "@/types/roles";
import { Container } from "@/components/layout/Container";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Separator } from "@/components/ui/Separator";
import { Users } from "lucide-react";
import type { UserRole } from "@/types/roles";

const ROLE_LABELS: Record<string, string> = {
  member:    "Membre",
  recruiter: "Recruteur",
  officer:   "Officier",
  admin:     "Administrateur",
};

const ROLE_BADGE: Record<string, "muted" | "gold"> = {
  member:    "muted",
  recruiter: "gold",
  officer:   "gold",
  admin:     "gold",
};

export default async function AnnuairePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const role = (session.user.role ?? "candidate") as UserRole;
  if (!hasMinRole(role, "member")) redirect("/membre");

  const members = await prisma.user.findMany({
    where: {
      role: { in: ["member", "recruiter", "officer", "admin"] },
    },
    orderBy: [{ role: "desc" }, { name: "asc" }],
  });

  const counts = {
    total:    members.length,
    officer:  members.filter((m) => m.role === "officer" || m.role === "admin").length,
    recruiter: members.filter((m) => m.role === "recruiter").length,
    member:   members.filter((m) => m.role === "member").length,
  };

  return (
    <div className="py-10 sm:py-14">
      <Container>
        <div className="mb-8">
          <p className="text-gold text-xs font-semibold tracking-extra-wide uppercase mb-2">
            Espace membre
          </p>
          <h1 className="font-display font-bold text-3xl text-text-primary">
            Annuaire
          </h1>
          <p className="text-text-muted text-sm mt-1">
            {counts.total} membre{counts.total > 1 ? "s" : ""} actif{counts.total > 1 ? "s" : ""}
          </p>
        </div>

        <Separator gold className="mb-8" />

        {members.length === 0 ? (
          <Card>
            <CardBody className="py-12 text-center">
              <Users size={32} className="text-text-muted mx-auto mb-3" />
              <p className="text-text-muted text-sm">Aucun membre pour le moment.</p>
            </CardBody>
          </Card>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {members.map((member) => (
              <Card key={member.id}>
                <CardBody className="flex flex-col items-center text-center gap-3 py-6 px-3">
                  {member.image ? (
                    <Image
                      src={member.image}
                      alt={member.name ?? "Pilote"}
                      width={64}
                      height={64}
                      className="rounded-full border border-gold/20"
                      unoptimized
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-bg-elevated border border-border flex items-center justify-center">
                      <span className="text-text-muted text-xl font-display font-bold">
                        {(member.name ?? "?")[0]}
                      </span>
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <p className="text-text-primary text-sm font-display font-semibold leading-tight">
                      {member.name ?? "Pilote inconnu"}
                    </p>
                    <Badge variant={ROLE_BADGE[member.role] ?? "muted"}>
                      {ROLE_LABELS[member.role] ?? member.role}
                    </Badge>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </Container>
    </div>
  );
}
