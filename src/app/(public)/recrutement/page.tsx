import type { Metadata } from "next";
import { XCircle, CheckCircle, Shield, MessageSquare } from "lucide-react";

export const dynamic = "force-dynamic";

import { PageHeader } from "@/components/layout/PageHeader";
import { Section, SectionHeader } from "@/components/blocks/Section";
import { RecruitmentStepCard } from "@/components/blocks/RecruitmentStep";
import { Separator } from "@/components/ui/Separator";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

import { getRecruitmentContent } from "@/lib/site-content/loader";
import { RECRUITMENT_META } from "@/content/recruitment";
import { SITE_CONFIG } from "@/config/site";
import { auth } from "@/auth";
import { hasMinRole } from "@/types/roles";
import type { UserRole } from "@/types/roles";

export const metadata: Metadata = {
  title: RECRUITMENT_META.title,
  description: RECRUITMENT_META.description,
  alternates: { canonical: `${SITE_CONFIG.url}/recrutement` },
  openGraph: { url: `${SITE_CONFIG.url}/recrutement` },
};

export default async function RecruitmentPage() {
  const [recruitment, session] = await Promise.all([
    getRecruitmentContent(),
    auth(),
  ]);

  const role        = (session?.user?.role ?? null) as UserRole | null;
  const isCandidate = role === "candidate";
  const isMember    = role ? hasMinRole(role, "member_uz") : false;
  const isSuspended = role === "suspended";

  return (
    <>
      <PageHeader
        eyebrow={recruitment.intro.eyebrow}
        title={recruitment.intro.headline}
        description={recruitment.intro.body}
      />

      {/* ── Étapes du recrutement ─────────────────────────────────────── */}
      <Section bg="surface" spacing="lg">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          <div>
            <SectionHeader
              headline="Comment ça se passe"
              description="Un processus simple, en quatre étapes."
            />
            <div className="mt-8">
              {recruitment.steps.map((step, i) => (
                <RecruitmentStepCard
                  key={step.number}
                  step={step}
                  isLast={i === recruitment.steps.length - 1}
                />
              ))}
            </div>
          </div>

          {/* Prérequis + CTA */}
          <div className="space-y-8">
            <Card>
              <CardBody className="space-y-4">
                <h3 className="font-display font-bold text-xl text-text-primary">
                  {recruitment.requirements.headline}
                </h3>
                <ul className="space-y-3">
                  {recruitment.requirements.items.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <CheckCircle
                        size={15}
                        className="flex-shrink-0 mt-0.5 text-gold/60"
                        aria-hidden
                      />
                      <span className="text-text-secondary text-sm leading-relaxed">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>

            {/* CTA Candidature */}
            <div className="bg-bg-elevated border border-border-accent rounded-md p-6 space-y-4">
              <div className="flex items-center gap-3">
                <Shield size={20} className="text-gold" aria-hidden />
                <h3 className="font-display font-semibold text-lg text-text-primary">
                  Postuler dans Tabou
                </h3>
              </div>

              {/* Déjà membre */}
              {isMember && (
                <p className="text-gold text-sm font-semibold">
                  Vous êtes déjà membre de la corporation.
                </p>
              )}

              {/* Suspendu */}
              {isSuspended && (
                <p className="text-red-400 text-sm">
                  Votre accès est suspendu. Contactez un officier sur Discord.
                </p>
              )}

              {/* Candidature en cours */}
              {isCandidate && !isSuspended && (
                <>
                  <p className="text-text-secondary text-sm leading-relaxed">
                    Vous avez déjà un compte candidat. Consultez ou complétez votre candidature.
                  </p>
                  <Button as="a" href="/membre/candidature" variant="primary">
                    Voir ma candidature
                  </Button>
                </>
              )}

              {/* Non connecté */}
              {!session && (
                <>
                  <p className="text-text-secondary text-sm leading-relaxed">
                    Connexion en un clic avec ton compte EVE Online.
                    Aucune clé API requise — uniquement ton identité de personnage.
                  </p>
                  <Button
                    as="a"
                    href="/login?callbackUrl=/membre/candidature"
                    variant="primary"
                  >
                    Postuler avec EVE Online
                  </Button>
                  <p className="text-text-muted text-xs">
                    Après soumission, un recruteur te contactera sur Discord sous 48h.
                  </p>
                </>
              )}

              {/* Lien Discord secondaire — toujours visible */}
              <div className="pt-2 border-t border-border-subtle">
                <a
                  href={SITE_CONFIG.links.discord}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-text-muted text-xs hover:text-text-secondary transition-colors"
                >
                  <MessageSquare size={12} />
                  Rejoindre le Discord de la corporation
                </a>
              </div>
            </div>
          </div>
        </div>
      </Section>

      <Separator gold />

      {/* ── Profils recherchés ─────────────────────────────────────────── */}
      <Section bg="default" spacing="lg">
        <SectionHeader
          headline="Profils recherchés"
          description="Trois types de pilotes qui s'intègrent naturellement chez Tabou."
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {recruitment.wantedProfiles.map((profile) => (
            <Card key={profile.title} accent>
              <CardBody className="space-y-4">
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-gold/70 flex-shrink-0" />
                  <h3 className="font-display font-semibold text-lg text-text-primary">
                    {profile.title}
                  </h3>
                </div>
                <p className="text-text-secondary text-sm leading-relaxed">
                  {profile.description}
                </p>
                <ul className="space-y-1.5 pt-1">
                  {profile.traits.map((trait) => (
                    <li key={trait} className="flex items-start gap-2">
                      <span className="text-gold/40 text-xs mt-1 flex-shrink-0">—</span>
                      <span className="text-text-muted text-xs leading-relaxed">{trait}</span>
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          ))}
        </div>
      </Section>

      <Separator gold />

      {/* ── Profils non adaptés ────────────────────────────────────────── */}
      <Section bg="surface" spacing="lg">
        <SectionHeader
          headline="Profils non adaptés"
          description="Autant être directs. Ce n'est pas pour vous si :"
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {recruitment.notAdaptedProfiles.map((profile) => (
            <Card key={profile.title} className="border-red/20">
              <CardBody className="space-y-4">
                <div className="flex items-center gap-2">
                  <XCircle size={16} className="text-red-light/60 flex-shrink-0" />
                  <h3 className="font-display font-semibold text-lg text-text-primary">
                    {profile.title}
                  </h3>
                </div>
                <p className="text-text-secondary text-sm leading-relaxed">
                  {profile.description}
                </p>
                <ul className="space-y-1.5 pt-1">
                  {profile.traits.map((trait) => (
                    <li key={trait} className="flex items-start gap-2">
                      <span className="text-red/40 text-xs mt-1 flex-shrink-0">—</span>
                      <span className="text-text-muted text-xs leading-relaxed">{trait}</span>
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          ))}
        </div>
      </Section>
    </>
  );
}
