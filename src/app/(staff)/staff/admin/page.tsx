import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { hasMinRole } from "@/types/roles";
import { Container } from "@/components/layout/Container";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Separator } from "@/components/ui/Separator";
import { Users, FileText, BookOpen, Calendar, Megaphone, Shield, PenLine } from "lucide-react";
import type { UserRole } from "@/types/roles";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const role = (session.user.role ?? "candidate") as UserRole;
  if (!hasMinRole(role, "admin")) redirect("/membre");

  const [userCounts, appCounts, guidesCount, eventsCount, announcementsCount] = await Promise.all([
    prisma.user.groupBy({ by: ["role"], _count: true }),
    prisma.application.groupBy({ by: ["status"], _count: true }),
    prisma.guide.count(),
    prisma.calendarEvent.count({ where: { startAt: { gte: new Date() } } }),
    prisma.announcement.count(),
  ]);

  const userMap = Object.fromEntries(userCounts.map((c) => [c.role, c._count]));
  const appMap  = Object.fromEntries(appCounts.map((c) => [c.status, c._count]));

  const totalMembers = (userMap["member"] ?? 0) + (userMap["recruiter"] ?? 0)
    + (userMap["officer"] ?? 0) + (userMap["admin"] ?? 0);

  const stats = [
    {
      icon: <Users size={18} className="text-gold/70" />,
      label: "Membres actifs",
      value: totalMembers,
      sub: `${userMap["candidate"] ?? 0} candidat(s) en attente`,
    },
    {
      icon: <FileText size={18} className="text-gold/70" />,
      label: "Candidatures",
      value: (appMap["PENDING"] ?? 0) + (appMap["INTERVIEW"] ?? 0),
      sub: `${appMap["PENDING"] ?? 0} en attente · ${appMap["INTERVIEW"] ?? 0} en entretien`,
    },
    {
      icon: <BookOpen size={18} className="text-gold/70" />,
      label: "Guides",
      value: guidesCount,
      sub: "Documents internes",
    },
    {
      icon: <Calendar size={18} className="text-gold/70" />,
      label: "Événements à venir",
      value: eventsCount,
      sub: "Opérations planifiées",
    },
    {
      icon: <Megaphone size={18} className="text-gold/70" />,
      label: "Annonces",
      value: announcementsCount,
      sub: "Publications actives",
    },
    {
      icon: <Shield size={18} className="text-gold/70" />,
      label: "Officiers & Admins",
      value: (userMap["officer"] ?? 0) + (userMap["admin"] ?? 0),
      sub: `${userMap["recruiter"] ?? 0} recruteur(s)`,
    },
  ];

  const roleBreakdown = [
    { label: "Administrateurs", value: userMap["admin"] ?? 0 },
    { label: "Officiers",       value: userMap["officer"] ?? 0 },
    { label: "Recruteurs",      value: userMap["recruiter"] ?? 0 },
    { label: "Membres",         value: userMap["member"] ?? 0 },
    { label: "Candidats",       value: userMap["candidate"] ?? 0 },
  ];

  return (
    <div className="py-10 sm:py-14">
      <Container>
        <div className="mb-8">
          <p className="text-gold text-xs font-semibold tracking-extra-wide uppercase mb-2">Zone staff</p>
          <h1 className="font-display font-bold text-3xl text-text-primary">Administration</h1>
          <p className="text-text-muted text-sm mt-1">Vue d&apos;ensemble de la corporation</p>
        </div>

        <Separator gold className="mb-8" />

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
          {stats.map((s) => (
            <Card key={s.label}>
              <CardBody className="flex items-start gap-3 py-4">
                <span className="mt-0.5 flex-shrink-0">{s.icon}</span>
                <div>
                  <p className="text-text-primary font-display font-bold text-2xl leading-none">
                    {s.value}
                  </p>
                  <p className="text-text-secondary text-sm font-medium mt-0.5">{s.label}</p>
                  <p className="text-text-muted text-xs mt-0.5">{s.sub}</p>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>

        {/* CMS */}
        <Link
          href="/staff/admin/contenu"
          className="flex items-center gap-4 p-5 border border-gold/30 rounded-md bg-gold/5 hover:bg-gold/10 transition-colors group mb-8"
        >
          <PenLine size={20} className="text-gold flex-shrink-0" />
          <div className="flex-1">
            <p className="font-display font-semibold text-base text-text-primary">
              Contenu du site
            </p>
            <p className="text-text-muted text-sm mt-0.5">
              Modifier les textes des pages publiques (accueil, corporation, recrutement, FAQ, activités, contact)
            </p>
          </div>
          <span className="text-gold/60 group-hover:text-gold transition-colors text-sm">→</span>
        </Link>

        {/* Répartition rôles */}
        <Card>
          <CardHeader>
            <h2 className="font-display font-semibold text-base text-text-primary">
              Répartition par rôle
            </h2>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              {roleBreakdown.map((r) => {
                const total = Object.values(userMap).reduce((a, b) => a + b, 0) || 1;
                const pct = Math.round((r.value / total) * 100);
                return (
                  <div key={r.label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-text-secondary text-sm">{r.label}</span>
                      <span className="text-text-muted text-xs">{r.value} ({pct}%)</span>
                    </div>
                    <div className="h-1.5 bg-bg-elevated rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gold/60 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>
      </Container>
    </div>
  );
}
