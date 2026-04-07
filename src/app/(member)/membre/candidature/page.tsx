import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { Container } from "@/components/layout/Container";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Separator } from "@/components/ui/Separator";
import { ApplicationForm } from "./ApplicationForm";
import { withdrawApplication } from "@/lib/actions/applications";
import { STATUS_LABELS, STATUS_BADGE } from "@/lib/constants/labels";
import type { UserRole } from "@/types/roles";
import {
  Send,
  UserSearch,
  MessageSquareText,
  Rocket,
  Check,
  Clock,
} from "lucide-react";

// ── Timeline Step Types ──────────────────────────────────────────────────────

type StepStatus = "done" | "active" | "upcoming";

interface TimelineStep {
  icon: React.ReactNode;
  title: string;
  description: string;
  status: StepStatus;
  detail?: string;
  date?: string;
}

function buildTimeline(application: {
  status: string;
  createdAt: Date;
  reviewedAt: Date | null;
  interviewAt: Date | null;
  reviewedBy: string | null;
}): TimelineStep[] {
  const status = application.status;
  const fmt = (d: Date) =>
    d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  const fmtTime = (d: Date) =>
    d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" }) +
    " à " +
    d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  const steps: TimelineStep[] = [
    {
      icon: <Send size={16} />,
      title: "Candidature soumise",
      description: "Votre dossier a été reçu et est dans la file d'attente.",
      status: "done",
      date: fmt(application.createdAt),
    },
    {
      icon: <UserSearch size={16} />,
      title: "Prise en charge",
      description: "Un recruteur examine votre profil et prépare l'entretien.",
      status:
        status === "PENDING" ? "upcoming" :
        "done",
      ...(status !== "PENDING" && application.reviewedBy
        ? { detail: `Recruteur : ${application.reviewedBy}` }
        : {}),
    },
    {
      icon: <MessageSquareText size={16} />,
      title: "Entretien Discord",
      description: "Échange vocal avec un recruteur pour faire connaissance.",
      status:
        status === "PENDING" ? "upcoming" :
        status === "INTERVIEW" ? "active" :
        status === "ACCEPTED" ? "done" :
        "upcoming",
      ...(application.interviewAt
        ? { detail: fmtTime(application.interviewAt) }
        : status === "INTERVIEW"
          ? { detail: "Date à confirmer — restez disponible sur Discord" }
          : {}),
    },
    {
      icon: <Rocket size={16} />,
      title: "Intégration en jeu",
      description: "Rejoignez la corporation EVE Online (Tabou ou Urban Zone) et reconnectez-vous ici.",
      status:
        status === "ACCEPTED" ? "active" :
        "upcoming",
      ...(status === "ACCEPTED"
        ? { detail: "Accepté — rejoignez la corporation en jeu puis reconnectez-vous" }
        : {}),
    },
    {
      icon: <Check size={16} />,
      title: "Bienvenue chez Tabou",
      description: "Accès complet à l'espace membre, aux opérations et aux ressources.",
      status: "upcoming",
      ...(status === "ACCEPTED" && application.reviewedAt
        ? { date: fmt(application.reviewedAt) }
        : {}),
    },
  ];

  return steps;
}

// ── Timeline Component ───────────────────────────────────────────────────────

