# Handoff — Tabou Corporation Site

## Infrastructure

| Service | URL | Compte |
|---------|-----|--------|
| Site (prod) | https://tabou-eve.fr | — |
| Vercel (hébergement) | https://vercel.com | tabou.eve.corp@gmail.com |
| Neon (base de données) | https://console.neon.tech | tabou.eve.corp@gmail.com |
| OVHcloud (domaine) | https://ovhcloud.com | tabou.eve.corp@gmail.com |
| GitHub (code) | https://github.com/Tabou-Corporation/tabou-site | compte perso dev |
| Bitwarden (secrets) | https://vault.bitwarden.com | tabou.eve.corp@gmail.com |
| EVE SSO (prod) | https://developers.eveonline.com | compte EVE CEO |

## Credentials (dans Bitwarden org "Tabou EVE Corp")

- Gmail corp : `tabou.eve.corp@gmail.com`
- OVHcloud login
- Neon connection string
- Vercel login
- EVE SSO Client ID/Secret (prod)

## Variables d'environnement (.env.local dev / Vercel prod)

```env
DATABASE_URL=           # Neon connection string
AUTH_SECRET=            # Clé Auth.js (32 bytes base64)
EVE_CLIENT_ID=          # App EVE SSO
EVE_CLIENT_SECRET=      # App EVE SSO
NEXTAUTH_URL=           # https://tabou-eve.fr (prod) ou http://localhost:3000 (dev)
```

## EVE SSO — deux applications

| App | Callback URL | Usage |
|-----|-------------|-------|
| "Tabou Corporation Site" | https://tabou-eve.fr/api/auth/callback/eveonline | Production |
| "Tabou Dev" | http://localhost:3000/api/auth/callback/eveonline | Développement local |

## Gestion des rôles membres

Les rôles sont dans la DB Neon, table `User`, colonne `role` :

| Rôle | Accès |
|------|-------|
| `candidate` | Espace membre basique (défaut à la 1ère connexion) |
| `member` | Membre officiel |
| `recruiter` | Gestion candidatures (V3+) |
| `officer` | Administration (V4+) |
| `admin` | Accès total |

**Changer un rôle :** via Neon Studio → table `User` → éditer le champ `role`.

## Déploiement

Tout commit sur `main` GitHub déclenche un redéploiement automatique sur Vercel.

## Transfert si le dev quitte

1. Donner accès à Bitwarden org "Tabou EVE Corp" au nouveau responsable
2. Transférer ownership GitHub org `Tabou-Corporation`
3. Transférer projet Vercel (Settings → Members)
4. Transférer projet Neon (Settings → Team)
5. Mettre à jour les accès OVHcloud
6. Changer les mots de passe Bitwarden

## Stack technique

- **Framework** : Next.js 15 App Router + TypeScript strict
- **Auth** : next-auth v5 + EVE Online SSO
- **DB** : PostgreSQL via Prisma 5 + Neon serverless
- **Style** : Tailwind CSS 3 + design tokens custom
- **Déploiement** : Vercel (auto depuis GitHub)
