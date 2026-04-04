import { redirect } from "next/navigation";
import Image from "next/image";
import { auth } from "@/auth";
import { Container } from "@/components/layout/Container";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Separator } from "@/components/ui/Separator";
import { CORPORATIONS } from "@/lib/constants/corporations";
import { prisma } from "@/lib/db";
import { BioEditor } from "./BioEditor";
import type { UserRole } from "@/types/roles";

const ROLE_LABELS: Record<UserRole, string> = {
  candidate:  "Candidat",
  member_uz:  "Urban Zone",
  member:     "Membre",
  officer:    "Officier",
  director:   "Directeur",
  ceo:        "CEO",
  admin:      "Administrateur",
  suspended:  "Suspendu",
};

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { accounts: true },
  });

  if (!user) redirect("/login");

  const eveAccount = user.accounts.find((a) => a.provider === "eveonline");
  const characterId = eveAccount?.providerAccountId;
  const role = (user.role ?? "candidate") as UserRole;

  return (
    <div className="py-10 sm:py-14">
      <Container size="md">
        <div className="mb-8">
          <p className="text-gold text-xs font-semibold tracking-extra-wide uppercase mb-2">
            Profil
          </p>
          <h1 className="font-display font-bold text-3xl text-text-primary">
            Mon profil
          </h1>
        </div>

        <Separator gold className="mb-8" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Portrait + identité */}
          <Card className="md:col-span-1">
            <CardBody className="flex flex-col items-center text-center gap-4 py-8">
              {user.image ? (
                <Image
                  src={user.image}
                  alt={user.name ?? "Portrait"}
                  width={128}
                  height={128}
                  className="rounded-full border-2 border-gold/20"
                  unoptimized
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-bg-elevated border-2 border-border flex items-center justify-center">
                  <span className="text-text-muted text-2xl font-display font-bold">
                    {(user.name ?? "?")[0]}
                  </span>
                </div>
              )}
              <div>
                <h2 className="font-display font-bold text-xl text-text-primary">
                  {user.name ?? "Pilote inconnu"}
                </h2>
                <Badge variant="gold" className="mt-2">
                  {ROLE_LABELS[role]}
                </Badge>
              </div>
            </CardBody>
          </Card>

          {/* Détails */}
          <div className="md:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <h3 className="font-display font-semibold text-base text-text-primary">
                  Personnage EVE
                </h3>
              </CardHeader>
              <CardBody className="space-y-4">
                <InfoRow label="Nom" value={user.name ?? "—"} />
                {characterId && (
                  <InfoRow label="Character ID" value={characterId} mono />
                )}
                <InfoRow
                  label="Membre depuis"
                  value={user.createdAt.toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                />
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Image
                    src={
                      role === "member_uz"
                        ? CORPORATIONS.urbanZone.logoUrl(64)
                        : CORPORATIONS.tabou.logoUrl(64)
                    }
                    alt={role === "member_uz" ? "Urban Zone" : "Tabou"}
                    width={32}
                    height={32}
                    className="rounded-sm"
                    unoptimized
                  />
                  <h3 className="font-display font-semibold text-base text-text-primary">
                    {role === "member_uz" ? "Corporation Urban Zone" : "Corporation Tabou"}
                  </h3>
                </div>
              </CardHeader>
              <CardBody className="space-y-4">
                <InfoRow label="Rôle" value={ROLE_LABELS[role]} />
                <InfoRow
                  label="Statut"
                  value={role === "candidate" ? "En période d'essai" : "Membre actif"}
                />
              </CardBody>
            </Card>

            {/* Bio éditable */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-semibold text-base text-text-primary">
                    Présentation
                  </h3>
                  <span className="text-text-muted text-xs">Visible dans l&apos;annuaire</span>
                </div>
              </CardHeader>
              <CardBody>
                <BioEditor initialBio={user.bio ?? ""} />
              </CardBody>
            </Card>

            <p className="text-text-muted text-xs leading-relaxed px-1">
              Les données de skillpoints, killboard et assets seront disponibles en V6
              via l&apos;intégration EVE ESI.
            </p>
          </div>
        </div>
      </Container>
    </div>
  );
}

function InfoRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-text-muted text-sm flex-shrink-0">{label}</span>
      <span className={`text-text-secondary text-sm text-right ${mono ? "font-mono text-xs" : ""}`}>
        {value}
      </span>
    </div>
  );
}
