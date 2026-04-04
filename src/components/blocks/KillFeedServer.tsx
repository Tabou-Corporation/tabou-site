/**
 * Server Component isolé pour le KillFeed.
 * Wrappé dans <Suspense> dans Hero — le fetch zkillboard ne bloque plus
 * le rendu du reste de la homepage.
 */
import { fetchCorpKills } from "@/lib/zkillboard/fetcher";
import { KillFeed } from "./KillFeed";

export async function KillFeedServer() {
  const kills = await fetchCorpKills();
  if (kills.length === 0) return null;
  return <KillFeed initialKills={kills} />;
}
