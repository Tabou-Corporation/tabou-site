/**
 * Notifications Discord — tous canaux.
 *
 * Fire-and-forget : ne bloque jamais l'action principale.
 * Résolution : Config DB (admin panel) → variable d'env → silencieux.
 */

import { getDiscordConfig } from "@/lib/site-content/loader";

const SITE_URL = process.env.NEXTAUTH_URL ?? "https://tabou-eve.fr";
const COLOR_GOLD = 0xF0B030;

// ── Helpers ──────────────────────────────────────────────────────────────────

async function getWebhookUrl(
  key: "announcementsWebhookUrl" | "guidesWebhookUrl" | "assembliesWebhookUrl" | "calendarWebhookUrl",
): Promise<string> {
  try {
    const config = await getDiscordConfig();
    const url = config[key];
    if (url?.trim()) return url.trim();
  } catch { /* fallback silencieux */ }
  return "";
}

async function send(url: string, payload: object): Promise<void> {
  if (!url) return;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.error("[discord] Webhook erreur", res.status);
    }
  } catch (err) {
    console.error("[discord] Webhook inaccessible :", err);
  }
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}

function truncate(text: string, max: number): string {
  const clean = stripHtml(text);
  return clean.length > max ? clean.slice(0, max).trimEnd() + "…" : clean;
}

// ── Annonces ─────────────────────────────────────────────────────────────────

export function notifyNewAnnouncement(params: {
  title: string;
  domain: string;
  authorName: string | null;
  content: string;
}): void {
  const DOMAIN_LABELS: Record<string, string> = {
    general: "Général", pvp: "PVP", pve: "PVE",
    industry: "Industrie", exploration: "Exploration", diplomacy: "Diplomatie",
  };

  const run = async () => {
    const url = await getWebhookUrl("announcementsWebhookUrl");
    await send(url, {
      embeds: [{
        title: `📢 ${params.title}`,
        description: truncate(params.content, 200),
        color: COLOR_GOLD,
        fields: [
          { name: "Domaine", value: DOMAIN_LABELS[params.domain] ?? params.domain, inline: true },
          { name: "Par", value: params.authorName ?? "Staff", inline: true },
        ],
        footer: { text: "Tabou Corporation" },
        timestamp: new Date().toISOString(),
      }],
      components: [{
        type: 1,
        components: [{
          type: 2, style: 5,
          label: "Lire l'annonce",
          url: `${SITE_URL}/membre/annonces`,
        }],
      }],
    });
  };
  void run();
}

// ── Guides ───────────────────────────────────────────────────────────────────

export function notifyNewGuide(params: {
  guideId: string;
  title: string;
  category: string;
  authorName: string | null;
}): void {
  const CATEGORY_LABELS: Record<string, string> = {
    general: "Général", pvp: "PVP", pve: "PVE", fits: "Fits",
    logistics: "Logistique", industry: "Industrie",
    exploration: "Exploration", diplomacy: "Diplomatie",
  };

  const run = async () => {
    const url = await getWebhookUrl("guidesWebhookUrl");
    await send(url, {
      embeds: [{
        title: `📘 ${params.title}`,
        color: 0x3B82F6,
        fields: [
          { name: "Catégorie", value: CATEGORY_LABELS[params.category] ?? params.category, inline: true },
          { name: "Par", value: params.authorName ?? "Staff", inline: true },
        ],
        footer: { text: "Tabou Corporation — Guides" },
        timestamp: new Date().toISOString(),
      }],
      components: [{
        type: 1,
        components: [{
          type: 2, style: 5,
          label: "Lire le guide",
          url: `${SITE_URL}/membre/guides/${params.guideId}`,
        }],
      }],
    });
  };
  void run();
}

// ── Assemblées ───────────────────────────────────────────────────────────────

export function notifyNewAssembly(params: {
  assemblyId: string;
  title: string;
  type: string;
  heldAt: Date;
  hasVideo: boolean;
}): void {
  const typeLabel = params.type === "extraordinary" ? "Extraordinaire" : "Mensuelle";
  const dateStr = params.heldAt.toLocaleDateString("fr-FR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  const run = async () => {
    const url = await getWebhookUrl("assembliesWebhookUrl");
    await send(url, {
      embeds: [{
        title: `🏛️ ${params.title}`,
        color: 0x8B5CF6,
        fields: [
          { name: "Type", value: typeLabel, inline: true },
          { name: "Date", value: dateStr, inline: true },
          ...(params.hasVideo ? [{ name: "Vidéo", value: "✅ Disponible", inline: true }] : []),
        ],
        footer: { text: "Tabou Corporation — Assemblées" },
        timestamp: new Date().toISOString(),
      }],
      components: [{
        type: 1,
        components: [{
          type: 2, style: 5,
          label: "Voir le compte-rendu",
          url: `${SITE_URL}/membre/assemblees/${params.assemblyId}`,
        }],
      }],
    });
  };
  void run();
}

// ── Événements calendrier (auto à la création) ──────────────────────────────

export function notifyNewCalendarEvent(params: {
  title: string;
  type: string;
  domain: string;
  startAt: Date;
  endAt: Date | null;
  authorName: string | null;
}): void {
  const TYPE_LABELS: Record<string, string> = {
    op: "Opération", training: "Formation", social: "Event social", other: "Autre",
  };
  const dateStr = params.startAt.toLocaleDateString("fr-FR", {
    weekday: "long", day: "numeric", month: "long",
  }) + " à " + params.startAt.toLocaleTimeString("fr-FR", {
    hour: "2-digit", minute: "2-digit", timeZone: "UTC",
  }) + " EVE";

  const run = async () => {
    const url = await getWebhookUrl("calendarWebhookUrl");
    await send(url, {
      content: "@everyone",
      embeds: [{
        title: `📅 ${params.title}`,
        color: COLOR_GOLD,
        fields: [
          { name: "Type", value: TYPE_LABELS[params.type] ?? params.type, inline: true },
          { name: "Date", value: dateStr, inline: true },
          { name: "Organisateur", value: params.authorName ?? "Staff", inline: true },
        ],
        footer: { text: "Tabou Corporation" },
        timestamp: new Date().toISOString(),
      }],
      components: [{
        type: 1,
        components: [{
          type: 2, style: 5,
          label: "Voir & s'inscrire",
          url: `${SITE_URL}/membre/calendrier`,
        }],
      }],
    });
  };
  void run();
}
