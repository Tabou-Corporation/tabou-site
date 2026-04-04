# Tabou — Site de Corporation EVE Online

Portail officiel de la corporation **Tabou** ([TABOU]) — EVE Online, nul-sec, EU TZ.

## Stack

- **Next.js 15** (App Router)
- **TypeScript** (strict)
- **Tailwind CSS 3**
- **Lucide React** (icônes)
- **Zod** (validation — utilisé en V2+)

## Démarrage rapide

```bash
npm install
npm run dev
```

Le site est accessible sur [http://localhost:3000](http://localhost:3000).

## Scripts

| Commande             | Description                        |
|---------------------|------------------------------------|
| `npm run dev`        | Serveur de développement           |
| `npm run build`      | Build production                   |
| `npm run start`      | Serveur production                 |
| `npm run lint`       | ESLint                             |
| `npm run type-check` | Vérification TypeScript sans build |

## Structure

```
src/
├── app/               # Routes Next.js (App Router)
│   ├── (public)/      # Zone publique
│   ├── (auth)/        # Zone auth — placeholder V2
│   ├── (member)/      # Zone membre — placeholder V2/V4
│   └── (staff)/       # Zone staff — placeholder V3/V5
├── components/        # Composants React
│   ├── ui/            # Primitives (Button, Card, Badge...)
│   ├── layout/        # Layout (Container, Footer, PageHeader)
│   ├── blocks/        # Sections composables (Hero, Section, CTAPanel...)
│   └── navigation/    # Navigation (MainNav, NavLink)
├── config/            # Configuration centrale (site, nav, features)
├── content/           # Contenu mock par page
├── lib/               # Utilitaires (cn, guards, feature-flags)
├── modules/           # Modules domaine (permissions, branding...)
└── types/             # Types TypeScript centralisés
```

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Design System](docs/DESIGN_SYSTEM.md)
- [Roadmap versions](docs/ROADMAP.md)

## Versions

| Version | Status      | Description                          |
|---------|-------------|--------------------------------------|
| V0      | ✅ Livré    | Fondation technique                  |
| V1      | ✅ Livré    | Site public MVP (6 pages)            |
| V1.1    | ✅ Livré    | Contenu administrable léger (JSON)   |
| V2      | ✅ Livré    | Auth EVE SSO + espace membre         |
| V3      | Planifié    | Pipeline de recrutement              |
| V4      | Planifié    | Hub membre                           |
| V5      | Planifié    | Backoffice officier/admin            |
| V6      | Planifié    | Intégrations EVE                     |
