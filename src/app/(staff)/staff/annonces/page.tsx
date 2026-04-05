import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { hasMinRole, parseSpecialties, getAllowedContentDomains } from "@/types/roles";
import type { UserRole } from "@/types/roles";
import { Container } from "@/components/layout/Container";
import { Card, CardBody } from "@/components/ui/Card";
import { Separator } from "@/components/ui/Separator";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { CONTENT_DOMAIN_LABELS } from "@/lib/constants/labels";
import Link from "next/link";
import { Plus, Pin, Pencil } from "lucide-react";
import { DeleteContentButton } from "./DeleteButton";

export default async function StaffAnnoncesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const role = (session.user.role ?? "candidate") as UserRole;
  if (!hasMinRole(role, "officer")) redirect("/membre");

  const domains = parseSpecialties(session.user.specialties);
  const allowedDomains = getAllowedContentDomains(role, domains);
  const isDirector = hasMinRole(role, "director");

  const announcements = await prisma.announcement.findMany({
    where: isDirector ? {} : { domain: { in: allowedDomains } },
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
              Annonces
            </h1>
          </div>
          <Button as="a" href="/staff/annonces/new" size="sm">
            <Plus size={14} />
            Nouvelle annonce
          </Button>
        </div>

        <Separator gold className="mb-8" />

        {announcements.length === 0 ? (
          <p className="text-text-muted text-sm">Aucune annonce.</p>
        ) : (
          <div className="space-y-2">
            {announcements.map((a) => (
              <Card key={a.id}>
                <CardBody className="py-3 px-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {a.pinned && <Pin size={14} className="text-gold flex-shrink-0" />}
                      <div className="min-w-0">
                        <p className="text-text-primary text-sm font-medium truncate">{a.title}</p>
                        <p className="text-text-muted text-xs mt-0.5">
                          {a.author?.name ?? "Inconnu"} — {new Date(a.createdAt).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge variant="muted" className="text-2xs">
                        {CONTENT_DOMAIN_LABELS[a.domain] ?? a.domain}
                      </Badge>
                      <Link
                        href={`/staff/annonces/${a.id}/edit`}
                        className="p-1.5 text-text-muted hover:text-gold transition-colors"
                        title="Modifier"
                      >
                        <Pencil size={14} />
                      </Link>
                      <DeleteContentButton id={a.id} type="announcement" title={a.title} />
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
