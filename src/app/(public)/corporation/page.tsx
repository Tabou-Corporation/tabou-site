import type { Metadata } from "next";
import { CheckCircle } from "lucide-react";

import { PageHeader } from "@/components/layout/PageHeader";
import { Section, SectionHeader } from "@/components/blocks/Section";
import { CTAPanel } from "@/components/blocks/CTAPanel";
import { InfoPanel } from "@/components/blocks/InfoPanel";
import { Separator } from "@/components/ui/Separator";
import { Card, CardBody } from "@/components/ui/Card";

import {
  CORPORATION_META,
  CORPORATION_INTRO,
  CORPORATION_VALUES,
  CORPORATION_EXPECTATIONS,
  CORPORATION_CTA,
} from "@/content/corporation";

export const metadata: Metadata = {
  title: CORPORATION_META.title,
  description: CORPORATION_META.description,
};

export default function CorporationPage() {
  return (
    <>
      <PageHeader
        eyebrow={CORPORATION_INTRO.eyebrow}
        title={CORPORATION_INTRO.headline}
        description={CORPORATION_INTRO.body[0]}
      />

      {/* ── Corps du texte d'intro ─────────────────────────────────────── */}
      <Section bg="surface" spacing="md">
        <div className="max-w-3xl space-y-4">
          {CORPORATION_INTRO.body.map((paragraph, i) => (
            <p key={i} className="text-text-secondary leading-relaxed text-lg">
              {paragraph}
            </p>
          ))}
        </div>
      </Section>

      <Separator gold />

      {/* ── Valeurs / Philosophie ──────────────────────────────────────── */}
      <Section bg="default" spacing="lg">
        <SectionHeader
          eyebrow="Philosophie"
          headline={CORPORATION_VALUES.headline}
          description="Ce qui nous définit, au-delà du contenu EVE."
        />
        <InfoPanel
          items={[...CORPORATION_VALUES.items]}
          columns={2}
          numbered
          accent
        />
      </Section>

      <Separator gold />

      {/* ── Ce que vous pouvez attendre ────────────────────────────────── */}
      <Section bg="surface" spacing="lg">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* From us */}
          <Card>
            <CardBody className="space-y-5">
              <h3 className="font-display font-bold text-xl text-text-primary">
                {CORPORATION_EXPECTATIONS.fromUs.headline}
              </h3>
              <ul className="space-y-3">
                {CORPORATION_EXPECTATIONS.fromUs.items.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle
                      size={16}
                      className="flex-shrink-0 mt-0.5 text-gold/70"
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

          {/* From you */}
          <Card>
            <CardBody className="space-y-5">
              <h3 className="font-display font-bold text-xl text-text-primary">
                {CORPORATION_EXPECTATIONS.fromYou.headline}
              </h3>
              <ul className="space-y-3">
                {CORPORATION_EXPECTATIONS.fromYou.items.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle
                      size={16}
                      className="flex-shrink-0 mt-0.5 text-gold/70"
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
        </div>
      </Section>

      {/* ── CTA ────────────────────────────────────────────────────────── */}
      <CTAPanel
        headline="Prêt à rejoindre Tabou ?"
        description="Consultez la page recrutement pour connaître les profils recherchés et le processus de candidature."
        primaryCTA={CORPORATION_CTA}
        variant="default"
      />
    </>
  );
}
