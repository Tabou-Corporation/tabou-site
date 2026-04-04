import type { Metadata } from "next";
import { XCircle, CheckCircle, MessageSquare } from "lucide-react";

import { PageHeader } from "@/components/layout/PageHeader";
import { Section, SectionHeader } from "@/components/blocks/Section";
import { RecruitmentStepCard } from "@/components/blocks/RecruitmentStep";
import { Separator } from "@/components/ui/Separator";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

import {
  RECRUITMENT_META,
  RECRUITMENT_INTRO,
  WANTED_PROFILES,
  NOT_ADAPTED_PROFILES,
  RECRUITMENT_STEPS,
  REQUIREMENTS,
  RECRUITMENT_CTA,
  RECRUITMENT_DISCORD,
} from "@/content/recruitment";

export const metadata: Metadata = {
  title: RECRUITMENT_META.title,
  description: RECRUITMENT_META.description,
};

export default function RecruitmentPage() {
  return (
    <>
      <PageHeader
        eyebrow={RECRUITMENT_INTRO.eyebrow}
        title={RECRUITMENT_INTRO.headline}
        description={RECRUITMENT_INTRO.body}
      />

      {/* ── Profils recherchés ─────────────────────────────────────────── */}
      <Section bg="surface" spacing="lg">
        <SectionHeader
          headline="Profils recherchés"
          description="Trois types de pilotes qui s'intègrent naturellement chez Tabou."
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {WANTED_PROFILES.map((profile) => (
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
      <Section bg="default" spacing="lg">
        <SectionHeader
          headline="Profils non adaptés"
          description="Autant être directs. Ce n'est pas pour vous si :"
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {NOT_ADAPTED_PROFILES.map((profile) => (
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

      <Separator gold />

      {/* ── Étapes du recrutement ─────────────────────────────────────── */}
      <Section bg="surface" spacing="lg">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          <div>
            <SectionHeader
              headline="Comment ça se passe"
              description="Un processus simple, en quatre étapes."
            />
            <div className="mt-8">
              {RECRUITMENT_STEPS.map((step, i) => (
                <RecruitmentStepCard
                  key={step.number}
                  step={step}
                  isLast={i === RECRUITMENT_STEPS.length - 1}
                />
              ))}
            </div>
          </div>

          {/* Prérequis + CTA */}
          <div className="space-y-8">
            <Card>
              <CardBody className="space-y-4">
                <h3 className="font-display font-bold text-xl text-text-primary">
                  {REQUIREMENTS.headline}
                </h3>
                <ul className="space-y-3">
                  {REQUIREMENTS.items.map((item) => (
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

            {/* Discord CTA block */}
            <div className="bg-bg-elevated border border-border-accent rounded-md p-6 space-y-4">
              <div className="flex items-center gap-3">
                <MessageSquare size={20} className="text-gold" aria-hidden />
                <h3 className="font-display font-semibold text-lg text-text-primary">
                  Discord &mdash; point d&apos;entrée principal
                </h3>
              </div>
              <p className="text-text-secondary text-sm leading-relaxed">
                Toutes les candidatures passent par Discord. Rejoignez le serveur, ouvrez un ticket de recrutement et présentez-vous.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  as="a"
                  href={RECRUITMENT_CTA.href}
                  variant="primary"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto"
                >
                  {RECRUITMENT_CTA.label}
                </Button>
                <Button
                  as="a"
                  href={RECRUITMENT_DISCORD.href}
                  variant="secondary"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto"
                >
                  {RECRUITMENT_DISCORD.label}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
