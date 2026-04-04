"use client";

import { useActionState, useState } from "react";
import { saveSiteContentAction } from "@/lib/actions/site-content";
import {
  Field,
  TextareaField,
  ParagraphsField,
  EditorSection,
  SaveBar,
} from "./EditorFields";
import type { HomeContent } from "@/lib/site-content/types";

export function HomeEditor({ initialContent }: { initialContent: HomeContent }) {
  const [state, formAction, pending] = useActionState(saveSiteContentAction, {});
  const [content, setContent] = useState<HomeContent>(initialContent);

  const set = <K extends keyof HomeContent>(key: K, value: HomeContent[K]) =>
    setContent((c) => ({ ...c, [key]: value }));

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="page" value="home" />
      <input type="hidden" name="content" value={JSON.stringify(content)} />

      {/* Hero */}
      <EditorSection title="Hero — Bannière principale">
        <Field
          label="Eyebrow (chapeau)"
          value={content.hero.eyebrow}
          onChange={(v) => set("hero", { ...content.hero, eyebrow: v })}
        />
        <TextareaField
          label="Titre principal"
          hint="Saut de ligne avec \\n"
          value={content.hero.headline}
          onChange={(v) => set("hero", { ...content.hero, headline: v })}
          rows={2}
        />
        <TextareaField
          label="Sous-titre"
          value={content.hero.subheadline}
          onChange={(v) => set("hero", { ...content.hero, subheadline: v })}
          rows={3}
        />
        <Field
          label="Image de fond (URL)"
          hint="URL externe (https://...) ou chemin local (/images/hero-bg.jpg)"
          value={content.hero.backgroundImage ?? ""}
          onChange={(v) => {
            const hero = { ...content.hero };
            if (v) hero.backgroundImage = v; else delete hero.backgroundImage;
            set("hero", hero);
          }}
        />
      </EditorSection>

      {/* Intro */}
      <EditorSection title="Présentation — Section intro">
        <Field
          label="Eyebrow"
          value={content.intro.eyebrow}
          onChange={(v) => set("intro", { ...content.intro, eyebrow: v })}
        />
        <Field
          label="Titre"
          value={content.intro.headline}
          onChange={(v) => set("intro", { ...content.intro, headline: v })}
        />
        <ParagraphsField
          label="Paragraphes"
          value={content.intro.body}
          onChange={(v) => set("intro", { ...content.intro, body: v })}
        />
      </EditorSection>

      {/* Stats */}
      <EditorSection title="Chiffres clés">
        {content.stats.map((stat, i) => (
          <div key={i} className="grid grid-cols-2 gap-3 pb-3 border-b border-border last:border-0 last:pb-0">
            <Field
              label={`Stat ${i + 1} — Valeur`}
              value={stat.value}
              onChange={(v) => {
                const next = [...content.stats];
                next[i] = { ...stat, value: v };
                set("stats", next);
              }}
            />
            <Field
              label="Libellé"
              value={stat.label}
              onChange={(v) => {
                const next = [...content.stats];
                next[i] = { ...stat, label: v };
                set("stats", next);
              }}
            />
          </div>
        ))}
      </EditorSection>

      {/* Why */}
      <EditorSection title="Pourquoi Tabou — 4 arguments">
        <Field
          label="Titre de section"
          value={content.why.headline}
          onChange={(v) => set("why", { ...content.why, headline: v })}
        />
        {content.why.items.map((item, i) => (
          <div key={i} className="space-y-2 pb-4 border-b border-border last:border-0 last:pb-0">
            <Field
              label={`Argument ${i + 1} — Titre`}
              value={item.title}
              onChange={(v) => {
                const next = [...content.why.items];
                next[i] = { ...item, title: v };
                set("why", { ...content.why, items: next });
              }}
            />
            <TextareaField
              label="Description"
              value={item.description}
              onChange={(v) => {
                const next = [...content.why.items];
                next[i] = { ...item, description: v };
                set("why", { ...content.why, items: next });
              }}
              rows={2}
            />
          </div>
        ))}
      </EditorSection>

      {/* Activities preview */}
      <EditorSection title="Aperçu activités">
        <Field
          label="Titre"
          value={content.activitiesPreview.headline}
          onChange={(v) => set("activitiesPreview", { ...content.activitiesPreview, headline: v })}
        />
        <TextareaField
          label="Description"
          value={content.activitiesPreview.description}
          onChange={(v) => set("activitiesPreview", { ...content.activitiesPreview, description: v })}
          rows={2}
        />
      </EditorSection>

      {/* Recruitment teaser */}
      <EditorSection title="Teaser recrutement — Bandeau CTA">
        <Field
          label="Eyebrow"
          value={content.recruitmentTeaser.eyebrow}
          onChange={(v) => set("recruitmentTeaser", { ...content.recruitmentTeaser, eyebrow: v })}
        />
        <Field
          label="Titre"
          value={content.recruitmentTeaser.headline}
          onChange={(v) => set("recruitmentTeaser", { ...content.recruitmentTeaser, headline: v })}
        />
        <TextareaField
          label="Corps de texte"
          value={content.recruitmentTeaser.body}
          onChange={(v) => set("recruitmentTeaser", { ...content.recruitmentTeaser, body: v })}
          rows={2}
        />
      </EditorSection>

      <SaveBar pending={pending} success={state.success} error={state.error} />
    </form>
  );
}
