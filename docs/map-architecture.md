# Providence Pulse — Architecture

Carte interactive publique de situation géopolitique pour la région Providence
(EVE Online), accessible à `/map`. Intégrée au site Tabou (Next.js 15 App Router,
Prisma, Neon, NextAuth v5).

## Principes intangibles

- **Pas de prédictions.** Le score de tension est *explicable*, pas prophétique.
  L'UI affiche toujours ses composantes + horodatage + sources.
- **Pas de données inventées.** Si une source est down, on affiche `null` + raison,
  jamais une valeur fabriquée.
- **Pas de scraping Discord ou canaux in-game.** Reddit optionnel, hors MVP.
- **Backend uniquement** parle aux APIs externes. Le frontend ne consomme que
  les endpoints internes `/api/map/*`.
- **Respect ESI.** On honore `Expires`, on stocke et renvoie `ETag` via
  `If-None-Match`. zKillboard = best-effort, retardé.

## Couches

```
┌──────────────────────────────────────────────────────────┐
│  Frontend  /map  (Server Component shell + Client UI)    │
│   ├─ ProvidenceMap.tsx      SVG d3-zoom maison           │
│   ├─ SystemTooltip / Panel  Score expliqué               │
│   ├─ Timeline               Événements 24h/7j/30j        │
│   └─ SourceHealth           Indicateur ESI/zKB           │
└──────────────────────────────────────────────────────────┘
                          ▲ fetch (polling 60s)
                          │
┌──────────────────────────────────────────────────────────┐
│  API interne  /api/map/*                                 │
│   ├─ GET /state                    agrégat carte         │
│   ├─ GET /system/[id]              détail système        │
│   ├─ GET /events                   timeline              │
│   ├─ POST /events                  manual (officer+)     │
│   ├─ POST /comments + /pins        éditorial (officer+)  │
│   └─ GET /health                   état des sources      │
└──────────────────────────────────────────────────────────┘
                          ▲ lecture
                          │
┌──────────────────────────────────────────────────────────┐
│  Persistance  Neon (Prisma)                              │
│   MapEsiCache         clé URL → body + ETag + expiresAt  │
│   MapSovSnapshot      souveraineté par système           │
│   MapStructureSnapshot structures sov vulnérables/reinf  │
│   MapCampaignSnapshot campagnes sov en cours             │
│   MapSystemActivity   kills/jumps/npc par système        │
│   MapEvent            événements timeline (auto + manual)│
│   MapComment          commentaires éditoriaux Tabou      │
│   MapPin              épingles                           │
└──────────────────────────────────────────────────────────┘
                          ▲ écriture
                          │
┌──────────────────────────────────────────────────────────┐
│  Workers d'ingestion  Vercel Cron → /api/cron/map-sync   │
│   ├─ sov-map        every 1h    (Expires 1h)             │
│   ├─ sov-structures every 30min (Expires 30min)          │
│   ├─ sov-campaigns  every 5min  (Expires 5min)           │
│   ├─ system-kills   every 5min  (Expires 1h, sliding)    │
│   ├─ system-jumps   every 30min (Expires 1h)             │
│   └─ tension-recompute  after each ingest                │
└──────────────────────────────────────────────────────────┘
                          ▲ HTTP
                          │
                  ┌───────┴───────┐
                  │   ESI public  │
                  │   zKB (V2)    │
                  └───────────────┘
```

## SDE Providence

Fichier statique committé : `src/lib/map/sde/providence.json`.

Contient :
- ~25 systèmes Providence + 5 adjacents (Catch, Domain).
- Pour chaque système : `systemId`, `name`, `constellationId`, `securityStatus`,
  `coords {x, y}` (layout figé style Dotlan), `neighbors[]` (gates).

Pas d'import dynamique du SDE complet (~500MB). Script `scripts/sync-providence-sde.ts`
fourni pour régénérer si nécessaire (résout les `systemId` via ESI `/universe/ids/`).

## Score de tension V1

```
tension = w_a·activity + w_m·movement + w_s·sov_war + w_st·structure
        + w_p·political + recency_modifier
```

Chaque composante ∈ [0, 1], pondérée. Décomposition stockée dans le snapshot
pour affichage UI. Détail dans `src/lib/map/tension.ts`.

## Auth

- `/map` : public.
- Mutations (events manuels, comments, pins) : `role >= officer` (NextAuth session).
- Cron : `CRON_SECRET` (timing-safe, déjà utilisé par les autres crons Tabou).

## Frontend

- Pas de dépendance supplémentaire ajoutée : pas de TanStack Query
  (polling `setInterval` + `fetch` suffit pour ce trafic), pas de Zustand
  (état local `useReducer` + URL search params pour la sélection système),
  pas de d3-zoom (zoom/pan SVG en ~50 LOC).
- Tailwind (déjà installé), Framer Motion (déjà installé) pour les transitions.

## Évolutions post-MVP

- zKillboard détaillé (kill feed temps réel par système).
- Reddit r/eve (signaux faibles).
- Heatmap historique (slider temporel).
- Export PNG d'un état carte pour BR/CR.
