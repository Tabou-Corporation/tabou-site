import { redirect } from "next/navigation";
import Image from "next/image";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { hasMinRole } from "@/types/roles";
import { Container } from "@/components/layout/Container";
import { Card, CardBody } from "@/components/ui/Card";
import { Separator } from "@/components/ui/Separator";
import { LexiqueClient } from "./LexiqueClient";
import { Crown } from "lucide-react";
import type { UserRole } from "@/types/roles";

export default async function LexiquePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const role = (session.user.role ?? "candidate") as UserRole;
  if (!hasMinRole(role, "member_uz")) redirect("/membre");

  const [terms, topContributors] = await Promise.all([
    prisma.glossaryTerm.findMany({
      include: { author: { select: { name: true } } },
      orderBy: [{ category: "asc" }, { term: "asc" }],
    }),
    prisma.glossaryTerm.groupBy({
      by: ["authorId"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 1,
    }),
  ]);

  // Fetch top contributor details
  let topContributor: { name: string; characterId: string | null; count: number } | null = null;
  if (topContributors.length > 0) {
    const tc = topContributors[0]!;
    const user = await prisma.user.findUnique({
      where: { id: tc.authorId },
      select: { name: true, eveCharacterId: true },
    });
    if (user) {
      topContributor = {
        name: user.name ?? "Membre",
        characterId: user.eveCharacterId,
        count: tc._count.id,
      };
    }
  }

  const serialized = terms.map((t) => ({
    id: t.id,
    term: t.term,
    literal: t.literal,
    definition: t.definition,
    category: t.category,
    authorName: t.author.name ?? "Membre",
    createdAt: t.createdAt.toISOString(),
  }));

  return (
    <div className="py-10 sm:py-14">
      <Container size="lg">
        <div>
          <p className="text-gold text-xs font-semibold tracking-extra-wide uppercase mb-2">
            Espace membre
          </p>
          <h1 className="font-display font-bold text-3xl text-text-primary">
            Lexique EVE Online
          </h1>
          <p className="text-text-muted text-sm mt-1.5">
            Dictionnaire communautaire des termes et abréviations du jeu
          </p>
        </div>

        <Separator gold className="my-6" />

        {/* Top contributeur — Gardien du Savoir */}
        {topContributor && (
          <div className="mb-6">
            <Card className="border-gold/20 overflow-hidden">
              <CardBody className="py-4 px-5">
                <div className="flex items-center gap-4">
                  <div className="relative flex-shrink-0">
                    {topContributor.characterId ? (
                      <Image
                        src={`https://images.evetech.net/characters/${topContributor.characterId}/portrait?size=64`}
                        alt={topContributor.name}
                        width={52}
                        height={52}
                        className="rounded-full border-2 border-gold/40 shadow-lg shadow-gold/10"
                      />
                    ) : (
                      <div className="w-[52px] h-[52px] rounded-full bg-bg-elevated border-2 border-gold/40 flex items-center justify-center">
                        <Crown size={20} className="text-gold/60" />
                      </div>
                    )}
                    <div className="absolute -top-1 -right-1 bg-gold text-bg-deep rounded-full p-0.5">
                      <Crown size={10} />
                    </div>
                  </div>
                  <div>
                    <p className="text-gold text-[10px] font-bold tracking-extra-wide uppercase">
                      Gardien du Savoir
                    </p>
                    <p className="text-text-primary font-display font-semibold text-base">
                      {topContributor.name}
                    </p>
                    <p className="text-text-muted text-xs mt-0.5">
                      {topContributor.count} terme{topContributor.count > 1 ? "s" : ""} contribué{topContributor.count > 1 ? "s" : ""} au lexique
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        )}

        <LexiqueClient terms={serialized} />
      </Container>
    </div>
  );
}
