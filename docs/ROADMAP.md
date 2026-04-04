# Roadmap — Tabou Corporation Site

## Vue d'ensemble

```
V0  Fondation technique          ✅ Livré
V1  Site public MVP              ✅ Livré
V1.1 Contenu administrable léger  → Planifié
V2  Auth + espace membre         → Planifié
V3  Pipeline de recrutement      → Planifié
V4  Hub membre                   → Planifié
V5  Backoffice officier/admin    → Planifié
V6  Intégrations EVE             → Planifié
```

---

## V0 — Fondation technique ✅

**Objectif** : socle technique solide, architecture anticipée, design system posé.

### Livré

- Structure de dossiers modulaire par domaine
- TypeScript strict, alias `@/`
- Tailwind CSS avec design tokens Tabou
- Polices Google Fonts (Rajdhani + Barlow)
- Système de feature flags (`src/config/features.ts`)
- Types centralisés : `UserRole`, `ContentVisibility`, `NavItem`, `Activity`...
- Guards préparés (`src/lib/guards/`) — stubs prêts pour V2
- Module permissions (`src/modules/permissions/`)
- Module branding (`src/modules/branding/`)
- Layouts par zone (public / auth / member / staff)
- Navigation centralisée avec support de visibilité par rôle
- Composants UI de base : Button, Card, Badge, Separator

---

## V1 — Site public MVP ✅

**Objectif** : 6 pages publiques complètes, design premium, contenu mock cohérent.

### Pages livrées

| Page           | Route          | Description                              |
|----------------|----------------|------------------------------------------|
| Home           | `/`            | Hero + intro + activités + stats + CTA   |
| Corporation    | `/corporation` | Présentation, valeurs, attentes mutuelles |
| Activités      | `/activites`   | 12 activités en 5 catégories             |
| Recrutement    | `/recrutement` | Profils, étapes, prérequis, CTA          |
| FAQ            | `/faq`         | 14 questions en 4 catégories             |
| Contact        | `/contact`     | 3 canaux + placeholder formulaire        |

### Composants livrés

- `Hero` — section hero premium
- `Section` + `SectionHeader` — wrapper de section configurable
- `CTAPanel` — bloc d'appel à l'action
- `InfoPanel` — grille de points
- `StatBlock` — statistiques visuelles
- `FAQAccordion` + `FAQGrouped` — FAQ avec catégories
- `ActivityCard` — carte d'activité
- `RecruitmentStepCard` — étape de recrutement
- `PageHeader` — header de pages internes
- `MainNav` — navigation fixe + mobile
- `NavLink` — lien actif intelligent
- `Footer` — pied de page complet

---

## V1.1 — Contenu administrable léger ✅

**Objectif** : permettre la mise à jour du contenu sans modifier le code.

### Livré

- `src/content/data/activities.json` — 12 activités éditables
- `src/content/data/faq.json` — 14 questions/réponses éditables
- `src/content/data/recruitment-steps.json` — 4 étapes éditables
- `src/modules/content/schemas.ts` — schémas Zod de validation
- `src/modules/content/loader.ts` — chargeur avec validation au build
- Les fichiers `src/content/*.ts` consomment le JSON via le loader
- Erreur claire au build si un fichier JSON est invalide

**Règle d'édition** : modifier uniquement les fichiers `.json` dans `src/content/data/`.
Ne pas modifier les types ou la structure — uniquement les valeurs textuelles.

**Feature flag** : `FEATURES.contentAdmin = true`

---

## V2 — Authentification + Espace membre

**Objectif** : permettre la connexion via EVE SSO et ouvrir un espace membre minimal.

### Plan

**Auth (EVE SSO OAuth2)**
- `src/app/(auth)/login/page.tsx` — page de connexion
- `src/app/(auth)/callback/page.tsx` — callback OAuth2
- Middleware Next.js pour protéger les routes membres
- Stockage token en cookie `httpOnly`
- `src/modules/auth/` — logique SSO

**Espace membre minimal**
- `src/app/(member)/page.tsx` — dashboard simple (profil, statut)
- `src/app/(member)/profil/page.tsx` — profil pilote

**Sécurité**
- Vérification rôle côté serveur sur chaque route protégée
- Jamais de secret côté client

**Feature flags** : `FEATURES.auth`, `FEATURES.memberArea`, `FEATURES.eveSSO`

---

## V3 — Pipeline de recrutement

**Objectif** : transformer le formulaire de candidature en pipeline réel avec suivi.

### Plan

**Côté candidat**
- Formulaire de candidature (personnage, SP, motivation, disponibilité)
- Statut de candidature visible par le candidat

**Côté recruteur**
- `src/app/(staff)/candidatures/` — liste des candidatures
- Vue détaillée par candidature
- Changement de statut (en attente / entretien / accepté / refusé)
- Notes recruteur

**Données**
- Base de données légère (SQLite via Prisma ou PostgreSQL)
- Schémas Zod pour validation des formulaires

**Feature flags** : `FEATURES.recruitmentPipeline`, `FEATURES.applicationForm`, `FEATURES.recruiterDashboard`

---

## V4 — Hub membre

**Objectif** : espace membre complet avec contenu utile pour la vie de corp.

### Plan

- **Guides** : `src/app/(member)/guides/` — guides Markdown
- **Annonces** : système d'annonces corporation
- **Calendrier** : calendrier des opérations
- **Annuaire** : liste des membres avec infos publiques

**Feature flags** : `FEATURES.memberGuides`, `FEATURES.memberCalendar`, `FEATURES.memberDirectory`, `FEATURES.announcements`

---

## V5 — Backoffice officier/admin

**Objectif** : outils de gestion interne pour les officiers et admins.

### Plan

- `src/app/(staff)/membres/` — gestion des membres (roles, statut)
- `src/app/(staff)/permissions/` — gestion des rôles et permissions
- `src/app/(staff)/admin/` — configuration globale du site
- Audit log des actions admin
- Gestion des feature flags depuis l'interface

**Feature flags** : `FEATURES.adminPanel`, `FEATURES.officerTools`, `FEATURES.permissionsManager`

---

## V6 — Intégrations EVE

**Objectif** : connecter le portail aux API et outils de l'univers EVE.

### Plan

**ESI (EVE Swagger Interface)**
- Profil de personnage depuis l'API EVE
- Informations de corporation
- Compétences (avec permissions étendues)

**Killboard**
- Affichage des kills récents (via zKillboard API)
- Statistiques de combat par membre/corp

**Autres**
- Dotlan (cartes de routes)
- Bot Discord (notifications kills, annonces)

**Domaine concerné** : `src/modules/eve/`

**Feature flags** : `FEATURES.eveKillboard`, `FEATURES.eveFleetTracker`, `FEATURES.eveAssets`, `FEATURES.discordBot`, `FEATURES.eveEsi`

---

## Principes pour les futures versions

1. **Feature flag first** : activer dans `features.ts` avant de toucher les routes
2. **Types d'abord** : définir les types dans `src/types/` avant d'implémenter
3. **Sécurité serveur** : toute logique de protection est côté serveur
4. **Composants réutilisables** : les blocs existants sont extensibles, pas à remplacer
5. **Contenu découplé** : la présentation ne doit jamais contenir le contenu en dur
