/**
 * Script one-shot : peuple corporationId pour tous les users via ESI public.
 * Usage : npx tsx scripts/sync-corp-ids.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: { corporationId: null },
    select: { id: true, name: true, image: true },
  });

  console.log(`${users.length} user(s) sans corporationId trouvé(s).`);

  for (const user of users) {
    // Extrait le character ID depuis l'image URL : /characters/{id}/portrait
    const match = user.image?.match(/\/characters\/(\d+)\/portrait/);
    const characterId = match?.[1];
    if (!characterId) {
      console.warn(`  [SKIP] ${user.name} — pas d'image URL avec character ID`);
      continue;
    }
    try {
      const res = await fetch(`https://esi.evetech.net/latest/characters/${characterId}/`);
      if (!res.ok) {
        console.warn(`  [SKIP] ${user.name} (${user.id}) — ESI ${res.status}`);
        continue;
      }
      const data = await res.json() as { corporation_id?: number };
      if (!data.corporation_id) {
        console.warn(`  [SKIP] ${user.name} — pas de corporation_id dans la réponse`);
        continue;
      }
      await prisma.user.update({
        where: { id: user.id },
        data: { corporationId: data.corporation_id },
      });
      console.log(`  [OK] ${user.name} → corpo ${data.corporation_id}`);
    } catch (err) {
      console.error(`  [ERR] ${user.name}:`, err);
    }
  }

  console.log("Sync terminé.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
