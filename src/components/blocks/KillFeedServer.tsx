/**
 * Server Component isolé pour le KillFeed.
 * Wrappé dans <Suspense> dans Hero — le fetch zkillboard ne bloque plus
 * le rendu du reste de la homepage.
 *
 * Affiche un feed mixé Tabou + Urban Zone, trié par date desc.
 */
import { fetchMixedKills } from "@/lib/zkillboard/fetcher";
import { KillFeed } from "./KillFeed";

export async function KillFeedServer() {
  const kills = await fetchMixedKills();
  if (kills.length === 0) return null;
  return <KillFeed initialKills={kills} />;
}
