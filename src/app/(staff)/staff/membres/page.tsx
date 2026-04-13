import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { hasMinRole } from "@/types/roles";
import { Container } from "@/components/layout/Container";
import { Card, CardBody } from "@/components/ui/Card";
import { Separator } from "@/components/ui/Separator";
import { Users, Pause } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { UserRole } from "@/types/roles";
import { MembersTable } from "./MembersTable";

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
  const VALID_FILTERS = ["all", "candidate", "member_uz", "member", "officer", "direction", "director", "ceo", "admin", "pause"] as const;
  type ValidFilter = typeof VALID_FILTERS[number];
  const filter: ValidFilter | undefined =
    rawFilter && (VALID_FILTERS as readonly string[]).includes(rawFilter)
      ? (rawFilter as ValidFilter)
      : undefined;

  const now = new Date();

  // "direction" = director + ceo + admin ; "pause" = absents actuellement
  const whereRole =
    filter === "direction"
      ? { role: { in: ["director", "ceo", "admin"] } }
      : filter === "pause"
      ? {
          role: { not: "public" },
          absenceStart: { lte: now },
          OR: [{ absenceEnd: null }, { absenceEnd: { gte: now } }],
        }
      : filter && filter !== "all"
      ? { role: filter }
      : { role: { not: "public" } };

  const [users, counts, pauseCount] = await Promise.all([
    prisma.user.findMany({
      where: whereRole,
      select: {
        id: true, name: true, image: true, role: true,
        createdAt: true, corporationId: true,
        absenceStart: true, absenceEnd: true,
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.user.groupBy({ by: ["role"], _count: true }),
    prisma.user.count({
      where: {
        role: { not: "public" },
        absenceStart: { lte: now },
        OR: [{ absenceEnd: null }, { absenceEnd: { gte: now } }],
      },
    }),
  ]);

  const countMap = Object.fromEntries(counts.map((c) => [c.role, c._count]));
  const totalAll = counts.filter(c => c.role !== "public").reduce((sum, c) => sum + c._count, 0);

  const tabs = [
    { key: "all",       label: "Tous",       count: totalAll },
    { key: "candidate", label: "Candidats",  count: countMap["candidate"] ?? 0 },
    { key: "member_uz", label: "Urban Zone", count: countMap["member_uz"] ?? 0 },
    { key: "member",    label: "Membres",    count: countMap["member"] ?? 0 },
    { key: "officer",   label: "Officiers",  count: countMap["officer"] ?? 0 },
    { key: "direction", label: "Direction",  count: (countMap["director"] ?? 0) + (countMap["ceo"] ?? 0) + (countMap["admin"] ?? 0) },
    { key: "pause",     label: "En pause",   count: pauseCount },
  ];

  // Serialize for client component
  const serialized = users.map((u) => ({
    id: u.id,
    name: u.name,
    image: u.image,
    role: u.role,
    createdAt: u.createdAt.toISOString(),
    corporationId: u.corporationId,
    absenceStart: u.absenceStart?.toISOString() ?? null,
    absenceEnd: u.absenceEnd?.toISOString() ?? null,
  }));

  return (
    <div className="py-10 sm:py-14">
      <Container>
        <div className="mb-8">
          <p className="text-gold text-xs font-semibold tracking-extra-wide uppercase mb-2">Zone staff</p>
          <h1 className="font-display font-bold text-3xl text-text-primary">Gestion des membres</h1>
          <p className="text-text-muted text-sm mt-1">{users.length} utilisateur{users.length > 1 ? "s" : ""}</p>
        </div>

        <Separator gold className="mb-6" />

        {/* Filtres par rôle */}
        <div className="flex flex-wrap gap-2 mb-6">
          {tabs.map((tab) => {
            const active = (filter ?? "all") === tab.key;
            return (
              <Link
                key={tab.key}
                href={`/staff/membres${tab.key !== "all" ? `?filter=${tab.key}` : ""}`}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors",
                  tab.key === "pause" && active
                    ? "bg-amber-500 text-black"
                    : tab.key === "pause" && !active
                    ? "bg-bg-elevated text-amber-400 border border-amber-500/30 hover:border-amber-500/60"
                    : active
                    ? "bg-gold text-text-inverted"
                    : "bg-bg-elevated text-text-secondary border border-border hover:border-border-accent"
                )}
              >
                {tab.key === "pause" && <Pause size={10} />}
                {tab.label}
                <span className={active ? "opacity-70" : "text-text-muted"}>
                  {tab.count}
                </span>
              </Link>
            );
          })}
        </div>

        {/* Table des membres */}
        {users.length === 0 ? (
          <Card>
            <CardBody className="py-12 text-center">
              <Users size={32} className="text-text-muted mx-auto mb-3" />
              <p className="text-text-muted text-sm">Aucun utilisateur dans cette catégorie.</p>
            </CardBody>
          </Card>
        ) : (
          <MembersTable users={serialized} />
        )}
      </Container>
    </div>
  );
}
