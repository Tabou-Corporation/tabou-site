import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { hasMinRole } from "@/types/roles";
import { Container } from "@/components/layout/Container";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Separator } from "@/components/ui/Separator";
import { ArrowLeft, Pencil } from "lucide-react";
import { deleteGuide } from "@/lib/actions/content";
import { DeleteButton } from "@/components/ui/DeleteButton";
import { CATEGORY_LABELS } from "@/lib/constants/labels";
import { RichTextContent } from "@/components/ui/RichTextContent";
import type { UserRole } from "@/types/roles";

export default async function GuideDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const role = (session.user.role ?? "candidate") as UserRole;
  if (!hasMinRole(role, "member")) redirect("/membre");

  const isOfficer = hasMinRole(role, "officer");

  const guide = await prisma.guide.findUnique({
    where: { id },
    include: { author: true },
  });
  if (!guide) notFound();

  return (
    <div className="py-10 sm:py-14">
      <Container size="md">
        {/* Retour */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/membre/guides"
            className="inline-flex items-center gap-1.5 text-text-muted text-sm hover:text-text-secondary transition-colors"
          >
            <ArrowLeft size={14} />
            Retour aux guides
          </Link>
          {isOfficer && (
            <div className="flex items-center gap-3">
              <Link
                href={`/staff/guides/${id}/edit`}
                className="inline-flex items-center gap-1.5 text-gold text-xs hover:text-gold-light transition-colors"
              >
                <Pencil size={13} />
                Modifier
              </Link>
              <DeleteButton
                action={deleteGuide.bind(null, id)}
                confirmMessage={`Supprimer le guide "${guide.title}" définitivement ?`}
                className="text-text-muted text-xs hover:text-red-400 transition-colors"
              />
            </div>
          )}
        </div>

        {/* En-tête */}
        <div className="mb-6">
          <Badge variant="muted" className="mb-3">
            {CATEGORY_LABELS[guide.category] ?? guide.category}
          </Badge>
          <h1 className="font-display font-bold text-3xl text-text-primary mb-2">
            {guide.title}
          </h1>
          <p className="text-text-muted text-xs">
            Par {guide.author.name ?? "Officier"} ·{" "}
            {guide.createdAt.toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
            {guide.updatedAt > guide.createdAt && (
              <> · mis à jour le{" "}
                {guide.updatedAt.toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}</>
            )}
          </p>
        </div>

        <Separator gold className="mb-8" />

        <Card>
          <CardBody>
            <RichTextContent html={guide.content} />
          </CardBody>
        </Card>
      </Container>
    </div>
  );
}