function ApplicationTimeline({ steps }: { steps: TimelineStep[] }) {
  return (
    <div className="relative">
      {steps.map((step, i) => {
        const isLast = i === steps.length - 1;
        return (
          <div key={i} className="flex gap-4">
            {/* Vertical line + icon */}
            <div className="flex flex-col items-center">
              <div
                className={[
                  "w-9 h-9 rounded-full flex items-center justify-center shrink-0 border-2 transition-colors",
                  step.status === "done"
                    ? "bg-gold/20 border-gold text-gold"
                    : step.status === "active"
                      ? "bg-gold/10 border-gold/60 text-gold animate-pulse"
                      : "bg-bg-elevated border-border text-text-muted",
                ].join(" ")}
              >
                {step.status === "done" ? <Check size={16} /> : step.icon}
              </div>
              {!isLast && (
                <div
                  className={[
                    "w-0.5 flex-1 min-h-[32px]",
                    step.status === "done" ? "bg-gold/40" : "bg-border",
                  ].join(" ")}
                />
              )}
            </div>

            {/* Content */}
            <div className={`pb-8 ${isLast ? "pb-0" : ""}`}>
              <div className="flex items-center gap-2 -mt-0.5">
                <h3
                  className={[
                    "font-display font-semibold text-sm",
                    step.status === "done"
                      ? "text-text-primary"
                      : step.status === "active"
                        ? "text-gold"
                        : "text-text-muted",
                  ].join(" ")}
                >
                  {step.title}
                </h3>
                {step.status === "active" && (
                  <span className="flex items-center gap-1 text-gold/80 text-[11px] font-medium">
                    <Clock size={11} />
                    En cours
                  </span>
                )}
              </div>
              <p
                className={[
                  "text-xs leading-relaxed mt-0.5",
                  step.status === "upcoming" ? "text-text-muted/60" : "text-text-muted",
                ].join(" ")}
              >
                {step.description}
              </p>
              {step.detail && (
                <p className="text-xs text-text-secondary mt-1 font-medium">
                  {step.detail}
                </p>
              )}
              {step.date && (
                <p className="text-xs text-text-muted mt-0.5">{step.date}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function CandidaturePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const role = (session.user.role ?? "candidate") as UserRole;

  // Les membres complets n'ont plus besoin de cette page
  if (role !== "candidate") redirect("/membre");

  const application = await prisma.application.findFirst({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  const canReapply = application?.status === "REJECTED";
  const hasActiveApplication = application && !canReapply;

  return (
    <div className="py-10 sm:py-14">
      <Container size="md">
        {/* En-tête */}
        <div className="mb-8">
          <p className="text-gold text-xs font-semibold tracking-extra-wide uppercase mb-2">
            Recrutement
          </p>
          <h1 className="font-display font-bold text-3xl text-text-primary">
            Ma candidature
          </h1>
        </div>

        <Separator gold className="mb-8" />

        {/* Candidature existante — Timeline + récapitulatif */}
        {hasActiveApplication && application && (
          <div className="space-y-6">
            {/* Timeline de progression */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h2 className="font-display font-semibold text-base text-text-primary">
                    Suivi de votre candidature
                  </h2>
                  <Badge variant={STATUS_BADGE[application.status] ?? "muted"}>
                    {STATUS_LABELS[application.status] ?? application.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardBody>
                <ApplicationTimeline steps={buildTimeline(application)} />
              </CardBody>
            </Card>

            {/* Récapitulatif du dossier */}
            <Card>
              <CardHeader>
                <h2 className="font-display font-semibold text-sm text-text-muted">
                  Récapitulatif de votre dossier
                </h2>
              </CardHeader>
              <CardBody>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                  <div className="space-y-1">
                    <p className="text-text-muted text-xs uppercase tracking-wide font-semibold">
                      Soumise le
                    </p>
                    <p className="text-text-secondary text-sm">
                      {application.createdAt.toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>

                  {application.discordHandle && (
                    <div className="space-y-1">
                      <p className="text-text-muted text-xs uppercase tracking-wide font-semibold">
                        Discord
                      </p>
                      <p className="text-text-secondary text-sm font-mono">
                        {application.discordHandle}
                      </p>
                    </div>
                  )}

                  {application.spCount != null && (
                    <div className="space-y-1">
                      <p className="text-text-muted text-xs uppercase tracking-wide font-semibold">
                        Skillpoints déclarés
                      </p>
                      <p className="text-text-secondary text-sm">
                        {application.spCount.toLocaleString("fr-FR")} SP
                      </p>
                    </div>
                  )}

                  {application.availability && (
                    <div className="space-y-1">
                      <p className="text-text-muted text-xs uppercase tracking-wide font-semibold">
                        Disponibilités
                      </p>
                      <p className="text-text-secondary text-sm">
                        {application.availability}
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-5 pt-4 border-t border-border space-y-1">
                  <p className="text-text-muted text-xs uppercase tracking-wide font-semibold">
                    Motivation
                  </p>
                  <p className="text-text-secondary text-sm leading-relaxed whitespace-pre-wrap break-words">
                    {application.motivation}
                  </p>
                </div>
              </CardBody>
            </Card>

            {/* Message spécifique au statut */}
            {application.status === "INTERVIEW" && application.interviewAt && (
              <div className="flex items-start gap-3 bg-gold/5 border border-gold/20 rounded-md px-4 py-3">
                <MessageSquareText size={16} className="text-gold shrink-0 mt-0.5" />
                <div>
                  <p className="text-text-primary text-sm font-semibold">
                    Entretien prévu le{" "}
                    {application.interviewAt.toLocaleDateString("fr-FR", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}{" "}
                    à{" "}
                    {application.interviewAt.toLocaleTimeString("fr-FR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  <p className="text-text-muted text-xs mt-0.5">
                    Heure locale — contactez le recruteur sur Discord si besoin de décaler.
                  </p>
                </div>
              </div>
            )}

            {application.status === "ACCEPTED" && (
              <div className="flex items-start gap-3 bg-gold/5 border border-gold/20 rounded-md px-4 py-3">
                <Rocket size={16} className="text-gold shrink-0 mt-0.5" />
                <div>
                  <p className="text-gold text-sm font-semibold">
                    Votre candidature a été acceptée !
                  </p>
                  <p className="text-text-muted text-xs mt-1 leading-relaxed">
                    Assurez-vous d&apos;avoir <strong className="text-text-secondary">rejoint la corporation en jeu</strong> (Tabou
                    ou Urban Zone), puis <strong className="text-text-secondary">reconnectez-vous</strong> sur ce site.
                  </p>
                  <p className="text-text-muted text-xs mt-1.5 leading-relaxed">
                    <span className="text-amber-400 font-semibold">Note :</span> après avoir rejoint
                    en jeu, l&apos;API EVE (ESI) peut prendre jusqu&apos;à ~1 heure pour propager le changement.
                    Si votre accès n&apos;est pas activé immédiatement, patientez puis reconnectez-vous.
                  </p>
                </div>
              </div>
            )}

            {/* Retrait — uniquement si pas encore accepté */}
            {(application.status === "PENDING" || application.status === "INTERVIEW") && (
              <div className="flex items-center justify-between border border-border rounded-md px-4 py-3">
                <p className="text-text-muted text-xs">
                  Vous pouvez retirer votre candidature et re-postuler à tout moment.
                </p>
                <form action={withdrawApplication as unknown as () => Promise<void>}>
                  <button
                    type="submit"
                    className="text-text-muted text-xs hover:text-red-400 transition-colors underline underline-offset-2 whitespace-nowrap ml-4"
                  >
                    Retirer ma candidature
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        {/* Formulaire (pas encore de candidature, ou refusé) */}
        {(!application || canReapply) && (
          <div className="space-y-6">
            {canReapply && (
              <Card className="border-red-400/20">
                <CardBody>
                  <p className="text-text-secondary text-sm leading-relaxed">
                    Votre précédente candidature a été refusée. Vous pouvez en soumettre
                    une nouvelle si vous estimez pouvoir mieux répondre aux attentes de
                    la corporation.
                  </p>
                </CardBody>
              </Card>
            )}

            <Card>
              <CardHeader>
                <h2 className="font-display font-semibold text-base text-text-primary">
                  Formulaire de candidature
                </h2>
              </CardHeader>
              <CardBody>
                <div className="space-y-4 mb-6">
                  <p className="text-text-secondary text-sm leading-relaxed">
                    Tabou est une corporation PvP nullsec sérieuse. Prenez le temps de
                    rédiger une candidature soignée — elle fait toute la différence.
                  </p>
                  <ul className="text-text-muted text-xs space-y-1 list-disc list-inside">
                    <li>Soyez présent et réactif sur Discord</li>
                    <li>Minimum recommandé : 30M SP en combat</li>
                    <li>Disponibilité pour les OPs de corp</li>
                  </ul>
                </div>
                <ApplicationForm />
              </CardBody>
            </Card>
          </div>
        )}
      </Container>
    </div>
  );
}
