"use client";

import { useActionState, useState } from "react";
import { saveSiteContentAction } from "@/lib/actions/site-content";
import { useRefreshOnSuccess } from "@/lib/hooks/useRefreshOnSuccess";
import { Field, EditorSection, SaveBar } from "./EditorFields";
import type { DiscordConfig } from "@/lib/site-content/types";

interface Props {
  initialContent: DiscordConfig;
}

export function DiscordEditor({ initialContent }: Props) {
  const [state, formAction, pending] = useActionState(saveSiteContentAction, {});
  useRefreshOnSuccess(state.success);
  const [content, setContent] = useState<DiscordConfig>(initialContent);

  const set = <K extends keyof DiscordConfig>(key: K, value: DiscordConfig[K]) =>
    setContent((c) => ({ ...c, [key]: value }));

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="page"    value="discord" />
      <input type="hidden" name="content" value={JSON.stringify(content)} />

      {/* Avertissement sécurité */}
      <div className="flex items-start gap-3 bg-gold/5 border border-gold/20 rounded-md px-4 py-3">
        <span className="text-gold text-base mt-0.5 shrink-0">⚠</span>
        <p className="text-text-muted text-xs leading-relaxed">
          Les URLs de webhook Discord donnent accès en écriture à vos canaux.
          Ne les partagez jamais — elles sont chiffrées en base mais restent sensibles.
        </p>
      </div>

      {/* Webhooks */}
      <EditorSection title="Webhooks de notification">
        <Field
          label="Recrutement — URL webhook"
          value={content.recruitmentWebhookUrl}
          onChange={(v) => set("recruitmentWebhookUrl", v)}
          placeholder="https://discord.com/api/webhooks/…"
          hint="Canal #recrutement (staff) — candidatures, entretiens, acceptations"
        />
        <Field
          label="Calendrier — URL webhook"
          value={content.calendarWebhookUrl}
          onChange={(v) => set("calendarWebhookUrl", v)}
          placeholder="https://discord.com/api/webhooks/…"
          hint="Canal opérations — notifié automatiquement à la création d'un événement"
        />
        <Field
          label="Annonces — URL webhook"
          value={content.announcementsWebhookUrl ?? ""}
          onChange={(v) => set("announcementsWebhookUrl", v)}
          placeholder="https://discord.com/api/webhooks/…"
          hint="Canal annonces — notifié à la publication d'une annonce"
        />
        <Field
          label="Guides — URL webhook"
          value={content.guidesWebhookUrl ?? ""}
          onChange={(v) => set("guidesWebhookUrl", v)}
          placeholder="https://discord.com/api/webhooks/…"
          hint="Canal guides — notifié à la publication d'un nouveau guide"
        />
        <Field
          label="Assemblées — URL webhook"
          value={content.assembliesWebhookUrl ?? ""}
          onChange={(v) => set("assembliesWebhookUrl", v)}
          placeholder="https://discord.com/api/webhooks/…"
          hint="Canal assemblées — notifié à la publication d'un compte-rendu"
        />
        <Field
          label="Buyback — URL webhook"
          value={content.buybackWebhookUrl ?? ""}
          onChange={(v) => set("buybackWebhookUrl", v)}
          placeholder="https://discord.com/api/webhooks/…"
          hint="Canal buyback/logistique — demandes soumises, acceptées, payées"
        />
        <Field
          label="Admin / Monitoring — URL webhook"
          value={content.adminWebhookUrl ?? ""}
          onChange={(v) => set("adminWebhookUrl", v)}
          placeholder="https://discord.com/api/webhooks/…"
          hint="Canal privé staff — alertes techniques (erreurs sync ESI, cron partiel)"
        />
        <div className="text-text-muted text-xs border-t border-border-subtle pt-3 space-y-1">
          <p className="font-semibold text-text-secondary">Comment créer un webhook :</p>
          <p>Canal Discord → Paramètres du canal → Intégrations → Webhooks → Nouveau webhook → Copier l&apos;URL</p>
        </div>
      </EditorSection>

      {/* Lien public */}
      <EditorSection title="Liens publics">
        <Field
          label="Lien d'invitation Discord"
          value={content.inviteUrl}
          onChange={(v) => set("inviteUrl", v)}
          placeholder="https://discord.gg/…"
          hint="Affiché sur les pages publiques (recrutement, accueil, formulaire de candidature)"
        />
      </EditorSection>

      <SaveBar pending={pending} success={state.success} error={state.error} />
    </form>
  );
}
