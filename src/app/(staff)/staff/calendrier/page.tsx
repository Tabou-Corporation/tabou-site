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
import { Plus, Pencil, RefreshCw } from "lucide-react";
import { DeleteContentButton } from "../annonces/DeleteButton";

const EVENT_TYPE_LABELS: Record<string, string> = {
  op: "Opération",
  training: "Formation",
  social: "Social",
  other: "Autre",
};

export default async function StaffCalendrierPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const role = (session.user.role ?? "candidate") as UserRole;
  if (!hasMinRole(role, "officer")) redirect("/membre");

  const domains = parseSpecialties(session.user.specialties);
  const allowedDomains = getAllowedContentDomains(role, domains);
  const isDirector = hasMinRole(role, "director");

  const events = await prisma.calendarEvent.findMany({
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
              Événements
            </h1>
          </div>
          <Button as="a" href="/staff/calendrier/new" size="sm">
            <Plus size={14} />
            Nouvel événement
          </Button>
        </div>

        <Separator gold className="mb-8" />

        {events.length === 0 ? (
          <p className="text-text-muted text-sm">Aucun événement.</p>
        ) : (
          <div className="space-y-2">
            {events.map((ev) => (
              <Card key={ev.id}>
                <CardBody className="py-3 px-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {ev.recurrence !== "none" && (
                        <RefreshCw size={14} className="text-gold/60 flex-shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="text-text-primary text-sm font-medium truncate">{ev.title}</p>
                        <p className="text-text-muted text-xs mt-0.5">
                          {new Date(ev.startAt).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                          {" — "}
                          {ev.author?.name ?? "Inconnu"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge variant="muted" className="text-2xs">
                        {EVENT_TYPE_LABELS[ev.type] ?? ev.type}
                      </Badge>
                      <Badge variant="muted" className="text-2xs">
                        {CONTENT_DOMAIN_LABELS[ev.domain] ?? ev.domain}
                      </Badge>
                      <Link
                        href={`/staff/calendrier/${ev.id}/edit`}
                        className="p-1.5 text-text-muted hover:text-gold transition-colors"
                        title="Modifier"
                      >
                        <Pencil size={14} />
                      </Link>
                      <DeleteContentButton id={ev.id} type="event" title={ev.title} />
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
