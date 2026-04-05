import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { hasMinRole } from "@/types/roles";
import { Container } from "@/components/layout/Container";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Separator } from "@/components/ui/Separator";
import { Plus, Video, Scroll } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { UserRole } from "@/types/roles";

const ASSEMBLY_TYPE_LABELS: Record<string, string> = {
  monthly: "Mensuelle",
  extraordinary: "Exceptionnelle",
};

export default async function AssembleesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const role = (session.user.role ?? "candidate") as UserRole;
  if (!hasMinRole(role, "member_uz")) redirect("/membre");

  const isOfficer = hasMinRole(role, "officer");

  const assemblies = await prisma.assembly.findMany({
    orderBy: { heldAt: "desc" },
    include: { author: { select: { name: true } } },
  });

  // Group by year
  const grouped = new Map<number, typeof assemblies>();
  for (const a of assemblies) {
    const year = new Date(a.heldAt).getFullYear();
    if (!grouped.has(year)) grouped.set(year, []);
    grouped.get(year)!.push(a);
  }

  return (
    <div className="py-10 sm:py-14">
      <Container size="lg">
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="text-gold text-xs font-semibold tracking-extra-wide uppercase mb-2">
              Espace membre
            </p>
            <h1 className="font-display font-bold text-3xl text-text-primary">
              Assemblées
            </h1>
            <p className="text-text-muted text-sm mt-1.5">
              Comptes rendus de réunion de la corporation
            </p>
          </div>
          {isOfficer && (
            <Button as="a" href="/staff/assemblees/new" size="sm">
              <Plus size={14} />
              Nouveau compte rendu
            </Button>
          )}
        </div>

        <Separator gold className="my-6" />

        {assemblies.length === 0 ? (
          <Card>
            <CardBody className="py-12 text-center">
              <Scroll size={32} className="text-text-muted mx-auto mb-3" />
              <p className="text-text-muted text-sm">Aucune assemblée pour le moment.</p>
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-8">
            {[...grouped.entries()].map(([year, items]) => (
              <div key={year}>
                <p className="text-text-muted text-xs font-semibold uppercase tracking-extra-wide mb-3">
                  {year}
                </p>
                <div className="space-y-2">
                  {items.map((a) => (
                    <Link key={a.id} href={`/membre/assemblees/${a.id}`} className="block">
                      <Card interactive>
                        <CardBody className="py-3.5 px-4">
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <Scroll
                                size={16}
                                className={
                                  a.type === "extraordinary"
                                    ? "text-amber-400 flex-shrink-0"
                                    : "text-gold/50 flex-shrink-0"
                                }
                              />
                              <div className="min-w-0">
                                <p className="text-text-primary text-sm font-medium truncate">
                                  {a.title}
                                </p>
                                <p className="text-text-muted text-xs mt-0.5">
                                  {new Date(a.heldAt).toLocaleDateString("fr-FR", {
                                    day: "numeric",
                                    month: "long",
                                    year: "numeric",
                                  })}
                                  {" · "}
                                  {a.author?.name ?? "Officier"}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <Badge
                                variant={a.type === "extraordinary" ? "gold" : "muted"}
                                className="text-2xs"
                              >
                                {ASSEMBLY_TYPE_LABELS[a.type] ?? a.type}
                              </Badge>
                              {a.videoUrl && (
                                <Video size={14} className="text-text-muted" />
                              )}
                            </div>
                          </div>
                        </CardBody>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Container>
    </div>
  );
}
