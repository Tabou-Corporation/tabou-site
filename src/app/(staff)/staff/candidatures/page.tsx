import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { hasMinRole } from "@/types/roles";
import { Container } from "@/components/layout/Container";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Separator } from "@/components/ui/Separator";
import { Clock, CheckCircle, XCircle, MessageCircle, Users } from "lucide-react";
import type { UserRole } from "@/types/roles";

const STATUS_LABELS: Record<string, string> = {
  PENDING:   "En attente",
  INTERVIEW: "Entretien",
  ACCEPTED:  "Acceptée",
  REJECTED:  "Refusée",
};

const STATUS_BADGE: Record<string, "muted" | "gold" | "default" | "red"> = {
  PENDING:   "muted",
  INTERVIEW: "gold",
  ACCEPTED:  "gold",
  REJECTED:  "red",
};

const STATUS_ICON: Record<string, React.ReactNode> = {
  PENDING:   <Clock size={14} className="text-text-muted" />,
  INTERVIEW: <MessageCircle size={14} className="text-gold/80" />,
  ACCEPTED:  <CheckCircle size={14} className="text-gold/80" />,
  REJECTED:  <XCircle size={14} className="text-red-400" />,
};

// Ordre d'affichage : pending d'abord
const STATUS_ORDER: Record<string, number> = {
  PENDING: 0, INTERVIEW: 1, ACCEPTED: 2, REJECTED: 3,
};

export default async function CandidaturesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const role = (session.user.role ?? "candidate") as UserRole;
  if (!hasMinRole(role, "recruiter")) redirect("/membre");

  const applications = await prisma.application.findMany({
    include: { user: true },
    orderBy: [{ createdAt: "desc" }],
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

        <Separator gold className="mb-8" />

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
              <p className="text-text-muted text-sm">Aucune candidature pour le moment.</p>
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
                      {application.user.image ? (
                        <Image
                          src={application.user.image}
                          alt={application.user.name ?? "Pilote"}
                          width={40}
                          height={40}
                          className="rounded-full border border-gold/20 flex-shrink-0"
                          unoptimized
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-bg-elevated border border-border flex items-center justify-center flex-shrink-0">
                          <span className="text-text-muted text-sm font-display font-bold">
                            {(application.user.name ?? "?")[0]}
                          </span>
                        </div>
                      )}

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
