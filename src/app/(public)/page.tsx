import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Hero } from "@/components/blocks/Hero";
import { Section, SectionHeader } from "@/components/blocks/Section";
import { CTAPanel } from "@/components/blocks/CTAPanel";
import { InfoPanel } from "@/components/blocks/InfoPanel";
import { StatBlock } from "@/components/blocks/StatBlock";
import { ActivityCard } from "@/components/blocks/ActivityCard";
import { Separator } from "@/components/ui/Separator";
import { Button } from "@/components/ui/Button";

import { getHomeContent, getActivitiesContent } from "@/lib/site-content/loader";
import { SITE_CONFIG } from "@/config/site";

export const metadata: Metadata = {
  title: `${SITE_CONFIG.fullName} — ${SITE_CONFIG.tagline}`,
  description: SITE_CONFIG.description,
};

export default async function HomePage() {
  const [home, activities] = await Promise.all([
    getHomeContent(),
    getActivitiesContent(),
  ]);

  const previewActivities = activities.slice(0, 4);

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <Hero
        eyebrow={home.hero.eyebrow}
        headline={home.hero.headline}
        subheadline={home.hero.subheadline}
        primaryCTA={{ label: "Postuler", href: "/recrutement", variant: "primary" }}
        secondaryCTA={{ label: "En savoir plus", href: "/corporation", variant: "ghost" }}
      />

      {/* ── Présentation ─────────────────────────────────────────────────── */}
      <Section bg="surface" spacing="lg">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-20 items-center">
          <div>
            <p className="text-gold text-xs font-semibold tracking-extra-wide uppercase mb-4">
              {home.intro.eyebrow}
            </p>
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-text-primary leading-tight mb-6">
              {home.intro.headline}
            </h2>
            <div className="space-y-4">
              {home.intro.body.map((paragraph, i) => (
                <p key={i} className="text-text-secondary leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </div>
            <Link
              href="/corporation"
              className="inline-flex items-center gap-2 mt-8 text-gold text-sm font-medium hover:text-gold-light transition-colors group"
            >
              En savoir plus sur la corporation
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <StatBlock stats={home.stats} />
        </div>
      </Section>

      <Separator gold />

      {/* ── Activités preview ─────────────────────────────────────────────── */}
      <Section bg="default" spacing="lg">
        <SectionHeader
          eyebrow="Ce que nous faisons"
          headline={home.activitiesPreview.headline}
          description={home.activitiesPreview.description}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {previewActivities.map((activity) => (
            <ActivityCard key={activity.id} activity={activity} />
          ))}
        </div>
        <div className="flex justify-start">
          <Button as="a" href="/activites" variant="ghost" size="md">
            Voir toutes les activités
            <ArrowRight size={16} />
          </Button>
        </div>
      </Section>

      <Separator gold />

      {/* ── Pourquoi Tabou ─────────────────────────────────────────────────── */}
      <Section bg="surface" spacing="lg">
        <SectionHeader
          headline={home.why.headline}
          description="Des raisons concrètes, sans marketing."
        />
        <InfoPanel
          items={home.why.items}
          columns={2}
          accent
        />
      </Section>

      {/* ── CTA Recrutement ───────────────────────────────────────────────── */}
      <CTAPanel
        eyebrow={home.recruitmentTeaser.eyebrow}
        headline={home.recruitmentTeaser.headline}
        description={home.recruitmentTeaser.body}
        primaryCTA={{ label: "Voir le recrutement", href: "/recrutement", variant: "primary" }}
        secondaryCTA={{ label: "Rejoindre le Discord", href: "https://discord.gg/tabou", variant: "secondary", external: true }}
        variant="gold"
      />
    </>
  );
}
