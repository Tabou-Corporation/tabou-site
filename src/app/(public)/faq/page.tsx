import type { Metadata } from "next";

export const revalidate = 3600; // 1 h — contenu CMS rarement modifié

import { PageHeader } from "@/components/layout/PageHeader";
import { Section } from "@/components/blocks/Section";
import { CTAPanel } from "@/components/blocks/CTAPanel";
import { FAQGrouped } from "@/components/blocks/FAQAccordion";

import { getFaqContent } from "@/lib/site-content/loader";
import { FAQ_META } from "@/content/faq";
import { SITE_CONFIG } from "@/config/site";

export const metadata: Metadata = {
  title: FAQ_META.title,
  description: FAQ_META.description,
  alternates: { canonical: `${SITE_CONFIG.url}/faq` },
  openGraph: { url: `${SITE_CONFIG.url}/faq` },
};

const CONTACT_CTA = {
  label: "Nous contacter",
  href: "/contact",
  variant: "secondary" as const,
};

const RECRUITMENT_CTA = {
  label: "Voir le recrutement",
  href: "/recrutement",
  variant: "primary" as const,
};

export default async function FAQPage() {
  const faqItems = await getFaqContent();
  const categories = [...new Set(faqItems.map((item) => item.category))];

  return (
    <>
      <PageHeader
        eyebrow="FAQ"
        title="Questions fréquentes"
        description="Réponses directes aux questions les plus posées. Si la vôtre n'est pas ici, contactez-nous."
      />

      <Section bg="surface" spacing="lg">
        <div className="max-w-3xl mx-auto">
          <FAQGrouped items={faqItems} categories={categories} />
        </div>
      </Section>

      <CTAPanel
        headline="Vous n'avez pas trouvé votre réponse ?"
        description="Contactez-nous directement sur Discord. On répond."
        primaryCTA={RECRUITMENT_CTA}
        secondaryCTA={CONTACT_CTA}
        variant="default"
      />
    </>
  );
}
