# Architecture — Tabou Corporation Site

## Principe directeur

Architecture modulaire par domaine, pensée pour évoluer de V0 à V6 sans refonte.
Chaque ajout de version = activation de modules existants + création de nouveaux fichiers.
Pas de suppression ni de réécriture des fondations.

---

## Structure de dossiers

```
src/
├── app/                        # Routes Next.js (App Router)
│   ├── (public)/               # Zone publique — V0/V1
│   │   ├── layout.tsx          # Layout public (nav + footer)
│   │   ├── page.tsx            # Home
│   │   ├── corporation/        # Page corporation
│   │   ├── activites/          # Page activités
│   │   ├── recrutement/        # Page recrutement
│   │   ├── faq/                # Page FAQ
│   │   └── contact/            # Page contact
│   ├── (auth)/                 # Zone auth — placeholder V2
│   │   └── layout.tsx
│   ├── (member)/               # Zone membre — placeholder V2/V4
│   │   └── layout.tsx
│   ├── (staff)/                # Zone staff — placeholder V3/V5
│   │   └── layout.tsx
│   ├── globals.css
│   ├── layout.tsx              # Layout racine (fonts, metadata)
│   └── not-found.tsx           # Page 404
│
├── components/
│   ├── ui/                     # Primitives UI (Button, Card, Badge, Separator)
│   ├── layout/                 # Composants de mise en page
│   │   ├── Container.tsx
│   │   ├── Footer.tsx
│   │   └── PageHeader.tsx
│   ├── blocks/                 # Sections composables de page
│   │   ├── Hero.tsx
│   │   ├── Section.tsx + SectionHeader
│   │   ├── CTAPanel.tsx
│   │   ├── InfoPanel.tsx
│   │   ├── StatBlock.tsx
│   │   ├── FAQAccordion.tsx + FAQGrouped
│   │   ├── ActivityCard.tsx
│   │   └── RecruitmentStep.tsx
│   └── navigation/
│       ├── MainNav.tsx
│       └── NavLink.tsx
│
├── config/
│   ├── site.ts                 # Métadonnées, liens, identité
│   ├── navigation.ts           # Navigation centralisée (public → staff)
│   └── features.ts             # Feature flags par version
│
├── content/                    # Contenu mock par page (V0/V1)
│   ├── home.ts                 # Contenu homepage
│   ├── corporation.ts          # Contenu page corporation
│   ├── activities.ts           # Données activités
│   ├── recruitment.ts          # Données recrutement
│   ├── faq.ts                  # FAQ items
│   └── contact.ts              # Infos contact
│
├── lib/
│   ├── utils/
│   │   └── cn.ts               # Fusion classes Tailwind
│   ├── guards/
│   │   └── index.ts            # Guards d'accès (stubs V0, réels V2+)
│   └── feature-flags/
│       └── index.ts            # Re-export isFeatureEnabled
│
├── modules/                    # Modules domaine
│   ├── branding/               # Tokens identité visuelle
│   ├── permissions/            # Système rôles/permissions
│   ├── content/                # (V1.1+) Couche contenu administrable
│   ├── recruitment/            # (V3+) Pipeline recrutement
│   ├── members/                # (V4+) Hub membre
│   └── admin/                  # (V5+) Backoffice
│
└── types/
    ├── roles.ts                # UserRole, ContentVisibility, hasMinRole
    ├── content.ts              # Types de contenu (Activity, FAQItem...)
    ├── navigation.ts           # NavItem, NavGroup, NavigationConfig
    └── index.ts                # Re-exports centralisés
```

---

## Séparation des zones

Les groupes de routes Next.js (`(public)`, `(auth)`, `(member)`, `(staff)`) permettent :

1. **Layouts différents** : nav publique vs sidebar membre vs backoffice staff
2. **Middleware ciblé** : les protections s'appliquent uniquement aux zones nécessaires
3. **Feature flags** : une zone entière peut être désactivée sans toucher les autres

```
URL /           → (public) → accessible à tous
URL /membre     → (member) → protégé, role >= "member"
URL /auth       → (auth)   → logique SSO
URL /staff      → (staff)  → protégé, role >= "recruiter" | "officer"
```

---

## Système de rôles

Défini dans `src/types/roles.ts`. Hiérarchie numérique :

```
public (0) < candidate (1) < member (2) < recruiter (3) < officer (4) < admin (5)
```

Usage :
```ts
hasMinRole(userRole, "member")          // accès membre et +
canView(userRole, "recruiter")          // visibilité contenu recruteur
ROLE_LEVEL[role] >= ROLE_LEVEL["officer"] // comparaison directe
```

---

## Feature flags

Tous les modules futurs sont déclarés dans `src/config/features.ts` avec `false`.
Activation progressive sans modifier l'architecture :

```ts
// Activer l'auth en V2 :
auth: true,
memberArea: true,

// Activer le pipeline en V3 :
recruitmentPipeline: true,
applicationForm: true,
```

---

## Sécurité — Principes fondamentaux

1. **Jamais de sécurité front-end seule** : les guards UI sont du confort UX, pas de la sécurité
2. **Middleware Next.js** : toute protection réelle passe par `middleware.ts` côté serveur (V2+)
3. **Tokens** : stockés en cookie `httpOnly`, jamais en `localStorage`
4. **API routes** : chaque endpoint vérifie le rôle serveur, indépendamment du front
5. **EVE SSO** : OAuth2 standard, callback géré serveur, pas de secret côté client

---

## Navigation dynamique par rôle

La navigation est centralisée dans `src/config/navigation.ts`.
Chaque `NavItem` possède une propriété `visibility?: ContentVisibility`.

En V2+, un hook `useNavigation(role: UserRole)` filtrera les items :
```ts
const visibleItems = navItems.filter(item =>
  canView(currentRole, item.visibility ?? "public")
);
```

Actuellement (V0/V1) : tous les items `visibility: "public"` sont affichés statiquement.

---

## Contenu — Évolution prévue

| Version | Source de contenu                    |
|---------|--------------------------------------|
| V0/V1   | Fichiers TypeScript dans `/content`  |
| V1.1    | Fichiers Markdown/MDX ou JSON éditable |
| V2+     | Possibilité CMS headless (Notion, Sanity...) |

Le pattern est constant : le composant reçoit des données typées, peu importe la source.

---

## Conventions de code

- **Composants** : PascalCase, un export nommé par fichier
- **Hooks** : `use` prefix, fichier dédié
- **Types** : définis dans `/types`, exportés depuis `index.ts`
- **Config** : constantes en `SCREAMING_SNAKE_CASE`
- **Classes Tailwind** : fusionnées via `cn()` (clsx + tailwind-merge)
- **Imports** : alias `@/` pour `src/`, pas de chemins relatifs longs
- **"use client"** : uniquement si état ou effet réel (pas par défaut)
