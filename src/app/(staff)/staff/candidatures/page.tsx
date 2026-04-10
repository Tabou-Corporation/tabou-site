import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { canManageRecruitment, parseSpecialties } from "@/types/roles";
import { Container } from "@/components/layout/Container";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Separator } from "@/components/ui/Separator";
import { AvatarDisplay } from "@/components/ui/AvatarDisplay";
import { Clock, CheckCircle, XCircle, MessageCircle, Users, UserCheck } from "lucide-react";
import { STATUS_LABELS, STATUS_BADGE, STATUS_ORDER } from "@/lib/constants/labels";
import { cn } from "@/lib/utils/cn";
import type { UserRole } from "@/types/roles";

// STATUS_ICON reste local car il contient du JSX
const STATUS_ICON: Record<string, React.ReactNode> = {
  PENDING:   <Clock size={14} className="text-text-muted" />,
  INTERVIEW: <MessageCircle size={14} className="text-gold/80" />,
  ACCEPTED:  <CheckCircle size={14} className="text-gold/80" />,
  REJECTED:  <XCircle size={14} className="text-red-400" />,
};

export default async function CandidaturesPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const role = (session.user.role ?? "candidate") as UserRole;
  if (!canManageRecruitment(role, parseSpecialties(session.user.specialties))) redirect("/membre");

  const { filter: rawFilter } = await searchParams;
  const isMine = rawFilter === "mine";

  const applications = await prisma.application.findMany({
    ...(isMine ? { where: { assignedToId: session.user.id } } : {}),
    include: {
      user: { select: { name: true, image: true } },
      assignedTo: { select: { name: true } },
    },
    orderBy: [{ createdAt: "desc" }],
    take: 50,
  });

  // Compteur "mes candidatures" pour le badge du bouton
  const myCount = await prisma.application.count({
    where: {
      assignedToId: session.user.id,
      status: { in: ["PENDING", "INTERVIEW"] },
    },
  });

  // Tri par statut puis par date
  const sorted = [...applications].sort(
    (a, b) => (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9)
  );

  const counts = {
    total:     applications.length,
    pending:   applications.filter((a) => a.status === "PENDING").length,
    interview: applications.filter((a) => a.status === "INTERVIEW").length,
    accepted:  applications.filter((a) => a.status === "ACCEPTED").length,
    rejected:  applications.filter((a) => a.status === "REJECTED").length,
  };

  return (
    <div className="py-10 sm:py-14">
      <Container>
        {/* En-tête */}
        <div className="mb-8">
          <p className="text-gold text-xs font-semibold tracking-extra-wide uppercase mb-2">
            Zone recrutement
          </p>
          <h1 className="font-display font-bold text-3xl text-text-primary">
            Candidatures
          </h1>
        </div>

        <Separator gold className="mb-6" />

        {/* Filtres */}
        <div className="flex items-center gap-2 mb-6">
          <Link
            href="/staff/candidatures"
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors",
              !isMine
                ? "bg-gold text-text-inverted"
                : "bg-bg-elevated text-text-secondary border border-border hover:border-border-accent"
            )}
          >
            Toutes
            <span className={!isMine ? "opacity-70" : "text-text-muted"}>
              {counts.total}
            </span>
          </Link>
          <Link
            href="/staff/candidatures?filter=mine"
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors",
              isMine
                ? "bg-gold text-text-inverted"
                : "bg-bg-elevated text-text-secondary border border-border hover:border-border-accent"
            )}
          >
            <UserCheck size={12} />
            Mes candidatures
            {myCount > 0 && (
              <span className={cn(
                "inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold",
                isMine ? "bg-white/20" : "bg-gold/20 text-gold"
              )}>
                {myCount}
              </span>
            )}
          </Link>
        </div>

        {/* Compteurs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            { label: "En attente",  value: counts.pending,   icon: <Clock size={16} /> },
            { label: "Entretien",   value: counts.interview, icon: <MessageCircle size={16} /> },
            { label: "Acceptées",   value: counts.accepted,  icon: <CheckCircle size={16} /> },
            { label: "Refusées",    value: counts.rejected,  icon: <XCircle size={16} /> },
          ].map(({ label, value, icon }) => (
            <Card key={label}>
              <CardBody className="flex items-center gap-3 py-4">
                <span className="text-gold/60">{icon}</span>
                <div>
                  <p className="text-text-primary font-display font-bold text-xl leading-none">
                    {value}
                  </p>
                  <p className="text-text-muted text-xs mt-0.5">{label}</p>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>

        {/* Liste */}
        {sorted.length === 0 ? (
          <Card>
            <CardBody className="py-12 text-center">
              <Users size={32} className="text-text-muted mx-auto mb-3" />
              <p className="text-text-muted text-sm">
                {isMine
                  ? "Aucune candidature ne vous est assignée pour le moment."
                  : "Aucune candidature pour le moment."}
              </p>
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-2">
            {sorted.map((application) => {
              return (
                <Link
                  key={application.id}
                  href={`/staff/candidatures/${application.id}`}
                  className="block"
                >
                  <Card interactive>
                    <CardBody className="flex items-center gap-4 py-4">
                      {/* Portrait */}
                      <AvatarDisplay
                        image={application.user.image}
                        name={application.user.name}
                        size={40}
                      />

                      {/* Infos */}
                      <div className="flex-1 min-w-0">
                        <p className="text-text-primary font-display font-semibold text-sm truncate">
                          {application.user.name ?? "Pilote inconnu"}
                        </p>
                        <p className="text-text-muted text-xs">
                          {application.spCount
                            ? `${application.spCount.toLocaleString("fr-FR")} SP · `
                            : ""}
                          {application.createdAt.toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>

                      {/* Recruteur assigné */}
                      {application.assignedTo?.name && (
                        <div className="hidden sm:flex items-center gap-1 text-text-muted text-xs flex-shrink-0">
                          <UserCheck size={12} />
                          <span className="truncate max-w-[100px]">{application.assignedTo.name}</span>
                        </div>
                      )}

                      {/* Status */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {STATUS_ICON[application.status]}
                        <Badge variant={STATUS_BADGE[application.status] ?? "muted"}>
                          {STATUS_LABELS[application.status] ?? application.status}
                        </Badge>
                      </div>
                    </CardBody>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </Container>
    </div>
  );
}
