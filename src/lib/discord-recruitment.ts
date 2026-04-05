/**
 * Notifications Discord — recrutement Tabou.
 *
 * Toutes les fonctions sont fire-and-forget : elles ne bloquent jamais
 * l'action principale en cas d'échec du webhook.
 *
 * Variable d'env requise : DISCORD_RECRUITMENT_WEBHOOK_URL
 * (webhook d'un canal #recrutement privé staff)
 */

import { getDiscordConfig } from "@/lib/site-content/loader";

const SITE_URL = process.env.NEXTAUTH_URL ?? "https://tabou-eve.fr";

/**
 * Résout l'URL du webhook recrutement :
 * 1. Config DB (admin) — prioritaire
 * 2. Variable d'environnement DISCORD_RECRUITMENT_WEBHOOK_URL — fallback
 */
async function getRecruitmentWebhookUrl(): Promise<string> {
  try {
    const config = await getDiscordConfig();
    if (config.recruitmentWebhookUrl?.trim()) return config.recruitmentWebhookUrl.trim();
  } catch { /* fallback silencieux */ }
  return process.env.DISCORD_RECRUITMENT_WEBHOOK_URL ?? "";
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatSP(sp: number | null): string {
  if (!sp) return "Non renseigné";
  if (sp >= 1_000_000) return `${(sp / 1_000_000).toFixed(1)}M SP`;
  if (sp >= 1_000)     return `${(sp / 1_000).toFixed(0)}k SP`;
  return `${sp} SP`;
}

async function sendWebhook(payload: object): Promise<void> {
  const url = await getRecruitmentWebhookUrl();
  if (!url) return; // Webhook non configuré — silencieux

  try {
    const res = await fetch(url, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
    });
    if (!res.ok) {
      console.error("[discord-recruitment] Webhook erreur", res.status, await res.text());
    }
  } catch (err) {
    console.error("[discord-recruitment] Impossible de contacter Discord :", err);
  }
}

// ─── 1. Nouvelle candidature ──────────────────────────────────────────────────

export function notifyNewApplication(params: {
  applicationId: string;
  candidateName: string | null;
  discordHandle: string;
  spCount:       number | null;
  availability:  string | null;
  motivation:    string;
}): void {
  const motivationPreview = params.motivation.length > 150
    ? params.motivation.slice(0, 150).trimEnd() + "…"
    : params.motivation;

  const fields = [
    { name: "Pilote EVE",     value: params.candidateName ?? "Inconnu", inline: true },
    { name: "Discord",        value: params.discordHandle,              inline: true },
    { name: "Skillpoints",    value: formatSP(params.spCount),          inline: true },
    { name: "Disponibilités", value: params.availability ?? "Non renseignées", inline: false },
    { name: "Motivation",     value: motivationPreview,                 inline: false },
  ];

  const payload = {
    embeds: [{
      title:       "📥 Nouvelle candidature",
      color:       0x3B82F6, // Bleu
      fields,
      footer:      { text: "Tabou Corporation — Recrutement" },
      timestamp:   new Date().toISOString(),
      url:         `${SITE_URL}/staff/candidatures/${params.applicationId}`,
    }],
    components: [{
      type: 1,
      components: [{
        type:  2,
        style: 5,
        label: "Voir la candidature",
        url:   `${SITE_URL}/staff/candidatures/${params.applicationId}`,
      }],
    }],
  };

  void sendWebhook(payload);
}

// ─── 2. Entretien planifié ────────────────────────────────────────────────────

export function notifyInterviewScheduled(params: {
  applicationId: string;
  candidateName: string | null;
  recruiterName: string | null;
  interviewAt:   Date | null;
}): void {
  const dateStr = params.interviewAt
    ? params.interviewAt.toLocaleDateString("fr-FR", {
        weekday: "long", day: "numeric", month: "long",
      }) + " à " + params.interviewAt.toLocaleTimeString("fr-FR", {
        hour: "2-digit", minute: "2-digit",
      }) + " (heure locale)"
    : "À planifier";

  const payload = {
    embeds: [{
      title:  "📋 Entretien planifié",
      color:  0xF0B030, // Or Tabou
      fields: [
        { name: "Candidat",   value: params.candidateName ?? "Inconnu", inline: true },
        { name: "Recruteur",  value: params.recruiterName ?? "Inconnu", inline: true },
        { name: "Entretien",  value: dateStr,                           inline: false },
      ],
      footer:    { text: "Tabou Corporation — Recrutement" },
      timestamp: new Date().toISOString(),
      url:       `${SITE_URL}/staff/candidatures/${params.applicationId}`,
    }],
  };

  void sendWebhook(payload);
}

// ─── 3. Candidature acceptée ──────────────────────────────────────────────────

export function notifyApplicationAccepted(params: {
  applicationId: string;
  candidateName: string | null;
  recruiterName: string | null;
}): void {
  const payload = {
    embeds: [{
      title:       "✅ Candidature acceptée",
      description: `**${params.candidateName ?? "Nouveau membre"}** rejoint Tabou Corporation !`,
      color:       0x22C55E, // Vert
      fields: [
        { name: "Recruteur", value: params.recruiterName ?? "Inconnu", inline: true },
      ],
      footer:    { text: "Tabou Corporation — Recrutement" },
      timestamp: new Date().toISOString(),
    }],
  };

  void sendWebhook(payload);
}

// ─── 4. Candidature refusée (staff uniquement) ────────────────────────────────

export function notifyApplicationRejected(params: {
  applicationId: string;
  candidateName: string | null;
  recruiterName: string | null;
}): void {
  const payload = {
    embeds: [{
      title:  "❌ Candidature refusée",
      color:  0xEF4444, // Rouge
      fields: [
        { name: "Candidat",  value: params.candidateName ?? "Inconnu", inline: true },
        { name: "Recruteur", value: params.recruiterName ?? "Inconnu", inline: true },
      ],
      footer:    { text: "Tabou Corporation — Recrutement" },
      timestamp: new Date().toISOString(),
    }],
  };

  void sendWebhook(payload);
}
