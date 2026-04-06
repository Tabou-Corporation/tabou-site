/**
 * Corrige les utilisateurs qui sont "candidate" alors qu'ils appartiennent
 * à Tabou (98809880) ou Urban Zone (98215397) selon leur corporationId en DB.
 *
 * Usage : npx tsx scripts/fix-candidate-roles.ts
 *         npx tsx scripts/fix-candidate-roles.ts --dry-run
 */

import { PrismaClient } from "@prisma/client";

const TABOU_ID = 98809880;
const UZ_ID = 98215397;

const dryRun = process.argv.includes("--dry-run");
const prisma = new PrismaClient();

async function main() {
  const candidates = await prisma.user.findMany({
    where: {
      role: "candidate",
      corporationId: { in: [TABOU_ID, UZ_ID] },
    },
    select: { id: true, name: true, corporationId: true },
  });

  if (candidates.length === 0) {
    console.log("Aucun candidat à corriger.");
    return;
  }

  console.log(`${candidates.length} candidat(s) à promouvoir :`);

  for (const u of candidates) {
    const newRole = u.corporationId === UZ_ID ? "member_uz" : "member";
    console.log(`  ${u.name} (${u.id}) — corporation ${u.corporationId} → ${newRole}`);

    if (!dryRun) {
      await prisma.user.update({
        where: { id: u.id },
        data: { role: newRole },
      });
    }
  }

  console.log(dryRun ? "\n(dry-run, aucune modification appliquée)" : "\nTerminé.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
