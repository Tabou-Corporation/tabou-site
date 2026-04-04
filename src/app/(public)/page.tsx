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

import {
  HOME_HERO,
  HOME_INTRO,
  HOME_STATS,
  HOME_WHY,
  HOME_ACTIVITIES_PREVIEW,
  HOME_RECRUITMENT_TEASER,
} from "@/content/home";
import { ACTIVITIES } from "@/content/activities";
import { SITE_CONFIG } from "@/config/site";

export const metadata: Metadata = {
  title: `${SITE_CONFIG.fullName} — ${SITE_CONFIG.tagline}`,
  description: SITE_CONFIG.description,
};

export default function HomePage() {
  const previewActivities = ACTIVITIES.slice(0, 4);

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <Hero
        eyebrow={HOME_HERO.eyebrow}
        headline={HOME_HERO.headline}
        subheadline={HOME_HERO.subheadline}
        primaryCTA={HOME_HERO.cta.primary}
        secondaryCTA={HOME_HERO.cta.secondary}
      />

      {/* ── Présentation ─────────────────────────────────────────────────── */}
      <Section bg="surface" spacing="lg">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-20 items-center">
          <div>
            <p className="text-gold text-xs font-semibold tracking-extra-wide uppercase mb-4">
              {HOME_INTRO.eyebrow}
            </p>
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-text-primary leading-tight mb-6">
              {HOME_INTRO.headline}
            </h2>
            <div className="space-y-4">
              {HOME_INTRO.body.map((paragraph, i) => (
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

          <StatBlock stats={HOME_STATS} />
        </div>
      </Section>

      <Separator gold />

      {/* ── Activités preview ─────────────────────────────────────────────── */}
      <Section bg="default" spacing="lg">
        <SectionHeader
          eyebrow="Ce que nous faisons"
          headline={HOME_ACTIVITIES_PREVIEW.headline}
          description={HOME_ACTIVITIES_PREVIEW.description}
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
          headline={HOME_WHY.headline}
          description="Des raisons concrètes, sans marketing."
        />
        <InfoPanel
          items={[...HOME_WHY.items]}
          columns={2}
          accent
        />
      </Section>

      {/* ── CTA Recrutement ───────────────────────────────────────────────── */}
      <CTAPanel
        eyebrow={HOME_RECRUITMENT_TEASER.eyebrow}
        headline={HOME_RECRUITMENT_TEASER.headline}
        description={HOME_RECRUITMENT_TEASER.body}
        primaryCTA={HOME_RECRUITMENT_TEASER.cta}
        secondaryCTA={HOME_RECRUITMENT_TEASER.discord}
        variant="gold"
      />
    </>
  );
}
