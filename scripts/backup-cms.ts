/**
 * Exporte le contenu CMS (SiteContent) en JSON local.
 * Usage  : npx tsx scripts/backup-cms.ts
 * Restore: npx tsx scripts/backup-cms.ts --restore backups/cms-2026-04-04.json
 */

import { PrismaClient } from "@prisma/client";
import { writeFileSync, readFileSync, mkdirSync } from "fs";
import { join } from "path";

const prisma = new PrismaClient();
const BACKUP_DIR = join(process.cwd(), "backups");

async function backup() {
  const rows = await prisma.siteContent.findMany();
  mkdirSync(BACKUP_DIR, { recursive: true });
  const file = join(BACKUP_DIR, `cms-${new Date().toISOString().slice(0, 10)}.json`);
  writeFileSync(file, JSON.stringify(rows, null, 2));
  console.log(`✓ Backup CMS → ${file} (${rows.length} page(s))`);
}

async function restore(file: string) {
  const rows = JSON.parse(readFileSync(file, "utf-8")) as {
    page: string; content: string; updatedBy: string | null; updatedAt: string;
  }[];

  for (const row of rows) {
    await prisma.siteContent.upsert({
      where: { page: row.page },
      update: { content: row.content, updatedBy: row.updatedBy },
      create: { page: row.page, content: row.content, updatedBy: row.updatedBy },
    });
    console.log(`  ✓ ${row.page}`);
  }
  console.log(`Restore terminé — ${rows.length} page(s).`);
}

async function main() {
  const isRestore = process.argv[2] === "--restore";
  if (isRestore) {
    const file = process.argv[3];
    if (!file) { console.error("Fichier manquant : --restore <chemin>"); process.exit(1); }
    await restore(file);
  } else {
    await backup();
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
