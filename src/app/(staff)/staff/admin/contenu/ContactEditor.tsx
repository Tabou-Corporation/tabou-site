"use client";

import { useActionState, useState } from "react";
import { saveSiteContentAction } from "@/lib/actions/site-content";
import { useRefreshOnSuccess } from "@/lib/hooks/useRefreshOnSuccess";
import { Field, TextareaField, EditorSection, SaveBar } from "./EditorFields";
import type { ContactContent, ContactChannel } from "@/lib/site-content/types";

function ChannelEditor({
  channel,
  index,
  onChange,
}: {
  channel: ContactChannel;
  index: number;
  onChange: (c: ContactChannel) => void;
}) {
  return (
    <div className="space-y-3 pb-4 border-b border-border last:border-0 last:pb-0">
      <span className="text-text-muted text-xs font-semibold uppercase tracking-wide">
        Canal {index + 1} — {channel.title}
      </span>
      <div className="grid grid-cols-2 gap-3">
        <Field
          label="Titre"
          value={channel.title}
          onChange={(v) => onChange({ ...channel, title: v })}
        />
        <Field
          label="Détail (ex: Réponse sous 24h)"
          value={channel.detail}
          onChange={(v) => onChange({ ...channel, detail: v })}
        />
      </div>
      <TextareaField
        label="Description"
        value={channel.description}
        onChange={(v) => onChange({ ...channel, description: v })}
        rows={2}
      />
      <div className="grid grid-cols-2 gap-3">
        <Field
          label="CTA — Libellé (optionnel)"
          value={channel.ctaLabel ?? ""}
          onChange={(v) => {
            const update: ContactChannel = { ...channel };
            if (v) { update.ctaLabel = v; } else { delete update.ctaLabel; }
            onChange(update);
          }}
          placeholder="ex: Rejoindre le Discord"
        />
        <Field
          label="CTA — URL"
          value={channel.ctaHref ?? ""}
          onChange={(v) => {
            const update: ContactChannel = { ...channel };
            if (v) { update.ctaHref = v; } else { delete update.ctaHref; }
            onChange(update);
          }}
          placeholder="ex: https://discord.gg/tabou"
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id={`external-${index}`}
          checked={channel.ctaExternal ?? false}
          onChange={(e) => onChange({ ...channel, ctaExternal: e.target.checked })}
          className="accent-gold"
        />
        <label htmlFor={`external-${index}`} className="text-text-muted text-xs">
          Lien externe (ouvre dans un nouvel onglet)
        </label>
      </div>
    </div>
  );
}

export function ContactEditor({ initialContent }: { initialContent: ContactContent }) {
  const [state, formAction, pending] = useActionState(saveSiteContentAction, {});
  useRefreshOnSuccess(state.success);
  const [content, setContent] = useState<ContactContent>(initialContent);

  const set = <K extends keyof ContactContent>(key: K, value: ContactContent[K]) =>
    setContent((c) => ({ ...c, [key]: value }));

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="page" value="contact" />
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
        <TextareaField
          label="Corps"
          value={content.intro.body}
          onChange={(v) => set("intro", { ...content.intro, body: v })}
          rows={2}
        />
      </EditorSection>

      {/* Channels */}
      <EditorSection title="Canaux de contact">
        <div className="space-y-4">
          {content.channels.map((channel, i) => (
            <ChannelEditor
              key={channel.id}
              channel={channel}
              index={i}
              onChange={(updated) => {
                const next = [...content.channels];
                next[i] = updated;
                set("channels", next);
              }}
            />
          ))}
        </div>
      </EditorSection>

      {/* Availability */}
      <EditorSection title="Disponibilité & Note formulaire">
        <Field
          label="Texte de disponibilité"
          value={content.availability}
          onChange={(v) => set("availability", v)}
          placeholder="Officers actifs en EU TZ…"
        />
        <TextareaField
          label="Note formulaire de contact"
          value={content.formNote}
          onChange={(v) => set("formNote", v)}
          rows={2}
        />
      </EditorSection>

      <SaveBar pending={pending} success={state.success} error={state.error} />
    </form>
  );
}
