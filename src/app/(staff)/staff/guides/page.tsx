import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { hasMinRole, parseSpecialties, getAllowedGuideCategories } from "@/types/roles";
import type { UserRole } from "@/types/roles";
import { Container } from "@/components/layout/Container";
import { Card, CardBody } from "@/components/ui/Card";
import { Separator } from "@/components/ui/Separator";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { CATEGORY_LABELS } from "@/lib/constants/labels";
import Link from "next/link";
import { Plus, Pencil } from "lucide-react";
import { DeleteContentButton } from "../annonces/DeleteButton";

export default async function StaffGuidesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const role = (session.user.role ?? "candidate") as UserRole;
  if (!hasMinRole(role, "officer")) redirect("/membre");

  const domains = parseSpecialties(session.user.specialties);
  const allowedCategories = getAllowedGuideCategories(role, domains);
  const isDirector = hasMinRole(role, "director");

  const guides = await prisma.guide.findMany({
    where: isDirector ? {} : { category: { in: allowedCategories } },
    orderBy: { createdAt: "desc" },
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
              Guides
            </h1>
          </div>
          <Button as="a" href="/staff/guides/new" size="sm">
            <Plus size={14} />
            Nouveau guide
          </Button>
        </div>

        <Separator gold className="mb-8" />

        {guides.length === 0 ? (
          <p className="text-text-muted text-sm">Aucun guide.</p>
        ) : (
          <div className="space-y-2">
            {guides.map((g) => (
              <Card key={g.id}>
                <CardBody className="py-3 px-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-text-primary text-sm font-medium truncate">{g.title}</p>
                      <p className="text-text-muted text-xs mt-0.5">
                        {g.author?.name ?? "Inconnu"} — {new Date(g.createdAt).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge variant="muted" className="text-2xs">
                        {CATEGORY_LABELS[g.category] ?? g.category}
                      </Badge>
                      <Link
                        href={`/staff/guides/${g.id}/edit`}
                        className="p-1.5 text-text-muted hover:text-gold transition-colors"
                        title="Modifier"
                      >
                        <Pencil size={14} />
                      </Link>
                      <DeleteContentButton id={g.id} type="guide" title={g.title} />
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
