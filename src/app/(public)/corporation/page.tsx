import type { Metadata } from "next";
import { CheckCircle } from "lucide-react";

export const revalidate = 3600; // 1 h — contenu CMS rarement modifié

import { PageHeader } from "@/components/layout/PageHeader";
import { Section, SectionHeader } from "@/components/blocks/Section";
import { CTAPanel } from "@/components/blocks/CTAPanel";
import { InfoPanel } from "@/components/blocks/InfoPanel";
import { Separator } from "@/components/ui/Separator";
import { Card, CardBody } from "@/components/ui/Card";

import { getCorporationContent } from "@/lib/site-content/loader";
import { CORPORATION_META } from "@/content/corporation";
import { SITE_CONFIG } from "@/config/site";

export const metadata: Metadata = {
  title: CORPORATION_META.title,
  description: CORPORATION_META.description,
  alternates: { canonical: `${SITE_CONFIG.url}/corporation` },
  openGraph: { url: `${SITE_CONFIG.url}/corporation` },
};

export default async function CorporationPage() {
  const corp = await getCorporationContent();

  return (
    <>
      <PageHeader
        eyebrow={corp.intro.eyebrow}
        title={corp.intro.headline}
        description={corp.intro.body[0] ?? ""}
      />

      {/* ── Corps du texte d'intro ─────────────────────────────────────── */}
      <Section bg="surface" spacing="md">
        <div className="max-w-3xl space-y-4">
          {corp.intro.body.slice(1).map((paragraph, i) => (
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
          headline={corp.values.headline}
          description="Ce qui nous définit, au-delà du contenu EVE."
        />
        <InfoPanel
          items={corp.values.items}
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
                {corp.expectations.fromUs.headline}
              </h3>
              <ul className="space-y-3">
                {corp.expectations.fromUs.items.map((item) => (
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
                {corp.expectations.fromYou.headline}
              </h3>
              <ul className="space-y-3">
                {corp.expectations.fromYou.items.map((item) => (
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
        primaryCTA={{ label: "Postuler à Tabou", href: "/recrutement", variant: "primary" }}
        variant="default"
      />
    </>
  );
}
