# Providence Pulse — README opérationnel

Carte interactive de situation géopolitique pour la région Providence d'EVE Online,
accessible publiquement à `/map`. Voir `docs/map-architecture.md` pour l'architecture.

## Activation (avant publication)

Le code est scaffoldé mais **pas activé** : la DB n'a pas été migrée, le cron
n'a pas été testé. Étapes pour mettre en route :

```bash
# 1. Backup de la prod (réflexe Tabou — règle CLAUDE.md).
npm run db:backup

# 2. Migration : ajoute les 7 tables Map* à Neon.
npm run db:push

# 3. Premier sync manuel (depuis l'UI staff/map après login officer+),
#    ou en ligne de commande :
#    POST /api/cron/map-sync (auth: session officer+)

# 4. Vérifier
#    - /map renvoie une carte
#    - /api/map/health expose les sources avec un statut "ok"
#    - /api/map/state renvoie des systèmes avec sov/activité
```

## Cron Vercel

Ajouté à `vercel.json` : `*/5 * * * *` sur `/api/cron/map-sync`.
- Endpoint protégé par `CRON_SECRET` (même variable que les autres crons Tabou).
- Pas de risque de surcharge ESI : le cache respecte les `Expires`, donc
  appeler le cron plus souvent que les TTLs ne déclenche pas de requête ESI
  supplémentaire — juste un hit cache DB.

## Sources ESI consommées

| Endpoint                                         | TTL   | Cron effectif |
|--------------------------------------------------|-------|---------------|
| `/sovereignty/map/`                              | 1h    | 5 min (304)   |
| `/sovereignty/structures/`                       | 30min | 5 min (304)   |
| `/sovereignty/campaigns/`                        | 5min  | 5 min         |
| `/universe/system_kills/`                        | 1h    | 5 min (304)   |
| `/universe/system_jumps/`                        | 1h    | 5 min (304)   |

zKillboard et Reddit : **non intégrés au MVP**.

## Structure de fichiers

```
docs/
  map-architecture.md       Architecture, principes, score
  map-readme.md             (ce fichier) — opérations
prisma/schema.prisma        + 7 modèles Map* (V11)
src/lib/map/
  sde/
    providence.json         SDE statique (~25 systèmes Providence + 5 adjacents)
    index.ts                Loader typé, helpers gates()
  tension.ts                Score V1 décomposé + niveaux/couleurs
  events.ts                 Helpers MapEvent (auto/manual)
  state.ts                  Agrégateur d'état carte (consommé par /api/map/state)
  esi/
    cache.ts                Fetch ESI avec ETag/Expires + DB cache + stale-fallback
    sovereignty.ts          Worker sov-map + détection sov_change
    structures.ts           Worker structures + détection reinforced/vulnerable
    campaigns.ts            Worker campagnes + start/end events
    activity.ts             Worker kills+jumps + détection spikes
src/app/api/
  cron/map-sync/            Cron Vercel + déclenchement manuel officer+
  map/state/                GET — agrégat carte complet
  map/system/[id]/          GET — détail système
  map/events/               GET (public) + POST (officer+ : événements manuels)
  map/events/[id]/          DELETE (officer+)
  map/comments/             GET (public) + POST (officer+)
  map/comments/[id]/        DELETE
  map/pins/                 GET (public) + POST (officer+)
  map/pins/[id]/            DELETE
  map/health/                GET — santé des sources ESI
src/app/(public)/map/page.tsx  Page publique
src/app/(staff)/staff/map/      Admin (officer+) : sync + events + commentaires + pins
src/components/map/
  ProvidencePulse.tsx       Wrapper client (fetch + polling + sélection)
  ProvidenceMap.tsx         SVG zoom/pan maison (pas de d3)
  SystemPanel.tsx           Panneau latéral détail
  ScoreBreakdown.tsx        Décomposition pédagogique du score
  Timeline.tsx              Timeline 24h/7j/30j
  SourceHealth.tsx          État des sources ESI
  MapLegend.tsx             Légende couleurs
```

## Règles intangibles (reflétées dans le code)

1. **Pas de prédiction.** `ScoreBreakdown` affiche explicitement les composantes
   et les sources manquantes ; aucune extrapolation.
2. **Pas de données inventées.** Si une source est down, le composant
   contributif vaut `null` et est exclu du calcul (pas remplacé par une
   moyenne historique).
3. **Pas de scraping.** Discord et canaux in-game ne sont jamais accédés.
4. **Backend-only ESI.** Le frontend n'appelle que `/api/map/*`.
5. **ETag + Expires honorés.** Toute requête conditionnelle, cache DB
   prolongé sur 304, stale-fallback en cas de panne réseau.

## Évolutions post-MVP

- Intégration zKillboard (kill feed temps réel, IDs des belligérants).
- Reddit /r/eve (signaux faibles communauté).
- Heatmap historique avec slider temporel.
- Export PNG snapshot pour BR/CR.
- WebSocket pour push live des évents (au-delà du polling 60s).

## SDE — limites de l'état actuel

`providence.json` contient ~25 systèmes Providence (+ 5 adjacents) avec un
layout figé proche Dotlan. **Les `systemId` peuvent nécessiter validation** —
ESI renverra silencieusement un cache vide pour les IDs invalides (sans casser
la carte). Pour valider/régénérer, voir `scripts/sync-providence-sde.ts` (à
écrire) qui résout les IDs via `POST /universe/ids/`.
