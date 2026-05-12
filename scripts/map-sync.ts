/**
 * Déclenche manuellement l'ingestion ESI complète en local.
 * En prod c'est le cron Vercel `/api/cron/map-sync` (toutes les 5min) qui s'en charge.
 *
 * Usage : npm run map:sync
 */

import { ingestSovMap } from "../src/lib/map/esi/sovereignty";
import { ingestSovStructures } from "../src/lib/map/esi/structures";
import { ingestSovCampaigns } from "../src/lib/map/esi/campaigns";
import { ingestSystemActivity } from "../src/lib/map/esi/activity";

async function main() {
  console.log("Ingestion ESI en cours…\n");

  const t0 = Date.now();
  const [sov, structures, campaigns, activity] = await Promise.all([
    ingestSovMap().catch((e) => ({ ok: false, error: String(e) })),
    ingestSovStructures().catch((e) => ({ ok: false, error: String(e) })),
    ingestSovCampaigns().catch((e) => ({ ok: false, error: String(e) })),
    ingestSystemActivity().catch((e) => ({ ok: false, error: String(e) })),
  ]);

  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`Sov          :`, sov);
  console.log(`Structures   :`, structures);
  console.log(`Campaigns    :`, campaigns);
  console.log(`Activity     :`, activity);
  console.log(`\n✅ Done in ${elapsed}s`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("❌ Sync failed:", e);
    process.exit(1);
  });
