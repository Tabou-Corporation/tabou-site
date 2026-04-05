"use client";

import { useActionState, useState } from "react";
import { saveSiteContentAction } from "@/lib/actions/site-content";
import { useRefreshOnSuccess } from "@/lib/hooks/useRefreshOnSuccess";
import {
  Field,
  TextareaField,
  ParagraphsField,
  StringListField,
  EditorSection,
  SaveBar,
} from "./EditorFields";
import type { CorporationContent } from "@/lib/site-content/types";

export function CorporationEditor({ initialContent }: { initialContent: CorporationContent }) {
  const [state, formAction, pending] = useActionState(saveSiteContentAction, {});
  useRefreshOnSuccess(state.success);
  const [content, setContent] = useState<CorporationContent>(initialContent);

  const set = <K extends keyof CorporationContent>(key: K, value: CorporationContent[K]) =>
    setContent((c) => ({ ...c, [key]: value }));

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="page" value="corporation" />
      <input type="hidden" name="content" value={JSON.stringify(content)} />

      {/* Intro */}
      <EditorSection title="Introduction">
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

      {/* Values */}
      <EditorSection title="Philosophie — Valeurs">
        <Field
          label="Titre de section"
          value={content.values.headline}
          onChange={(v) => set("values", { ...content.values, headline: v })}
        />
        {content.values.items.map((item, i) => (
          <div key={i} className="space-y-2 pb-4 border-b border-border last:border-0 last:pb-0">
            <Field
              label={`Valeur ${i + 1} — Titre`}
              value={item.title}
              onChange={(v) => {
                const next = [...content.values.items];
                next[i] = { ...item, title: v };
                set("values", { ...content.values, items: next });
              }}
            />
            <TextareaField
              label="Description"
              value={item.description}
              onChange={(v) => {
                const next = [...content.values.items];
                next[i] = { ...item, description: v };
                set("values", { ...content.values, items: next });
              }}
              rows={2}
            />
          </div>
        ))}
      </EditorSection>

      {/* Expectations — From us */}
      <EditorSection title="Ce que vous pouvez attendre de nous">
        <Field
          label="Titre"
          value={content.expectations.fromUs.headline}
          onChange={(v) =>
            set("expectations", {
              ...content.expectations,
              fromUs: { ...content.expectations.fromUs, headline: v },
            })
          }
        />
        <StringListField
          label="Points"
          value={content.expectations.fromUs.items}
          onChange={(v) =>
            set("expectations", {
              ...content.expectations,
              fromUs: { ...content.expectations.fromUs, items: v },
            })
          }
          addLabel="+ Ajouter un point"
        />
      </EditorSection>

      {/* Expectations — From you */}
      <EditorSection title="Ce que nous attendons de vous">
        <Field
          label="Titre"
          value={content.expectations.fromYou.headline}
          onChange={(v) =>
            set("expectations", {
              ...content.expectations,
              fromYou: { ...content.expectations.fromYou, headline: v },
            })
          }
        />
        <StringListField
          label="Points"
          value={content.expectations.fromYou.items}
          onChange={(v) =>
            set("expectations", {
              ...content.expectations,
              fromYou: { ...content.expectations.fromYou, items: v },
            })
          }
          addLabel="+ Ajouter un point"
        />
      </EditorSection>

      <SaveBar pending={pending} success={state.success} error={state.error} />
    </form>
  );
}
