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
  key: "announcementsWebhookUrl" | "guidesWebhookUrl" | "assembliesWebhookUrl" | "calendarWebhookUrl" | "adminWebhookUrl" | "buybackWebhookUrl",
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

// ── Cron sync monitoring ──────────────────────────────────────────────────────

export function notifyCronSyncResult(result: {
  total: number;
  checked: number;
  updated: number;
  errors: number;
  aborted?: boolean;
}): void {
  // Ne notifie que si quelque chose s'est mal passé
  if (result.errors === 0 && !result.aborted) return;

  const run = async () => {
    const url = await getWebhookUrl("adminWebhookUrl");
    if (!url) return;

    const color = result.aborted ? 0xEF4444 : 0xF59E0B; // rouge si aborté, orange si erreurs partielles
    const title = result.aborted
      ? "⛔ Sync ESI ABORTÉ"
      : `⚠️ Sync ESI — ${result.errors} erreur(s)`;

    await send(url, {
      embeds: [{
        title,
        color,
        fields: [
          { name: "Total pilotes", value: String(result.total), inline: true },
          { name: "Vérifiés", value: String(result.checked), inline: true },
          { name: "Mis à jour", value: String(result.updated), inline: true },
          { name: "Erreurs", value: String(result.errors), inline: true },
          ...(result.aborted ? [{ name: "Statut", value: "Aborté après 5 échecs ESI consécutifs", inline: false }] : []),
        ],
        footer: { text: "Tabou — Cron sync ESI" },
        timestamp: new Date().toISOString(),
      }],
    });
  };
  void run();
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

// ── Buyback ─────────────────────────────────────────────────────────────────

function formatISK(amount: number): string {
  if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1)}B ISK`;
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M ISK`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(1)}K ISK`;
  return `${Math.round(amount)} ISK`;
}

export function notifyBuybackSubmitted(params: {
  requestId: string;
  sellerName: string | null;
  totalBuyback: number;
  itemCount: number;
  buybackRate: number;
}): void {
  const run = async () => {
    const url = await getWebhookUrl("buybackWebhookUrl");
    await send(url, {
      embeds: [{
        title: "💰 Nouvelle demande de buyback",
        color: 0x3B82F6,
        fields: [
          { name: "Pilote", value: params.sellerName ?? "Inconnu", inline: true },
          { name: "Montant", value: formatISK(params.totalBuyback), inline: true },
          { name: "Items", value: String(params.itemCount), inline: true },
          { name: "Taux", value: `${Math.round(params.buybackRate * 100)}%`, inline: true },
        ],
        footer: { text: "Tabou Corporation — Buyback" },
        timestamp: new Date().toISOString(),
      }],
      components: [{
        type: 1,
        components: [{
          type: 2, style: 5,
          label: "Voir la demande",
          url: `${SITE_URL}/staff/buyback/${params.requestId}`,
        }],
      }],
    });
  };
  void run();
}

export function notifyBuybackStatusChange(params: {
  requestId: string;
  sellerName: string | null;
  reviewerName: string | null;
  totalBuyback: number;
  status: "ACCEPTED" | "PAID" | "REJECTED";
  reviewNote?: string | null;
}): void {
  const config: Record<string, { emoji: string; color: number; label: string }> = {
    ACCEPTED: { emoji: "✅", color: 0x22C55E, label: "accepté" },
    PAID:     { emoji: "💸", color: COLOR_GOLD, label: "payé" },
    REJECTED: { emoji: "❌", color: 0xEF4444, label: "refusé" },
  };
  const c = config[params.status]!;

  const run = async () => {
    const url = await getWebhookUrl("buybackWebhookUrl");
    await send(url, {
      embeds: [{
        title: `${c.emoji} Buyback ${c.label} — ${formatISK(params.totalBuyback)}`,
        color: c.color,
        fields: [
          { name: "Pilote", value: params.sellerName ?? "Inconnu", inline: true },
          { name: "Par", value: params.reviewerName ?? "Staff", inline: true },
          ...(params.reviewNote ? [{ name: "Note", value: truncate(params.reviewNote, 200), inline: false }] : []),
        ],
        footer: { text: "Tabou Corporation — Buyback" },
        timestamp: new Date().toISOString(),
      }],
      components: [{
        type: 1,
        components: [{
          type: 2, style: 5,
          label: "Voir la demande",
          url: `${SITE_URL}/staff/buyback/${params.requestId}`,
        }],
      }],
    });
  };
  void run();
}
