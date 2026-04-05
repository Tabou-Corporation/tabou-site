import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { hasMinRole } from "@/types/roles";
import { Container } from "@/components/layout/Container";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Separator } from "@/components/ui/Separator";
import { AvatarDisplay } from "@/components/ui/AvatarDisplay";
import { Users } from "lucide-react";
import { ROLE_LABELS, ROLE_BADGE, ROLE_ORDER } from "@/lib/constants/labels";
import { cn } from "@/lib/utils/cn";
import type { UserRole } from "@/types/roles";

export default async function MembresPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter: rawFilter } = await searchParams;

  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const role = (session.user.role ?? "candidate") as UserRole;
  if (!hasMinRole(role, "director")) redirect("/membre");

  // Whitelist — seules ces valeurs sont acceptées en searchParam
  const VALID_FILTERS = ["all", "candidate", "member_uz", "member", "officer", "director", "ceo", "admin"] as const;
  type ValidFilter = typeof VALID_FILTERS[number];
  const filter: ValidFilter | undefined =
    rawFilter && (VALID_FILTERS as readonly string[]).includes(rawFilter)
      ? (rawFilter as ValidFilter)
      : undefined;

  const whereRole = filter && filter !== "all"
    ? { role: filter }
    : { role: { not: "public" } };

  const users = await prisma.user.findMany({
    where: whereRole,
    orderBy: { createdAt: "asc" },
  });

  const sorted = [...users].sort(
    (a, b) => (ROLE_ORDER[a.role] ?? 9) - (ROLE_ORDER[b.role] ?? 9)
  );

  const counts = await prisma.user.groupBy({
    by: ["role"],
    _count: true,
  });
  const countMap = Object.fromEntries(counts.map((c) => [c.role, c._count]));

  const tabs = [
    { key: "all",        label: "Tous",         count: users.length },
    { key: "candidate",  label: "Candidats",    count: countMap["candidate"] ?? 0 },
    { key: "member_uz",  label: "Urban Zone",   count: countMap["member_uz"] ?? 0 },
    { key: "member",     label: "Membres",      count: countMap["member"] ?? 0 },
    { key: "officer",    label: "Officiers",    count: countMap["officer"] ?? 0 },
    { key: "director",   label: "Directeurs",   count: (countMap["director"] ?? 0) + (countMap["ceo"] ?? 0) + (countMap["admin"] ?? 0) },
  ];

  return (
    <div className="py-10 sm:py-14">
      <Container>
        <div className="mb-8">
          <p className="text-gold text-xs font-semibold tracking-extra-wide uppercase mb-2">Zone staff</p>
          <h1 className="font-display font-bold text-3xl text-text-primary">Gestion des membres</h1>
          <p className="text-text-muted text-sm mt-1">{users.length} utilisateur{users.length > 1 ? "s" : ""}</p>
        </div>

        <Separator gold className="mb-6" />

        {/* Filtres */}
        <div className="flex flex-wrap gap-2 mb-6">
          {tabs.map((tab) => {
            const active = (filter ?? "all") === tab.key;
            return (
              <Link
                key={tab.key}
                href={`/staff/membres${tab.key !== "all" ? `?filter=${tab.key}` : ""}`}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors",
                  active
                    ? "bg-gold text-text-inverted"
                    : "bg-bg-elevated text-text-secondary border border-border hover:border-border-accent"
                )}
              >
                {tab.label}
                <span className={active ? "opacity-70" : "text-text-muted"}>
                  {tab.count}
                </span>
              </Link>
            );
          })}
        </div>

        {sorted.length === 0 ? (
          <Card>
            <CardBody className="py-12 text-center">
              <Users size={32} className="text-text-muted mx-auto mb-3" />
              <p className="text-text-muted text-sm">Aucun utilisateur dans cette catégorie.</p>
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-2">
            {sorted.map((u) => (
              <Link key={u.id} href={`/staff/membres/${u.id}`} className="block">
                <Card interactive>
                  <CardBody className="flex items-center gap-4 py-3">
                    <AvatarDisplay
                      image={u.image}
                      name={u.name}
                      size={36}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-text-primary font-display font-semibold text-sm truncate">
                        {u.name ?? "Pilote inconnu"}
                      </p>
                      <p className="text-text-muted text-xs">
                        Membre depuis {u.createdAt.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                    <Badge variant={ROLE_BADGE[u.role] ?? "muted"}>
                      {ROLE_LABELS[u.role] ?? u.role}
                    </Badge>
                  </CardBody>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </Container>
    </div>
  );
}
