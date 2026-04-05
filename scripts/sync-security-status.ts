/**
 * Script one-shot : peuple securityStatus pour tous les users via ESI public.
 * Usage : npx tsx scripts/sync-security-status.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: { securityStatus: null },
    select: { id: true, name: true, image: true },
  });

  console.log(`${users.length} user(s) sans securityStatus trouvé(s).`);

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
        console.warn(`  [SKIP] ${user.name} — ESI ${res.status}`);
        continue;
      }
      const data = await res.json() as { security_status?: number };
      if (typeof data.security_status !== "number") {
        console.warn(`  [SKIP] ${user.name} — pas de security_status dans la réponse`);
        continue;
      }
      await prisma.user.update({
        where: { id: user.id },
        data: { securityStatus: data.security_status },
      });
      console.log(`  [OK] ${user.name} → sécu ${data.security_status.toFixed(1)}`);
    } catch (err) {
      console.error(`  [ERR] ${user.name}:`, err);
    }
  }

  console.log("Sync terminé.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
