/**
 * Passe un utilisateur en admin par nom de personnage EVE.
 * Usage : npx tsx scripts/make-admin.ts "Ithika Zorath"
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const characterName = process.argv[2];

async function main() {
  if (!characterName) {
    console.error("Usage : npx tsx scripts/make-admin.ts \"Nom Du Personnage\"");
    process.exit(1);
  }

  const user = await prisma.user.findFirst({
    where: { name: characterName },
    select: { id: true, name: true, role: true },
  });

  if (!user) {
    console.error(`Utilisateur "${characterName}" introuvable. Reconnecte-toi d'abord sur le site.`);
    process.exit(1);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { role: "admin" },
  });

  console.log(`✓ ${user.name} est maintenant admin (était : ${user.role}).`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
