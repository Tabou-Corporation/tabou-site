/**
 * One-shot : supprime les events `structure_vulnerable` (= bruit fenêtre
 * quotidienne) et les `structure_reinforced` générés au premier seed (avant
 * qu'on ait un snapshot `prev` pour comparer le delta).
 *
 * Sûr : ne touche que les events `source=auto` de ces deux kinds. Les events
 * `manual` (Tabou) et les autres kinds (sov_change, activity_spike, campaign_*)
 * sont préservés.
 *
 * Usage : npx tsx --env-file=.env.local scripts/map-clean-seed-events.ts
 */

import { prisma } from "../src/lib/db";

async function main() {
  const before = await prisma.mapEvent.groupBy({
    by: ["kind"],
    where: { source: "auto" },
    _count: true,
  });
  console.log("Avant nettoyage (events auto par kind) :");
  for (const b of before) console.log(`  ${b.kind} : ${b._count}`);

  // Suppression des events structure_vulnerable (= bruit fenêtre quotidienne)
  const delVuln = await prisma.mapEvent.deleteMany({
    where: { source: "auto", kind: "structure_vulnerable" },
  });

  // Suppression des structure_reinforced fired au premier seed.
  // Heuristique : un vrai reinforce a un meta.deltaHours ≥ 25. Les seeds n'ont
  // pas ce champ. On supprime ceux qui n'ont PAS deltaHours dans le meta.
  const seedReinforced = await prisma.mapEvent.findMany({
    where: { source: "auto", kind: "structure_reinforced" },
    select: { id: true, meta: true },
  });
  const seedIds = seedReinforced
    .filter((e) => {
      const meta = e.meta as { deltaHours?: number } | null;
      return !meta || typeof meta.deltaHours !== "number";
    })
    .map((e) => e.id);
  const delReinf = await prisma.mapEvent.deleteMany({
    where: { id: { in: seedIds } },
  });

  console.log(`\nSupprimés :`);
  console.log(`  structure_vulnerable : ${delVuln.count}`);
  console.log(`  structure_reinforced (seed) : ${delReinf.count}`);

  const after = await prisma.mapEvent.groupBy({
    by: ["kind"],
    where: { source: "auto" },
    _count: true,
  });
  console.log("\nAprès nettoyage (events auto par kind) :");
  for (const b of after) console.log(`  ${b.kind} : ${b._count}`);
  if (after.length === 0) console.log("  (aucun event auto restant)");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("❌ Failed:", e);
    process.exit(1);
  });
