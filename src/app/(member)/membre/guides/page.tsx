import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { hasMinRole } from "@/types/roles";
import { Container } from "@/components/layout/Container";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Separator } from "@/components/ui/Separator";
import { BookOpen, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CATEGORY_LABELS, CATEGORY_ORDER } from "@/lib/constants/labels";
import type { UserRole } from "@/types/roles";

export default async function GuidesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const role = (session.user.role ?? "candidate") as UserRole;
  if (!hasMinRole(role, "member_uz")) redirect("/membre");

  const isOfficer = hasMinRole(role, "officer");

  const guides = await prisma.guide.findMany({
    include: { author: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  // Grouper par catégorie
  const grouped = CATEGORY_ORDER.reduce<Record<string, typeof guides>>(
    (acc, cat) => {
      const items = guides.filter((g) => g.category === cat);
      if (items.length > 0) acc[cat] = items;
      return acc;
    },
    {}
  );

  // Catégories inconnues en fin
  guides.forEach((g) => {
    if (!(CATEGORY_ORDER as readonly string[]).includes(g.category)) {
      if (!grouped[g.category]) grouped[g.category] = [];
      grouped[g.category]!.push(g);
    }
  });

  return (
    <div className="py-10 sm:py-14">
      <Container>
        <div className="flex items-start justify-between mb-8">
          <div>
            <p className="text-gold text-xs font-semibold tracking-extra-wide uppercase mb-2">
              Espace membre
            </p>
            <h1 className="font-display font-bold text-3xl text-text-primary">
              Guides
            </h1>
          </div>
          {isOfficer && (
            <Button as="a" href="/staff/guides/new" size="sm">
              <Plus size={14} />
              Nouveau guide
            </Button>
          )}
        </div>

        <Separator gold className="mb-8" />

        {guides.length === 0 ? (
          <Card>
            <CardBody className="py-12 text-center">
              <BookOpen size={32} className="text-text-muted mx-auto mb-3" />
              <p className="text-text-muted text-sm">Aucun guide pour le moment.</p>
              {isOfficer && (
                <Link
                  href="/staff/guides/new"
                  className="inline-flex items-center gap-1.5 text-gold text-xs mt-3 hover:text-gold-light transition-colors"
                >
                  <Plus size={13} />
                  Créer le premier guide
                </Link>
              )}
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-8">
            {Object.entries(grouped).map(([cat, items]) => (
              <div key={cat}>
                <h2 className="text-text-muted text-xs font-semibold uppercase tracking-extra-wide mb-3">
                  {CATEGORY_LABELS[cat] ?? cat}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {items.map((guide) => (
                    <Link key={guide.id} href={`/membre/guides/${guide.id}`}>
                      <Card interactive className="h-full">
                        <CardBody className="flex items-start gap-3 py-4">
                          <BookOpen size={16} className="text-gold/60 mt-0.5 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-text-primary text-sm font-display font-semibold leading-snug mb-1">
                              {guide.title}
                            </p>
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="muted">
                                {CATEGORY_LABELS[guide.category] ?? guide.category}
                              </Badge>
                              <span className="text-text-muted text-xs">
                                {guide.author.name ?? "Officier"}
                              </span>
                            </div>
                          </div>
                        </CardBody>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Container>
    </div>
  );
}
