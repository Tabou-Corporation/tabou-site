import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { canManageRecruitment } from "@/types/roles";
import { Container } from "@/components/layout/Container";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Separator } from "@/components/ui/Separator";
import { Button } from "@/components/ui/Button";
import { AvatarDisplay } from "@/components/ui/AvatarDisplay";
import { ArrowLeft, MessageSquare } from "lucide-react";
import { takeChargeApplication } from "@/lib/actions/applications";
import { STATUS_LABELS, STATUS_BADGE } from "@/lib/constants/labels";
import { CandidatureDecisionButtons } from "./CandidatureDecisionButtons";
import { SaveNotesForm } from "./SaveNotesForm";
import { AssignRecruiterForm } from "./AssignRecruiterForm";
import { SecurityStatusBadge } from "@/components/ui/SecurityStatusBadge";
import { CorpHistoryTimeline } from "@/components/ui/CorpHistoryTimeline";
import { cn } from "@/lib/utils/cn";
import { hasMinRole } from "@/types/roles";
import { parseProfileExtra, ACTIVITY_LABEL } from "@/lib/profile-extra";
import type { UserRole } from "@/types/roles";

export default async function CandidatureDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const role = (session.user.role ?? "candidate") as UserRole;
  if (!canManageRecruitment(role, session.user.specialty)) redirect("/membre");

  const canReassign = hasMinRole(role, "director");

  const [application, recruiters] = await Promise.all([
    prisma.application.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            name: true,
            image: true,
            securityStatus: true,
            profileExtra:   true,
            // On ne charge que le compte EVE Online (providerAccountId = characterId)
            accounts: {
              where: { provider: "eveonline" },
              select: { providerAccountId: true },
            },
          },
        },
        assignedTo: { select: { id: true, name: true } },
      },
    }),
    // Charge les recruteurs uniquement pour director+
    canReassign
      ? prisma.user.findMany({
          where: { role: { in: ["officer", "director", "ceo", "admin"] } },
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        })
      : Promise.resolve([]),
  ]);

  if (!application) notFound();

  // Avec le filtre where, accounts[0] est forcément le compte EVE (ou undefined)
  const characterId  = application.user.accounts[0]?.providerAccountId;
  const profileExtra = parseProfileExtra(application.user.profileExtra);

  // ── Actions inline (Server Actions via form) ─────────────────────────────
  // Note : actionSetStatus et actionSaveNotes sont gérés par les Client Components
  // CandidatureDecisionButtons et SaveNotesForm (useTransition + toast feedback).

  async function actionTakeCharge(formData: FormData) {
    "use server";
    await takeChargeApplication(id, formData);
  }

  return (
    <div className="py-10 sm:py-14">
      <Container size="md">
        {/* Retour */}
        <div className="mb-6">
          <Link
            href="/staff/candidatures"
            className="inline-flex items-center gap-1.5 text-text-muted text-sm hover:text-text-secondary transition-colors"
          >
            <ArrowLeft size={14} />
            Retour aux candidatures
          </Link>
        </div>

        {/* En-tête candidat */}
        <div className="flex items-center gap-4 mb-8">
          <AvatarDisplay
            image={application.user.image}
            name={application.user.name}
            size={64}
            border="thick"
          />
          <div>
            <h1 className="font-display font-bold text-2xl text-text-primary">
              {application.user.name ?? "Pilote inconnu"}
            </h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <Badge variant={STATUS_BADGE[application.status] ?? "muted"}>
                {STATUS_LABELS[application.status] ?? application.status}
              </Badge>
              <SecurityStatusBadge value={application.user.securityStatus} showLabel />
              {characterId && (
                <span className="text-text-muted text-xs font-mono">
                  ID: {characterId}
                </span>
              )}
            </div>
          </div>
        </div>

        <Separator gold className="mb-8" />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Colonne principale */}
          <div className="lg:col-span-2 space-y-6">
            {/* Infos candidature */}
            <Card>
              <CardHeader>
                <h2 className="font-display font-semibold text-base text-text-primary">
                  Candidature
                </h2>
              </CardHeader>
              <CardBody className="space-y-4">
                {/* Discord — pseudo pour contact manuel */}
                {application.discordHandle ? (
                  <div className="flex items-center gap-3 p-3 bg-[#5865F2]/10 border border-[#5865F2]/30 rounded">
                    <MessageSquare size={16} className="text-[#5865F2] flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-text-muted text-[10px] uppercase tracking-wide font-semibold mb-0.5">
                        Discord — contacter via
                      </p>
                      <p className="text-text-primary text-sm font-mono font-semibold select-all">
                        {application.discordHandle}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-text-muted text-xs italic">
                    Aucun pseudo Discord renseigné.
                  </p>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-text-muted text-xs uppercase tracking-wide font-semibold mb-1">
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
                  {application.spCount && (
                    <div>
                      <p className="text-text-muted text-xs uppercase tracking-wide font-semibold mb-1">
                        Skillpoints
                      </p>
                      <p className="text-text-secondary text-sm">
                        {application.spCount.toLocaleString("fr-FR")} SP
                      </p>
                    </div>
                  )}
                  {application.availability && (
                    <div className="col-span-2">
                      <p className="text-text-muted text-xs uppercase tracking-wide font-semibold mb-1">
                        Disponibilités
                      </p>
                      <p className="text-text-secondary text-sm">
                        {application.availability}
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-text-muted text-xs uppercase tracking-wide font-semibold mb-2">
                    Motivation
                  </p>
                  <p className="text-text-secondary text-sm leading-relaxed whitespace-pre-wrap break-words">
                    {application.motivation ?? <em className="text-text-muted">Aucune motivation renseignée.</em>}
                  </p>
                </div>
              </CardBody>
            </Card>

            {/* Notes recruteur */}
            <Card>
              <CardHeader>
                <h2 className="font-display font-semibold text-base text-text-primary">
                  Notes internes <span className="text-text-muted font-normal text-xs">(visibles recruteurs uniquement)</span>
                </h2>
              </CardHeader>
              <CardBody>
                <SaveNotesForm
                  applicationId={id}
                  defaultNotes={application.notes ?? ""}
                />
              </CardBody>
            </Card>

            {/* Profil étendu du pilote */}
            {(profileExtra.timezone || profileExtra.mainActivity || profileExtra.secondaryActivity || (profileExtra.languages?.length ?? 0) > 0) && (
              <Card>
                <CardHeader>
                  <h2 className="font-display font-semibold text-base text-text-primary">
                    Profil du pilote
                  </h2>
                </CardHeader>
                <CardBody className="space-y-3">
                  {profileExtra.timezone && (
                    <div className="flex items-start justify-between gap-4">
                      <span className="text-text-muted text-sm flex-shrink-0">Fuseau</span>
                      <span className="text-text-secondary text-sm text-right">{profileExtra.timezone}</span>
                    </div>
                  )}
                  {profileExtra.mainActivity && (
                    <div className="flex items-start justify-between gap-4">
                      <span className="text-text-muted text-sm flex-shrink-0">Activité principale</span>
                      <span className="text-text-secondary text-sm text-right">
                        {ACTIVITY_LABEL[profileExtra.mainActivity] ?? profileExtra.mainActivity}
                      </span>
                    </div>
                  )}
                  {profileExtra.secondaryActivity && (
                    <div className="flex items-start justify-between gap-4">
                      <span className="text-text-muted text-sm flex-shrink-0">Activité secondaire</span>
                      <span className="text-text-secondary text-sm text-right">
                        {ACTIVITY_LABEL[profileExtra.secondaryActivity] ?? profileExtra.secondaryActivity}
                      </span>
                    </div>
                  )}
                  {(profileExtra.languages?.length ?? 0) > 0 && (
                    <div className="flex items-start justify-between gap-4">
                      <span className="text-text-muted text-sm flex-shrink-0">Langues</span>
                      <span className="text-text-secondary text-sm text-right uppercase">
                        {profileExtra.languages!.join(", ")}
                      </span>
                    </div>
                  )}
                </CardBody>
              </Card>
            )}
          </div>

          {/* Colonne actions */}
          <div className="space-y-4">
            {/* Liens externes */}
            {characterId && (
              <Card>
                <CardHeader>
                  <h2 className="font-display font-semibold text-sm text-text-primary">
                    Liens externes
                  </h2>
                </CardHeader>
                <CardBody className="space-y-2">
                  <a
                    href={`https://zkillboard.com/character/${characterId}/`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-text-secondary text-sm hover:text-gold transition-colors"
                  >
                    zKillboard →
                  </a>
                  <a
                    href={`https://evewho.com/character/${characterId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-text-secondary text-sm hover:text-gold transition-colors"
                  >
                    EVEWho →
                  </a>
                </CardBody>
              </Card>
            )}

            {/* Historique de corporation */}
            {characterId && (
              <Card>
                <CardHeader>
                  <h2 className="font-display font-semibold text-sm text-text-primary">
                    Historique corpo
                  </h2>
                </CardHeader>
                <CardBody>
                  <CorpHistoryTimeline characterId={characterId} />
                </CardBody>
              </Card>
            )}

            {/* Recruteur assigné */}
            <Card>
              <CardHeader>
                <h2 className="font-display font-semibold text-sm text-text-primary">
                  Recruteur assigné
                </h2>
              </CardHeader>
              <CardBody>
                <AssignRecruiterForm
                  applicationId={id}
                  currentUserId={session.user.id}
                  assignedToId={application.assignedTo?.id ?? null}
                  assignedToName={application.assignedTo?.name ?? null}
                  recruiters={recruiters}
                  canReassign={canReassign}
                />
              </CardBody>
            </Card>

            {/* Prendre en charge */}
            {application.status === "PENDING" && (
              <Card>
                <CardHeader>
                  <h2 className="font-display font-semibold text-sm text-text-primary">
                    Prendre en charge
                  </h2>
                </CardHeader>
                <CardBody>
                  <form action={actionTakeCharge} className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="block text-text-muted text-xs font-medium">
                        Date d&apos;entretien Discord{" "}
                        <span className="font-normal">(optionnel)</span>
                      </label>
                      <input
                        name="interviewAt"
                        type="datetime-local"
                        defaultValue={
                          application.interviewAt
                            ? application.interviewAt.toISOString().slice(0, 16)
                            : ""
                        }
                        className={cn(
                          "w-full bg-bg-elevated border rounded px-3 py-2",
                          "text-text-primary text-xs",
                          "border-border focus:border-gold/60 focus:outline-none",
                          "transition-colors duration-150"
                        )}
                      />
                      <p className="text-text-muted text-[11px]">
                        Heure locale — pense à préciser EVE Time au candidat.
                      </p>
                    </div>
                    <Button type="submit" variant="secondary" size="sm" className="w-full">
                      Prendre en charge
                    </Button>
                  </form>
                </CardBody>
              </Card>
            )}

            {/* Modifier l'entretien si déjà en cours */}
            {application.status === "INTERVIEW" && (
              <Card className="border-gold/20">
                <CardHeader>
                  <h2 className="font-display font-semibold text-sm text-text-primary">
                    Entretien planifié
                  </h2>
                </CardHeader>
                <CardBody>
                  <form action={actionTakeCharge} className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="block text-text-muted text-xs font-medium">
                        Date d&apos;entretien Discord
                      </label>
                      <input
                        name="interviewAt"
                        type="datetime-local"
                        defaultValue={
                          application.interviewAt
                            ? application.interviewAt.toISOString().slice(0, 16)
                            : ""
                        }
                        className={cn(
                          "w-full bg-bg-elevated border rounded px-3 py-2",
                          "text-text-primary text-xs",
                          "border-border focus:border-gold/60 focus:outline-none",
                          "transition-colors duration-150"
                        )}
                      />
                    </div>
                    <Button type="submit" variant="ghost" size="sm" className="w-full">
                      Mettre à jour la date
                    </Button>
                  </form>
                </CardBody>
              </Card>
            )}

            {/* Décision finale */}
            <Card>
              <CardHeader>
                <h2 className="font-display font-semibold text-sm text-text-primary">
                  Décision
                </h2>
              </CardHeader>
              <CardBody>
                <CandidatureDecisionButtons
                  applicationId={id}
                  currentStatus={application.status}
                />
              </CardBody>
            </Card>

            {/* Méta */}
            {application.reviewedBy && (
              <Card>
                <CardBody className="space-y-1 py-3">
                  <p className="text-text-muted text-xs">
                    Traité par{" "}
                    <span className="text-text-secondary">{application.reviewedBy}</span>
                  </p>
                  {application.reviewedAt && (
                    <p className="text-text-muted text-xs">
                      {application.reviewedAt.toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  )}
                </CardBody>
              </Card>
            )}
          </div>
        </div>
      </Container>
    </div>
  );
}
