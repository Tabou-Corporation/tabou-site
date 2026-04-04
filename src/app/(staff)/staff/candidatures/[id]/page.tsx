import { redirect, notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { canManageRecruitment } from "@/types/roles";
import { Container } from "@/components/layout/Container";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Separator } from "@/components/ui/Separator";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, MessageSquare } from "lucide-react";
import {
  updateApplicationStatus,
  saveApplicationNotes,
} from "@/lib/actions/applications";
import type { UserRole } from "@/types/roles";

const STATUS_LABELS: Record<string, string> = {
  PENDING:   "En attente",
  INTERVIEW: "Entretien en cours",
  ACCEPTED:  "Acceptée",
  REJECTED:  "Refusée",
};

const STATUS_BADGE: Record<string, "muted" | "gold" | "default" | "red"> = {
  PENDING:   "muted",
  INTERVIEW: "gold",
  ACCEPTED:  "gold",
  REJECTED:  "red",
};

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

  const application = await prisma.application.findUnique({
    where: { id },
    include: { user: { include: { accounts: true } } },
  });

  if (!application) notFound();

  const characterId = application.user.accounts.find(
    (a) => a.provider === "eveonline"
  )?.providerAccountId;

  // ── Actions inline (Server Actions via form) ───────────────────────────────

  async function actionSetStatus(status: "PENDING" | "INTERVIEW" | "ACCEPTED" | "REJECTED") {
    "use server";
    await updateApplicationStatus(id, status);
  }

  async function actionSaveNotes(formData: FormData) {
    "use server";
    const notes = formData.get("notes") as string | null;
    await saveApplicationNotes(id, notes ?? "");
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
          {application.user.image ? (
            <Image
              src={application.user.image}
              alt={application.user.name ?? "Pilote"}
              width={64}
              height={64}
              className="rounded-full border-2 border-gold/20 flex-shrink-0"
              unoptimized
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-bg-elevated border-2 border-border flex items-center justify-center flex-shrink-0">
              <span className="text-text-muted text-xl font-display font-bold">
                {(application.user.name ?? "?")[0]}
              </span>
            </div>
          )}
          <div>
            <h1 className="font-display font-bold text-2xl text-text-primary">
              {application.user.name ?? "Pilote inconnu"}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={STATUS_BADGE[application.status] ?? "muted"}>
                {STATUS_LABELS[application.status] ?? application.status}
              </Badge>
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
                {/* Discord — mis en avant, c'est le moyen de contact */}
                {application.discordHandle && (
                  <div className="flex items-center gap-3 p-3 bg-[#5865F2]/10 border border-[#5865F2]/30 rounded">
                    <MessageSquare size={16} className="text-[#5865F2] flex-shrink-0" />
                    <div>
                      <p className="text-text-muted text-[10px] uppercase tracking-wide font-semibold">
                        Discord — contacter via
                      </p>
                      <p className="text-text-primary text-sm font-mono font-semibold">
                        {application.discordHandle}
                      </p>
                    </div>
                  </div>
                )}
                {!application.discordHandle && (
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
                <form action={actionSaveNotes} className="space-y-3">
                  <textarea
                    name="notes"
                    defaultValue={application.notes ?? ""}
                    rows={5}
                    placeholder="Impressions, points à vérifier, remarques..."
                    className={[
                      "w-full bg-bg-elevated border rounded px-3 py-2.5 resize-y",
                      "text-text-primary text-sm placeholder:text-text-muted",
                      "border-border focus:border-gold/60 focus:outline-none focus:ring-1 focus:ring-gold/40",
                      "transition-colors duration-150",
                    ].join(" ")}
                  />
                  <Button type="submit" variant="secondary" size="sm">
                    Sauvegarder les notes
                  </Button>
                </form>
              </CardBody>
            </Card>
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

            {/* Changer le statut */}
            <Card>
              <CardHeader>
                <h2 className="font-display font-semibold text-sm text-text-primary">
                  Changer le statut
                </h2>
              </CardHeader>
              <CardBody className="space-y-2">
                {application.status !== "INTERVIEW" && (
                  <form action={actionSetStatus.bind(null, "INTERVIEW")}>
                    <Button type="submit" variant="secondary" size="sm" className="w-full">
                      Passer en entretien
                    </Button>
                  </form>
                )}
                {application.status !== "PENDING" && (
                  <form action={actionSetStatus.bind(null, "PENDING")}>
                    <Button type="submit" variant="ghost" size="sm" className="w-full">
                      Remettre en attente
                    </Button>
                  </form>
                )}
                {application.status !== "ACCEPTED" && (
                  <form action={actionSetStatus.bind(null, "ACCEPTED")}>
                    <Button type="submit" variant="primary" size="sm" className="w-full">
                      Accepter → promouvoir membre
                    </Button>
                  </form>
                )}
                {application.status !== "REJECTED" && (
                  <form action={actionSetStatus.bind(null, "REJECTED")}>
                    <Button type="submit" variant="danger" size="sm" className="w-full">
                      Refuser
                    </Button>
                  </form>
                )}
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
