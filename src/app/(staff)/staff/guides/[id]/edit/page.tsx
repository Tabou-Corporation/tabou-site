import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { hasMinRole } from "@/types/roles";
import { Container } from "@/components/layout/Container";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Separator } from "@/components/ui/Separator";
import { ArrowLeft } from "lucide-react";
import { EditGuideForm } from "./EditGuideForm";
import type { UserRole } from "@/types/roles";

export default async function EditGuidePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const role = (session.user.role ?? "candidate") as UserRole;
  if (!hasMinRole(role, "officer")) redirect("/membre");

  const guide = await prisma.guide.findUnique({ where: { id } });
  if (!guide) notFound();

  return (
    <div className="py-10 sm:py-14">
      <Container size="md">
        <div className="mb-6">
          <Link
            href={`/membre/guides/${id}`}
            className="inline-flex items-center gap-1.5 text-text-muted text-sm hover:text-text-secondary transition-colors"
          >
            <ArrowLeft size={14} />
            Retour au guide
          </Link>
        </div>

        <div className="mb-8">
          <p className="text-gold text-xs font-semibold tracking-extra-wide uppercase mb-2">
            Zone recrutement
          </p>
          <h1 className="font-display font-bold text-3xl text-text-primary">
            Modifier le guide
          </h1>
        </div>

        <Separator gold className="mb-8" />

        <Card>
          <CardHeader>
            <h2 className="font-display font-semibold text-base text-text-primary">
              {guide.title}
            </h2>
          </CardHeader>
          <CardBody>
            <EditGuideForm
              id={id}
              defaultTitle={guide.title}
              defaultCategory={guide.category}
              defaultContent={guide.content}
            />
          </CardBody>
        </Card>
      </Container>
    </div>
  );
}
