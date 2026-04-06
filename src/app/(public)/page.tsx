import type { Metadata } from "next";
import Link from "next/link";

export const revalidate = 60; // 1 min — stats homepage (kills, membres)
import { ArrowRight } from "lucide-react";

import { Hero } from "@/components/blocks/Hero";
import { Section, SectionHeader } from "@/components/blocks/Section";
import { CTAPanel } from "@/components/blocks/CTAPanel";
import { InfoPanel } from "@/components/blocks/InfoPanel";
import { ActivityCard } from "@/components/blocks/ActivityCard";
import { Separator } from "@/components/ui/Separator";
import { Button } from "@/components/ui/Button";

import { getHomeContent, getActivitiesContent, getDiscordConfig } from "@/lib/site-content/loader";
import { CORPORATIONS } from "@/lib/constants/corporations";
import { SITE_CONFIG } from "@/config/site";

export const metadata: Metadata = {
  title: `${SITE_CONFIG.fullName} — ${SITE_CONFIG.tagline}`,
  description: SITE_CONFIG.description,
  alternates: { canonical: SITE_CONFIG.url },
  openGraph: {
    url: SITE_CONFIG.url,
    title: `${SITE_CONFIG.fullName} — ${SITE_CONFIG.tagline}`,
    description: SITE_CONFIG.description,
  },
};

export default async function HomePage() {
  // Les fetches zkillboard (kills, topPilot) sont déplacés dans des Server Components
  // wrappés par <Suspense> dans Hero — la page s'affiche sans les attendre.
  const [home, activities, memberCount, discord] = await Promise.all([
    getHomeContent().catch(() => null),
    getActivitiesContent().catch(() => []),
    fetch(`https://esi.evetech.net/latest/corporations/${CORPORATIONS.tabou.id}/?datasource=tranquility`, {
      next: { revalidate: 3600 },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => (d?.member_count as number) ?? null)
      .catch(() => null),
    getDiscordConfig().catch(() => null),
  ]);

  if (!home) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-text-muted text-sm">Le contenu est temporairement indisponible.</p>
      </div>
    );
  }

  const previewActivities = activities.slice(0, 4);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_CONFIG.fullName,
    url: SITE_CONFIG.url,
    logo: "https://images.evetech.net/corporations/98809880/logo?size=256",
    description: SITE_CONFIG.description,
    sameAs: [discord?.inviteUrl ?? "https://discord.gg/tabou"],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* ── Hero cinématique ─────────────────────────────────────────── */}
      <Hero
        logoUrl={CORPORATIONS.tabou.logoUrl(512)}
        primaryCTA={{ label: "Postuler", href: "/recrutement", variant: "primary" }}
        secondaryCTA={{ label: "En savoir plus", href: "/corporation", variant: "ghost" }}
        backgroundImage={home.hero.backgroundImage ?? "/images/hero-bg.jpg"}
        ambientAudio="/audio/ambient.mp3"
        stats={home.stats.map((s) =>
          s.esiAuto && memberCount !== null
            ? { ...s, value: String(memberCount) }
            : s
        )}
        showKillFeed
      />

      {/* ── Présentation ─────────────────────────────────────────────── */}
      <Section bg="surface" spacing="lg">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-14 lg:gap-20 items-start">
          <div className="lg:col-span-3">
            <p className="text-gold text-xs font-semibold tracking-extra-wide uppercase mb-4">
              {home.intro.eyebrow}
            </p>
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-text-primary leading-tight mb-6">
              {home.intro.headline}
            </h2>
            <div className="space-y-4">
              {home.intro.body.map((paragraph, i) => (
                <p key={i} className="text-text-secondary leading-relaxed text-base sm:text-lg">
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

          {/* Bloc "Pourquoi nous" en résumé compact */}
          <div className="lg:col-span-2 space-y-4">
            {home.why.items.slice(0, 3).map((item, i) => (
              <div
                key={item.title}
                className="pl-4 border-l-2 border-l-gold/40 space-y-1.5"
              >
                <span className="text-gold/50 text-xs font-mono font-semibold tracking-widest">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="font-display font-semibold text-base text-text-primary">
                  {item.title}
                </h3>
                <p className="text-text-secondary text-sm leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Separator gold />

      {/* ── Activités preview ─────────────────────────────────────────── */}
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

      {/* ── Pourquoi Tabou (version complète) ─────────────────────────── */}
      <Section bg="surface" spacing="lg">
        <SectionHeader
          headline={home.why.headline}
          description="Des raisons concrètes, sans marketing."
        />
        <InfoPanel
          items={home.why.items}
          columns={2}
          accent
          numbered
        />
      </Section>

      {/* ── CTA Recrutement ───────────────────────────────────────────── */}
      <CTAPanel
        eyebrow={home.recruitmentTeaser.eyebrow}
        headline={home.recruitmentTeaser.headline}
        description={home.recruitmentTeaser.body}
        primaryCTA={{ label: "Voir le recrutement", href: "/recrutement", variant: "primary" }}
        secondaryCTA={{ label: "Rejoindre le Discord", href: discord?.inviteUrl ?? "https://discord.gg/tabou", variant: "secondary", external: true }}
        variant="gold"
      />
    </>
  );
}
