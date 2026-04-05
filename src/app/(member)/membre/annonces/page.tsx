import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { hasMinRole } from "@/types/roles";
import { Container } from "@/components/layout/Container";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Separator } from "@/components/ui/Separator";
import { Pin, Plus } from "lucide-react";
import { deleteAnnouncement } from "@/lib/actions/content";
import { DeleteButton } from "@/components/ui/DeleteButton";
import type { UserRole } from "@/types/roles";

export default async function AnnoncesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const role = (session.user.role ?? "candidate") as UserRole;
  if (!hasMinRole(role, "member")) redirect("/membre");

  const isOfficer = hasMinRole(role, "officer");

  const announcements = await prisma.announcement.findMany({
    include: { author: true },
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
  });

  return (
    <div className="py-10 sm:py-14">
      <Container size="md">
        <div className="flex items-start justify-between mb-8">
          <div>
            <p className="text-gold text-xs font-semibold tracking-extra-wide uppercase mb-2">
              Espace membre
            </p>
            <h1 className="font-display font-bold text-3xl text-text-primary">
              Annonces
            </h1>
          </div>
          {isOfficer && (
            <Link
              href="/staff/annonces/new"
              className="inline-flex items-center gap-1.5 text-gold text-sm hover:text-gold-light transition-colors mt-1"
            >
              <Plus size={16} />
              Nouvelle annonce
            </Link>
          )}
        </div>

        <Separator gold className="mb-8" />

        {announcements.length === 0 ? (
          <Card>
            <CardBody className="py-12 text-center">
              <p className="text-text-muted text-sm">Aucune annonce pour le moment.</p>
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-4">
            {announcements.map((a) => (
              <Card key={a.id} accent={a.pinned}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      {a.pinned && <Pin size={13} className="text-gold/70 flex-shrink-0 mt-0.5" />}
                      <h2 className="font-display font-semibold text-base text-text-primary leading-snug">
                        {a.title}
                      </h2>
                    </div>
                    {isOfficer && (
                      <DeleteButton
                        action={deleteAnnouncement.bind(null, a.id)}
                        confirmMessage={`Supprimer l'annonce "${a.title}" définitivement ?`}
                      />
                    )}
                  </div>
                  <p className="text-text-muted text-xs mt-1">
                    Par {a.author.name ?? "Officier"} ·{" "}
                    {a.createdAt.toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </CardHeader>
                <CardBody>
                  <p className="text-text-secondary text-sm leading-relaxed whitespace-pre-wrap break-words">
                    {a.content}
                  </p>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </Container>
    </div>
  );
}
