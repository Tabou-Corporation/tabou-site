import type { Metadata } from "next";

import { PageHeader } from "@/components/layout/PageHeader";
import { Section, SectionHeader } from "@/components/blocks/Section";
import { CTAPanel } from "@/components/blocks/CTAPanel";
import { ActivityCard } from "@/components/blocks/ActivityCard";
import { Separator } from "@/components/ui/Separator";

import { getActivitiesContent } from "@/lib/site-content/loader";
import { ACTIVITIES_META, ACTIVITIES_INTRO, CATEGORY_LABELS } from "@/content/activities";
import type { ActivityCategory } from "@/types/content";

export const metadata: Metadata = {
  title: ACTIVITIES_META.title,
  description: ACTIVITIES_META.description,
};

const CATEGORY_ORDER: ActivityCategory[] = [
  "pvp",
  "pve",
  "exploration",
  "industry",
  "collective",
];

const CATEGORY_DESCRIPTIONS: Record<ActivityCategory, string> = {
  pvp: "Engagement, doctrine, résultats. Le cœur de notre activité quotidienne.",
  pve: "Revenus optimisés, risque maîtrisé, organisation collective.",
  exploration: "Données, reliques, wormholes — le New Eden au-delà des frontières.",
  industry: "La colonne vertébrale logistique qui fait tourner la machine.",
  collective: "Opérations qui ont besoin de tout le monde.",
};

export default async function ActivitiesPage() {
  const activities = await getActivitiesContent();

  const byCategory: Record<ActivityCategory, typeof activities> = {
    pvp: activities.filter((a) => a.category === "pvp"),
    pve: activities.filter((a) => a.category === "pve"),
    exploration: activities.filter((a) => a.category === "exploration"),
    industry: activities.filter((a) => a.category === "industry"),
    collective: activities.filter((a) => a.category === "collective"),
  };

  return (
    <>
      <PageHeader
        eyebrow={ACTIVITIES_INTRO.eyebrow}
        title={ACTIVITIES_INTRO.headline}
        description={ACTIVITIES_INTRO.body}
      />

      {/* ── Catégories d'activités ─────────────────────────────────────── */}
      {CATEGORY_ORDER.map((category, index) => {
        const categoryActivities = byCategory[category];
        if (categoryActivities.length === 0) return null;

        return (
          <div key={category}>
            {index > 0 && <Separator gold />}
            <Section bg={index % 2 === 0 ? "surface" : "default"} spacing="lg">
              <SectionHeader
                headline={CATEGORY_LABELS[category]}
                description={CATEGORY_DESCRIPTIONS[category]}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryActivities.map((activity) => (
                  <ActivityCard key={activity.id} activity={activity} />
                ))}
              </div>
            </Section>
          </div>
        );
      })}

      {/* ── CTA ────────────────────────────────────────────────────────── */}
      <CTAPanel
        headline="Ce contenu vous intéresse ?"
        description="Si vous cherchez une corporation sérieuse avec un spectre d'activité réel, consultez notre page recrutement."
        primaryCTA={{ label: "Rejoindre Tabou", href: "/recrutement", variant: "primary" }}
        variant="default"
      />
    </>
  );
}
