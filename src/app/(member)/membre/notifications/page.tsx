import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { hasMinRole } from "@/types/roles";
import { Container } from "@/components/layout/Container";
import { Card, CardBody } from "@/components/ui/Card";
import { Separator } from "@/components/ui/Separator";
import {
  Bell, MessageSquare, CheckCircle, XCircle, Store, Clock,
} from "lucide-react";
import type { UserRole } from "@/types/roles";

const TYPE_ICON: Record<string, React.ReactNode> = {
  offer_received: <MessageSquare size={14} className="text-gold" />,
  offer_accepted: <CheckCircle size={14} className="text-green-400" />,
  offer_rejected: <XCircle size={14} className="text-red-400/70" />,
  listing_sold:   <Store size={14} className="text-gold" />,
  listing_expired: <Clock size={14} className="text-text-muted" />,
};

function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 60) return "il y a quelques minutes";
  if (hours < 24) return `il y a ${hours}h`;
  if (days === 1) return "hier";
  if (days < 7) return `il y a ${days} jours`;
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const role = (session.user.role ?? "candidate") as UserRole;
  if (!hasMinRole(role, "member_uz")) redirect("/membre");

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  // Marquer toutes comme lues en visitant la page
  const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
  if (unreadIds.length > 0) {
    await prisma.notification.updateMany({
      where: { id: { in: unreadIds } },
      data: { read: true },
    });
  }

  const unreadCount = unreadIds.length;

  return (
    <div className="py-10 sm:py-14">
      <Container>
        <div className="flex items-start justify-between mb-8">
          <div>
            <p className="text-gold text-xs font-semibold tracking-extra-wide uppercase mb-2">
              Espace membre
            </p>
            <h1 className="font-display font-bold text-3xl text-text-primary">
              Notifications
            </h1>
            <p className="text-text-muted text-sm mt-2">
              {unreadCount > 0
                ? `${unreadCount} notification${unreadCount > 1 ? "s" : ""} non lue${unreadCount > 1 ? "s" : ""} — marquees comme lues.`
                : "Toutes les notifications sont lues."}
            </p>
          </div>
        </div>

        <Separator gold className="mb-6" />

        {notifications.length === 0 ? (
          <Card>
            <CardBody className="py-12 text-center">
              <Bell size={32} className="text-text-muted mx-auto mb-3" />
              <p className="text-text-muted text-sm">Aucune notification.</p>
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-1.5">
            {notifications.map((n) => {
              const isUnread = unreadIds.includes(n.id);

              const content = (
                <Card interactive={!!n.href} className={isUnread ? "border-gold/20" : ""}>
                  <CardBody className="py-3 px-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex-shrink-0">
                        {TYPE_ICON[n.type] ?? <Bell size={14} className="text-text-muted" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-text-primary text-sm font-medium truncate">
                            {n.title}
                          </p>
                          {isUnread && (
                            <span className="w-2 h-2 rounded-full bg-gold flex-shrink-0" />
                          )}
                        </div>
                        {n.body && (
                          <p className="text-text-secondary text-xs mt-0.5 leading-relaxed">
                            {n.body}
                          </p>
                        )}
                        <p className="text-text-muted text-[11px] mt-1">
                          {timeAgo(n.createdAt)}
                        </p>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              );

              return n.href ? (
                <Link key={n.id} href={n.href} className="block">
                  {content}
                </Link>
              ) : (
                <div key={n.id}>{content}</div>
              );
            })}
          </div>
        )}
      </Container>
    </div>
  );
}
