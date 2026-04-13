/**
 * Renvoi des webhooks Discord pour les candidatures en cours.
 * Aucune écriture en base — lecture seule + appels Discord.
 *
 * Usage : npx tsx scripts/resend-candidature-webhooks.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const SITE_URL = process.env.NEXTAUTH_URL ?? "https://tabou-eve.fr";

// ─── Résolution webhook depuis .env ──────────────────────────────────────────

async function getWebhookUrl(): Promise<string> {
  // Lit la config Discord depuis la DB (table SiteContent, page "discord")
  try {
    const row = await prisma.siteContent.findUnique({ where: { page: "discord" } });
    if (row?.content) {
      const json = row.content as unknown as Record<string, unknown>;
      const url = json.recruitmentWebhookUrl as string | undefined;
      if (url?.trim()) return url.trim();
    }
  } catch { /* fallback */ }
  return process.env.DISCORD_RECRUITMENT_WEBHOOK_URL ?? "";
}

async function send(url: string, payload: object): Promise<boolean> {
  if (!url) return false;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    console.error("  ✗ Discord erreur", res.status, await res.text());
    return false;
  }
  return true;
}

function formatSP(sp: number | null): string {
  if (!sp) return "Non renseigné";
  if (sp >= 1_000_000) return `${(sp / 1_000_000).toFixed(1)}M SP`;
  if (sp >= 1_000)     return `${(sp / 1_000).toFixed(0)}k SP`;
  return `${sp} SP`;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const webhookUrl = await getWebhookUrl();
  if (!webhookUrl) {
    console.error("❌ Aucun webhook configuré (DB ni DISCORD_RECRUITMENT_WEBHOOK_URL).");
    console.error("   Configure-le dans le panel admin → Discord → recrutement.");
    process.exit(1);
  }
  console.log("✓ Webhook trouvé\n");

  // Récupère toutes les candidatures en cours
  const applications = await prisma.application.findMany({
    where: { status: { in: ["PENDING", "INTERVIEW"] } },
    include: {
      user:       { select: { name: true } },
      assignedTo: { select: { name: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  if (!applications.length) {
    console.log("ℹ Aucune candidature PENDING ou INTERVIEW en cours.");
    process.exit(0);
  }

  console.log(`📋 ${applications.length} candidature(s) à repousser :\n`);

  for (const app of applications) {
    const label = `${app.user.name ?? "Inconnu"} [${app.status}]`;
    process.stdout.write(`  → ${label} ... `);

    let payload: object;

    if (app.status === "PENDING") {
      const motivationPreview = (app.motivation ?? "").length > 150
        ? (app.motivation ?? "").slice(0, 150).trimEnd() + "…"
        : (app.motivation ?? "Non renseignée");

      payload = {
        embeds: [{
          title:  "📥 Nouvelle candidature",
          color:  0x3B82F6,
          fields: [
            { name: "Pilote EVE",     value: app.user.name ?? "Inconnu",          inline: true },
            { name: "Discord",        value: app.discordHandle ?? "Non renseigné", inline: true },
            { name: "Skillpoints",    value: formatSP(app.spCount),               inline: true },
            { name: "Disponibilités", value: app.availability ?? "Non renseignées", inline: false },
            { name: "Motivation",     value: motivationPreview,                   inline: false },
          ],
          footer:    { text: "Tabou Corporation — Recrutement (renvoi)" },
          timestamp: new Date().toISOString(),
          url: `${SITE_URL}/staff/candidatures/${app.id}`,
        }],
        components: [{
          type: 1,
          components: [{
            type: 2, style: 5,
            label: "Voir la candidature",
            url:   `${SITE_URL}/staff/candidatures/${app.id}`,
          }],
        }],
      };
    } else {
      // INTERVIEW
      const dateStr = app.interviewAt
        ? app.interviewAt.toLocaleDateString("fr-FR", {
            weekday: "long", day: "numeric", month: "long",
          }) + " à " + app.interviewAt.toLocaleTimeString("fr-FR", {
            hour: "2-digit", minute: "2-digit",
          }) + " (heure locale)"
        : "À planifier";

      payload = {
        embeds: [{
          title:  "📋 Entretien planifié",
          color:  0xF0B030,
          fields: [
            { name: "Candidat",  value: app.user.name ?? "Inconnu",              inline: true },
            { name: "Recruteur", value: app.assignedTo?.name ?? "Non assigné",   inline: true },
            { name: "Entretien", value: dateStr,                                 inline: false },
          ],
          footer:    { text: "Tabou Corporation — Recrutement (renvoi)" },
          timestamp: new Date().toISOString(),
          url: `${SITE_URL}/staff/candidatures/${app.id}`,
        }],
      };
    }

    const ok = await send(webhookUrl, payload);
    console.log(ok ? "✓" : "✗");

    // Petit délai pour éviter le rate-limit Discord (5 msg/2s)
    await new Promise((r) => setTimeout(r, 500));
  }

  console.log("\n✅ Terminé.");
}

main()
  .catch((err) => { console.error(err); process.exit(1); })
  .finally(() => prisma.$disconnect());
