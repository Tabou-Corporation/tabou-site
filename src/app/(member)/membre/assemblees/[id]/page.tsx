import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { hasMinRole } from "@/types/roles";
import { Container } from "@/components/layout/Container";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Separator } from "@/components/ui/Separator";
import { ArrowLeft, Pencil, Video, ExternalLink } from "lucide-react";
import { deleteAssembly } from "@/lib/actions/content";
import { DeleteButton } from "@/components/ui/DeleteButton";
import { RichTextContent } from "@/components/ui/RichTextContent";
import { CORPORATIONS } from "@/lib/constants/corporations";
import { AssemblyToc } from "@/components/assemblies/AssemblyToc";
import type { UserRole } from "@/types/roles";

const ASSEMBLY_TYPE_LABELS: Record<string, string> = {
  monthly: "Mensuelle",
  extraordinary: "Exceptionnelle",
};

/** Extract YouTube video ID from various URL formats */
function getYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const re of patterns) {
    const m = url.match(re);
    if (m?.[1]) return m[1];
  }
  return null;
}

export default async function AssemblyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const role = (session.user.role ?? "candidate") as UserRole;
  if (!hasMinRole(role, "member_uz")) redirect("/membre");

  const isOfficer = hasMinRole(role, "officer");

  const assembly = await prisma.assembly.findUnique({
    where: { id },
    include: { author: true },
  });
  if (!assembly) notFound();

  const youtubeId = assembly.videoUrl != null ? getYouTubeId(assembly.videoUrl) : null;

  return (
    <div className="py-10 sm:py-14">
      <Container size="md">
        {/* Nav */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/membre/assemblees"
            className="inline-flex items-center gap-1.5 text-text-muted text-sm hover:text-text-secondary transition-colors"
          >
            <ArrowLeft size={14} />
            Retour aux assemblées
          </Link>
          {isOfficer && (
            <div className="flex items-center gap-3">
              <Link
                href={`/staff/assemblees/${id}/edit`}
                className="inline-flex items-center gap-1.5 text-gold text-xs hover:text-gold-light transition-colors"
              >
                <Pencil size={13} />
                Modifier
              </Link>
              <DeleteButton
                action={deleteAssembly.bind(null, id)}
                confirmMessage={`Supprimer "${assembly.title}" définitivement ?`}
                className="text-text-muted text-xs hover:text-red-400 transition-colors"
              />
            </div>
          )}
        </div>

        {/* Header */}
        <div className="mb-6">
          <Badge
            variant={assembly.type === "extraordinary" ? "gold" : "muted"}
            className="mb-3"
          >
            {ASSEMBLY_TYPE_LABELS[assembly.type] ?? assembly.type}
          </Badge>
          <h1 className="font-display font-bold text-3xl text-text-primary mb-2">
            {assembly.title}
          </h1>
          <p className="text-text-muted text-xs">
            Par {assembly.author.name ?? "Officier"} ·{" "}
            {new Date(assembly.heldAt).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>

        <Separator gold className="mb-8" />

        {/* Video embed */}
        {assembly.videoUrl && (
          <div className="mb-8">
            {youtubeId ? (
              <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-border/60">
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${youtubeId}`}
                  title={assembly.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full"
                />
              </div>
            ) : (
              <a
                href={assembly.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm border border-border rounded hover:border-gold/40 hover:text-gold hover:bg-gold/5 text-text-secondary transition-colors"
              >
                <Video size={16} />
                Voir l&apos;enregistrement vidéo
                <ExternalLink size={12} className="text-text-muted" />
              </a>
            )}
          </div>
        )}

        {/* Official Document */}
        <Card>
          {/* En-tête officiel avec logo */}
          <div className="assembly-official-header">
            <Image
              src={CORPORATIONS.tabou.logoUrl(128)}
              alt="Tabou Corporation"
              width={56}
              height={56}
              className="flex-shrink-0"
              unoptimized
            />
            <div className="min-w-0">
              <p className="text-gold text-2xs font-semibold tracking-extra-wide uppercase">
                Tabou Corporation — Document officiel
              </p>
              <p className="text-text-primary font-display font-semibold text-lg leading-tight mt-0.5">
                {assembly.title}
              </p>
              <p className="text-text-muted text-xs mt-0.5">
                Réunion du{" "}
                {new Date(assembly.heldAt).toLocaleDateString("fr-FR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>

          <CardBody>
            {/* Table des matières auto-générée */}
            <AssemblyToc html={assembly.content} />

            {/* Contenu */}
            <RichTextContent html={assembly.content} />
          </CardBody>
        </Card>
      </Container>
    </div>
  );
}
