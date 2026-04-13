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

/** Formate une date avec heure FR (Europe/Paris) en priorité + UTC en secondaire */
function formatEveAndFrTime(date: Date, opts?: { includeDate?: boolean }): string {
  const includeDate = opts?.includeDate ?? true;
  const datePart = includeDate
    ? date.toLocaleDateString("fr-FR", {
        weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Paris",
      }) + "\n"
    : "";
  const frTime = date.toLocaleTimeString("fr-FR", {
    hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris",
  });
  const eveTime = date.toLocaleTimeString("fr-FR", {
    hour: "2-digit", minute: "2-digit", timeZone: "UTC",
  });
  return `${datePart}🕐 ${frTime} (heure FR)\n🌐 ${eveTime} (UTC)`;
}

async function getWebhookUrl(
  key: "announcementsWebhookUrl" | "guidesWebhookUrl" | "assembliesWebhookUrl" | "calendarWebhookUrl" | "adminWebhookUrl" | "marketWebhookUrl",
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

export function stripHtml(html: string): string {
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

/** Extrait les sections H2 du HTML pour les lister dans l'embed Discord */
function extractSections(html: string): string[] {
  const regex = /<h2[^>]*>(.*?)<\/h2>/gi;
  const sections: string[] = [];
  let m;
  while ((m = regex.exec(html)) !== null) {
    const text = (m[1] ?? "").replace(/<[^>]*>/g, "").trim();
    if (text) sections.push(text);
  }
  return sections;
}

export function notifyNewAssembly(params: {
  assemblyId: string;
  title: string;
  type: string;
  heldAt: Date;
  hasVideo: boolean;
  content?: string;
  authorName?: string | null;
}): void {
  const typeLabel = params.type === "extraordinary" ? "Extraordinaire" : "Mensuelle";
  const dateStr = params.heldAt.toLocaleDateString("fr-FR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  const run = async () => {
    const url = await getWebhookUrl("assembliesWebhookUrl");

    // Extract sections from content for a rich summary
    const sections = params.content ? extractSections(params.content) : [];
    const summaryText = params.content ? truncate(params.content, 200) : undefined;

    const fields = [
      { name: "📋 Type", value: typeLabel, inline: true },
      { name: "📅 Date", value: dateStr, inline: true },
      ...(params.authorName ? [{ name: "✍️ Rédigé par", value: params.authorName, inline: true }] : []),
      ...(params.hasVideo ? [{ name: "🎬 Vidéo", value: "✅ Disponible", inline: true }] : []),
    ];

    // Add sections as a numbered list
    if (sections.length > 0) {
      const sectionList = sections
        .slice(0, 8) // max 8 sections to avoid embed overflow
        .map((s, i) => `**${i + 1}.** ${s}`)
        .join("\n");
      fields.push({
        name: `📑 Ordre du jour (${sections.length} points)`,
        value: sectionList,
        inline: false,
      });
    }

    await send(url, {
      embeds: [{
        title: `🏛️ ${params.title}`,
        url: `${SITE_URL}/membre/assemblees/${params.assemblyId}`,
        description: summaryText,
        color: 0x8B5CF6,
        thumbnail: {
          url: "https://images.evetech.net/corporations/98809880/logo?size=128",
        },
        fields,
        footer: {
          text: "Tabou Corporation — Assemblées",
          icon_url: "https://images.evetech.net/corporations/98809880/logo?size=32",
        },
        timestamp: new Date().toISOString(),
      }],
      components: [{
        type: 1,
        components: [{
          type: 2, style: 5,
          label: "📖 Lire le compte-rendu complet",
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

  const run = async () => {
    const url = await getWebhookUrl("calendarWebhookUrl");
    await send(url, {
      content: "@everyone",
      embeds: [{
        title: `📅 ${params.title}`,
        color: COLOR_GOLD,
        fields: [
          { name: "Type", value: TYPE_LABELS[params.type] ?? params.type, inline: true },
          { name: "Organisateur", value: params.authorName ?? "Staff", inline: true },
          { name: "📆 Début", value: formatEveAndFrTime(params.startAt), inline: false },
          ...(params.endAt ? [{
            name: "🏁 Fin",
            value: formatEveAndFrTime(params.endAt, { includeDate: false }),
            inline: true,
          }] : []),
        ],
        footer: { text: "Tabou Corporation — Horaires affichés en heure française — UTC entre parenthèses" },
        timestamp: new Date().toISOString(),
      }],
      components: [{
        type: 1,
        components: [{
          type: 2, style: 5,
          label: "📅 Voir & s'inscrire sur le site",
          url: `${SITE_URL}/membre/calendrier`,
        }],
      }],
    });
  };
  void run();
}

// ── Marché ───────────────────────────────────────────────────────────────────

const TYPE_EMOJI: Record<string, string> = { SELL: "💰", BUY: "🛒", EXCHANGE: "🔄" };
const TYPE_LABEL_FR: Record<string, string> = { SELL: "Vente", BUY: "Achat", EXCHANGE: "Échange" };
const TYPE_COLOR: Record<string, number> = { SELL: COLOR_GOLD, BUY: 0x3B82F6, EXCHANGE: 0x8B5CF6 };

function formatISK(amount: number): string {
  if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1)}B ISK`;
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M ISK`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(1)}K ISK`;
  return `${Math.round(amount).toLocaleString("fr-FR")} ISK`;
}

function formatExpiry(date: Date): string {
  return date.toLocaleDateString("fr-FR", {
    day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Paris",
  });
}

export function notifyNewListing(params: {
  listingId: string;
  title: string;
  type: string;
  authorName: string | null;
  askingPrice: number | null;
  itemCount: number;
  description: string | null;
  location: string | null;
  totalJitaBuy: number | null;
  askingRate: number | null;
  expiresAt: Date;
}): void {
  const emoji = TYPE_EMOJI[params.type] ?? "📦";
  const typeLabel = TYPE_LABEL_FR[params.type] ?? params.type;
  const color = TYPE_COLOR[params.type] ?? COLOR_GOLD;

  // Build description line
  const descLine = params.description
    ? truncate(params.description, 120)
    : undefined;

  // Build price display
  let priceValue = "Ouvert aux offres";
  if (params.askingPrice) {
    priceValue = formatISK(params.askingPrice);
    if (params.totalJitaBuy && params.totalJitaBuy > 0) {
      const pct = Math.round((params.askingPrice / params.totalJitaBuy) * 100);
      priceValue += ` (${pct}% Jita)`;
    }
  } else if (params.askingRate) {
    priceValue = `${params.askingRate}% Jita Buy`;
  }

  const run = async () => {
    const url = await getWebhookUrl("marketWebhookUrl");

    const fields = [
      { name: "👤 Vendeur", value: params.authorName ?? "Membre", inline: true },
      { name: "📦 Items", value: String(params.itemCount), inline: true },
      { name: "💵 Prix demandé", value: priceValue, inline: true },
    ];

    if (params.totalJitaBuy) {
      fields.push({ name: "📊 Valeur Jita Buy", value: formatISK(params.totalJitaBuy), inline: true });
    }
    if (params.location) {
      fields.push({ name: "📍 Localisation", value: params.location, inline: true });
    }
    fields.push({ name: "⏰ Expire le", value: formatExpiry(params.expiresAt), inline: true });

    await send(url, {
      embeds: [{
        title: `${emoji} ${typeLabel} — ${truncate(params.title, 50)}`,
        url: `${SITE_URL}/membre/marche/${params.listingId}`,
        description: descLine,
        color,
        fields,
        footer: { text: "Tabou Corporation — Marché" },
        timestamp: new Date().toISOString(),
      }],
    });
  };
  void run();
}

export function notifyNewOffer(params: {
  listingId: string;
  listingTitle: string;
  offerAuthorName: string | null;
  listingAuthorName: string | null;
  price: number | null;
  message: string | null;
  listingAskingPrice: number | null;
  itemCount: number;
}): void {
  const run = async () => {
    const url = await getWebhookUrl("marketWebhookUrl");

    // Build description with offer message
    const descLine = params.message
      ? `💬 *"${truncate(params.message, 100)}"*`
      : undefined;

    const fields = [
      { name: "👤 De", value: params.offerAuthorName ?? "Membre", inline: true },
      { name: "👤 À", value: params.listingAuthorName ?? "Membre", inline: true },
      { name: "📦 Items", value: String(params.itemCount), inline: true },
    ];

    if (params.price) {
      fields.push({ name: "💵 Prix proposé", value: formatISK(params.price), inline: true });
    }
    if (params.listingAskingPrice) {
      fields.push({ name: "💵 Prix demandé", value: formatISK(params.listingAskingPrice), inline: true });
    }
    if (params.price && params.listingAskingPrice && params.listingAskingPrice > 0) {
      const diff = Math.round(((params.price - params.listingAskingPrice) / params.listingAskingPrice) * 100);
      const sign = diff >= 0 ? "+" : "";
      fields.push({ name: "📈 Écart", value: `${sign}${diff}%`, inline: true });
    }

    await send(url, {
      embeds: [{
        title: `🤝 Nouvelle offre — ${truncate(params.listingTitle, 45)}`,
        url: `${SITE_URL}/membre/marche/${params.listingId}`,
        description: descLine,
        color: 0x3B82F6,
        fields,
        footer: { text: "Tabou Corporation — Marché" },
        timestamp: new Date().toISOString(),
      }],
    });
  };
  void run();
}
