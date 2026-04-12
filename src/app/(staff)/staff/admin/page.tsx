import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { hasMinRole } from "@/types/roles";
import { Container } from "@/components/layout/Container";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Separator } from "@/components/ui/Separator";
import { ROLE_LABELS } from "@/lib/constants/labels";
import { CORPORATIONS } from "@/lib/constants/corporations";
import {
  Users, FileText, Megaphone, PenLine,
  AlertTriangle, ClipboardList, UserPlus, UserMinus, RefreshCw, ArrowRight,
  TrendingUp, TrendingDown,
} from "lucide-react";
import { AdminSyncButton } from "./AdminSyncButton";
import type { UserRole } from "@/types/roles";

export const dynamic = "force-dynamic";

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatRelativeDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "À l\u2019instant";
  if (diffMin < 60) return `il y a ${diffMin}min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `il y a ${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD === 1) return "Hier";
  return `il y a ${diffD}j`;
}

function auditActionLabel(action: string, meta: Record<string, unknown>): string {
  switch (action) {
    case "role_change":
      return `a changé le rôle de ${meta.targetName ?? "?"} : ${ROLE_LABELS[meta.from as string] ?? meta.from} → ${ROLE_LABELS[meta.to as string] ?? meta.to}`;
    case "application_status": {
      const statusMap: Record<string, string> = {
        PENDING: "en attente", INTERVIEW: "en entretien",
        ACCEPTED: "acceptée", REJECTED: "refusée",
      };
      return `a passé une candidature en ${statusMap[meta.to as string] ?? meta.to}`;
    }
    case "application_withdraw":
      return "a retiré sa candidature";
    case "corp_sync_role_change":
      return `sync : ${meta.userName ?? "?"} → ${ROLE_LABELS[meta.newRole as string] ?? meta.newRole}`;
    case "corp_sync_corp_update":
      return `sync : ${meta.userName ?? "?"} a changé de corporation`;
    default:
      return action;
  }
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const role = (session.user.role ?? "candidate") as UserRole;
  if (!hasMinRole(role, "director")) redirect("/membre");

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    userCounts,
    appCounts,
    guidesCount,
    eventsCount,
    announcementsCount,
    recentAuditLogs,
    newMembersThisMonth,
    suspendedThisMonth,
    recentLogins,
    desyncUsers,
  ] = await Promise.all([
    prisma.user.groupBy({ by: ["role"], _count: true }),
    prisma.application.groupBy({ by: ["status"], _count: true }),
    prisma.guide.count(),
    prisma.calendarEvent.count({ where: { startAt: { gte: now } } }),
    prisma.announcement.count(),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.user.count({
      where: {
        createdAt: { gte: thirtyDaysAgo },
        role: { in: ["member", "member_uz", "officer", "director", "ceo", "admin"] },
      },
    }),
    prisma.user.count({
      where: {
        updatedAt: { gte: thirtyDaysAgo },
        role: "suspended",
      },
    }),
    prisma.session.count({
      where: { expires: { gte: sevenDaysAgo } },
    }),
    // Membres dont corporationId ne correspond pas à Tabou/UZ mais qui ont un rôle membre+
    prisma.user.findMany({
      where: {
        role: { in: ["member", "member_uz", "officer", "director", "ceo", "admin"] },
        NOT: {
          corporationId: { in: [CORPORATIONS.tabou.id, CORPORATIONS.urbanZone.id] },
        },
      },
      select: { id: true, name: true, role: true, corporationId: true },
    }),
  ]);

  const userMap = Object.fromEntries(userCounts.map((c) => [c.role, c._count]));
  const appMap = Object.fromEntries(appCounts.map((c) => [c.status, c._count]));

  const tabouCount = (userMap["member"] ?? 0) + (userMap["officer"] ?? 0)
    + (userMap["director"] ?? 0) + (userMap["ceo"] ?? 0) + (userMap["admin"] ?? 0);
  const uzCount = userMap["member_uz"] ?? 0;
  const totalMembers = tabouCount + uzCount;
  const pendingApps = (appMap["PENDING"] ?? 0) + (appMap["INTERVIEW"] ?? 0);
  const candidateCount = userMap["candidate"] ?? 0;

  // Alertes
  const alerts: { icon: React.ReactNode; text: string; href?: string; level: "warn" | "error" }[] = [];

  if (pendingApps > 0) {
    alerts.push({
      icon: <ClipboardList size={14} />,
      text: `${pendingApps} candidature${pendingApps > 1 ? "s" : ""} en attente`,
      href: "/staff/candidatures",
      level: "warn",
    });
  }

  if (desyncUsers.length > 0) {
    const names = desyncUsers.map((u) => u.name ?? "???").join(", ");
    alerts.push({
      icon: <AlertTriangle size={14} />,
      text: `${desyncUsers.length} membre${desyncUsers.length > 1 ? "s" : ""} hors corporation (ESI) : ${names}`,
      href: "/staff/membres",
      level: "error",
    });
  }

  // Dernier sync
  const lastSync = recentAuditLogs.find(
    (l) => l.action === "corp_sync_role_change" || l.action === "corp_sync_corp_update"
  );

  // Répartition par rôle (filtre les lignes à 0)
  const roleBreakdown = [
    { label: "Administrateurs", key: "admin" },
    { label: "CEO", key: "ceo" },
    { label: "Directeurs", key: "director" },
    { label: "Officiers", key: "officer" },
    { label: "Membres Tabou", key: "member" },
    { label: "Membres UZ", key: "member_uz" },
    { label: "Candidats", key: "candidate" },
  ].filter((r) => (userMap[r.key] ?? 0) > 0);

  const totalUsers = Object.values(userMap).reduce((a, b) => a + b, 0) || 1;

  return (
    <div className="py-10 sm:py-14">
      <Container>
        {/* ── Header ── */}
        <div className="mb-8">
          <p className="text-gold text-xs font-semibold tracking-extra-wide uppercase mb-2">
            Zone staff
          </p>
          <h1 className="font-display font-bold text-3xl text-text-primary">
            Administration
          </h1>
          <p className="text-text-muted text-sm mt-1">
            Vue d&apos;ensemble de la corporation
          </p>
        </div>

        <Separator gold className="mb-8" />

        {/* ── Alertes ── */}
        {alerts.length > 0 && (
          <div className="space-y-2 mb-8">
            {alerts.map((a, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 px-4 py-3 rounded-md border ${
                  a.level === "error"
                    ? "bg-red-500/5 border-red-500/20 text-red-400"
                    : "bg-gold/5 border-gold/20 text-gold"
                }`}
              >
                {a.icon}
                <span className="text-sm font-medium flex-1">{a.text}</span>
                {a.href && (
                  <Link href={a.href} className="text-xs underline underline-offset-2 opacity-80 hover:opacity-100">
                    Voir →
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── Chiffres clés ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Effectif */}
          <Card>
            <CardBody className="py-4">
              <div className="flex items-center gap-2 mb-2">
                <Users size={16} className="text-gold/70" />
                <span className="text-text-muted text-xs font-semibold uppercase tracking-wider">Effectif</span>
              </div>
              <p className="font-display font-bold text-3xl text-text-primary leading-none">
                {totalMembers}
              </p>
              <p className="text-text-muted text-xs mt-1.5">
                {tabouCount} Tabou · {uzCount} UZ
              </p>
              {(newMembersThisMonth > 0 || suspendedThisMonth > 0) && (
                <div className="flex items-center gap-3 mt-2 text-xs">
                  {newMembersThisMonth > 0 && (
                    <span className="flex items-center gap-1 text-emerald-400">
                      <TrendingUp size={12} /> +{newMembersThisMonth}
                    </span>
                  )}
                  {suspendedThisMonth > 0 && (
                    <span className="flex items-center gap-1 text-red-400">
                      <TrendingDown size={12} /> -{suspendedThisMonth}
                    </span>
                  )}
                  <span className="text-text-muted">ce mois</span>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Recrutement */}
          <Card>
            <CardBody className="py-4">
              <div className="flex items-center gap-2 mb-2">
                <UserPlus size={16} className="text-gold/70" />
                <span className="text-text-muted text-xs font-semibold uppercase tracking-wider">Recrutement</span>
              </div>
              <p className="font-display font-bold text-3xl text-text-primary leading-none">
                {pendingApps}
              </p>
              <p className="text-text-muted text-xs mt-1.5">
                {appMap["PENDING"] ?? 0} en attente · {appMap["INTERVIEW"] ?? 0} en entretien
              </p>
              {candidateCount > 0 && (
                <p className="text-text-muted text-xs mt-0.5">
                  {candidateCount} candidat{candidateCount > 1 ? "s" : ""} inscrits
                </p>
              )}
            </CardBody>
          </Card>

          {/* Contenu */}
          <Card>
            <CardBody className="py-4">
              <div className="flex items-center gap-2 mb-2">
                <Megaphone size={16} className="text-gold/70" />
                <span className="text-text-muted text-xs font-semibold uppercase tracking-wider">Contenu</span>
              </div>
              <p className="font-display font-bold text-3xl text-text-primary leading-none">
                {announcementsCount + guidesCount + eventsCount}
              </p>
              <p className="text-text-muted text-xs mt-1.5">
                {announcementsCount} annonce{announcementsCount !== 1 ? "s" : ""}
                {" · "}{guidesCount} guide{guidesCount !== 1 ? "s" : ""}
                {" · "}{eventsCount} événement{eventsCount !== 1 ? "s" : ""}
              </p>
            </CardBody>
          </Card>

          {/* Activité */}
          <Card>
            <CardBody className="py-4">
              <div className="flex items-center gap-2 mb-2">
                <RefreshCw size={16} className="text-gold/70" />
                <span className="text-text-muted text-xs font-semibold uppercase tracking-wider">Activité</span>
              </div>
              <p className="font-display font-bold text-3xl text-text-primary leading-none">
                {recentLogins}
              </p>
              <p className="text-text-muted text-xs mt-1.5">
                sessions cette semaine
              </p>
              {lastSync && (
                <p className="text-text-muted text-xs mt-0.5">
                  Dernier sync : {formatRelativeDate(lastSync.createdAt)}
                </p>
              )}
            </CardBody>
          </Card>
        </div>

        {/* ── Accès rapides + Répartition ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">

          {/* Accès rapides */}
          <div className="space-y-2">
            <h2 className="text-text-muted text-xs font-semibold uppercase tracking-wider mb-3 px-1">
              Accès rapides
            </h2>
            <Link
              href="/staff/candidatures"
              className="flex items-center gap-3 px-4 py-3 border border-border rounded-md hover:border-gold/30 hover:bg-gold/5 transition-colors group"
            >
              <ClipboardList size={16} className="text-gold/60 group-hover:text-gold" />
              <span className="text-sm text-text-secondary group-hover:text-text-primary flex-1">
                Candidatures
              </span>
              {pendingApps > 0 && (
                <span className="bg-gold text-bg-deep text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {pendingApps}
                </span>
              )}
              <ArrowRight size={14} className="text-text-muted group-hover:text-gold" />
            </Link>
            <Link
              href="/staff/admin/contenu"
              className="flex items-center gap-3 px-4 py-3 border border-border rounded-md hover:border-gold/30 hover:bg-gold/5 transition-colors group"
            >
              <PenLine size={16} className="text-gold/60 group-hover:text-gold" />
              <span className="text-sm text-text-secondary group-hover:text-text-primary flex-1">
                Contenu du site
              </span>
              <ArrowRight size={14} className="text-text-muted group-hover:text-gold" />
            </Link>
            <Link
              href="/staff/membres"
              className="flex items-center gap-3 px-4 py-3 border border-border rounded-md hover:border-gold/30 hover:bg-gold/5 transition-colors group"
            >
              <Users size={16} className="text-gold/60 group-hover:text-gold" />
              <span className="text-sm text-text-secondary group-hover:text-text-primary flex-1">
                Gestion des membres
              </span>
              {desyncUsers.length > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {desyncUsers.length}
                </span>
              )}
              <ArrowRight size={14} className="text-text-muted group-hover:text-gold" />
            </Link>
            <AdminSyncButton />
          </div>

          {/* Répartition par rôle */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="py-4">
                <h2 className="font-display font-semibold text-sm text-text-primary">
                  Répartition par rôle
                </h2>
              </CardHeader>
              <CardBody className="py-4">
                <div className="space-y-2.5">
                  {roleBreakdown.map((r) => {
                    const count = userMap[r.key] ?? 0;
                    const pct = Math.round((count / totalUsers) * 100);
                    return (
                      <div key={r.key}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-text-secondary text-sm">{r.label}</span>
                          <span className="text-text-muted text-xs tabular-nums">
                            {count} <span className="text-text-muted/50">({pct}%)</span>
                          </span>
                        </div>
                        <div className="h-1.5 bg-bg-elevated rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gold/60 rounded-full transition-all"
                            style={{ width: `${Math.max(pct, 2)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardBody>
            </Card>
          </div>
        </div>

        {/* ── Activité récente ── */}
        <Card>
          <CardHeader className="py-4">
            <h2 className="font-display font-semibold text-sm text-text-primary">
              Activité récente
            </h2>
          </CardHeader>
          <CardBody className="py-2">
            {recentAuditLogs.length === 0 ? (
              <p className="text-text-muted text-sm py-4 text-center">
                Aucune activité récente
              </p>
            ) : (
              <ul className="divide-y divide-border-subtle">
                {recentAuditLogs.map((log) => {
                  const meta = log.meta ? (JSON.parse(log.meta) as Record<string, unknown>) : {};
                  const isSys = log.actorId === "SYSTEM_SYNC";
                  const icon = isSys
                    ? <RefreshCw size={13} className="text-blue-400" />
                    : log.action.startsWith("application")
                      ? <FileText size={13} className="text-gold/60" />
                      : log.action === "role_change"
                        ? <UserMinus size={13} className="text-gold/60" />
                        : <Users size={13} className="text-text-muted" />;
                  return (
                    <li key={log.id} className="flex items-start gap-3 py-2.5">
                      <span className="mt-0.5 flex-shrink-0">{icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-text-secondary leading-snug">
                          {isSys ? (
                            <span className="text-blue-400 font-medium">Sync ESI</span>
                          ) : (
                            <span className="text-text-primary font-medium">{log.actorName ?? "Inconnu"}</span>
                          )}
                          {" "}
                          <span className="text-text-muted">{auditActionLabel(log.action, meta)}</span>
                        </p>
                      </div>
                      <span className="text-text-muted text-xs flex-shrink-0 whitespace-nowrap">
                        {formatRelativeDate(log.createdAt)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardBody>
        </Card>
      </Container>
    </div>
  );
}
