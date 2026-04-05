import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { hasMinRole } from "@/types/roles";
import type { UserRole } from "@/types/roles";
import { Container } from "@/components/layout/Container";
import { Card, CardBody } from "@/components/ui/Card";
import { Separator } from "@/components/ui/Separator";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";
import { Plus, Pencil, Video, Scroll } from "lucide-react";
import { DeleteContentButton } from "../annonces/DeleteButton";

const ASSEMBLY_TYPE_LABELS: Record<string, string> = {
  monthly: "Mensuelle",
  extraordinary: "Exceptionnelle",
};

export default async function StaffAssembleesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const role = (session.user.role ?? "candidate") as UserRole;
  if (!hasMinRole(role, "officer")) redirect("/membre");

  const assemblies = await prisma.assembly.findMany({
    orderBy: { heldAt: "desc" },
    include: { author: { select: { name: true } } },
  });

  return (
    <div className="py-10 sm:py-14">
      <Container size="lg">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-gold text-xs font-semibold tracking-extra-wide uppercase mb-2">
              Staff
            </p>
            <h1 className="font-display font-bold text-3xl text-text-primary">
              Assemblées
            </h1>
          </div>
          <Button as="a" href="/staff/assemblees/new" size="sm">
            <Plus size={14} />
            Nouveau compte rendu
          </Button>
        </div>

        <Separator gold className="mb-8" />

        {assemblies.length === 0 ? (
          <p className="text-text-muted text-sm">Aucune assemblée.</p>
        ) : (
          <div className="space-y-2">
            {assemblies.map((a) => (
              <Card key={a.id}>
                <CardBody className="py-3 px-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <Scroll
                        size={14}
                        className={
                          a.type === "extraordinary"
                            ? "text-amber-400 flex-shrink-0"
                            : "text-gold/50 flex-shrink-0"
                        }
                      />
                      <div className="min-w-0">
                        <p className="text-text-primary text-sm font-medium truncate">{a.title}</p>
                        <p className="text-text-muted text-xs mt-0.5">
                          {new Date(a.heldAt).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                          {" — "}
                          {a.author?.name ?? "Inconnu"}
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
                      <Link
                        href={`/staff/assemblees/${a.id}/edit`}
                        className="p-1.5 text-text-muted hover:text-gold transition-colors"
                        title="Modifier"
                      >
                        <Pencil size={14} />
                      </Link>
                      <DeleteContentButton id={a.id} type="assembly" title={a.title} />
                    </div>
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
