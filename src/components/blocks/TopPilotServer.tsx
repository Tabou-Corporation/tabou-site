/**
 * Server Component isolé pour le Top Pilote.
 * Wrappé dans <Suspense> dans Hero — le fetch zkillboard ne bloque pas
 * le rendu du reste de la homepage.
 */
import { fetchTopPilotsPodium } from "@/lib/zkillboard/top-pilot";
import { TopPilotPodium } from "./TopPilotPodium";

export async function TopPilotServer() {
  const pilots = await fetchTopPilotsPodium();
  if (!pilots.length) return null;
  return <TopPilotPodium pilots={pilots} />;
}
