# Règles Claude — Tabou Corporation Site

## ⛔ INTERDIT — Commandes destructives DB

Ne jamais exécuter ces commandes sans confirmation explicite de l'utilisateur :

- `prisma db push --force-reset` — efface toute la base de données
- `prisma migrate reset` — idem
- Toute commande SQL `DROP TABLE`, `DROP DATABASE`, `TRUNCATE`

**Protocole avant toute migration schema :**
1. Faire un backup CMS : `npm run db:backup`
2. Appliquer le changement : `npm run db:push`

## Base de données

- Provider : Neon (PostgreSQL serverless)
- ORM : Prisma
- Les textes du site sont en DB (table `SiteContent`) — pas dans le code
- Backup/restore : `npm run db:backup` / `npm run db:restore backups/cms-XXXX.json`

## Stack

- Next.js 15 App Router + React 19
- Auth : NextAuth v5 + EVE Online SSO (OAuth2)
- Styles : Tailwind CSS + Framer Motion
- DB : Prisma + Neon PostgreSQL

## Rôles

Hiérarchie : `suspended(0) < candidate(1) < member_uz(2) < member(3) < officer(4) < director(5) < ceo(6) < admin(7)`

- `admin` = Ithika Zorath (Urban Zone, corporation_id: 98215397)
- Pour restaurer les droits admin après reset : `npx tsx scripts/make-admin.ts "Nom Du Personnage"`

## Corporations EVE

- Tabou : ID `98809880`
- Urban Zone : ID `98215397`
