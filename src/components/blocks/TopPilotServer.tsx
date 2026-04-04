/**
 * Server Component isolé pour le Top Pilote.
 * Wrappé dans <Suspense> dans Hero — le fetch zkillboard stats ne bloque plus
 * le rendu du reste de la homepage.
 */
import { fetchTopPilot } from "@/lib/zkillboard/top-pilot";
import { TopPilotCard } from "./TopPilotCard";

export async function TopPilotServer() {
  const pilot = await fetchTopPilot();
  if (!pilot) return null;
  return <TopPilotCard pilot={pilot} />;
}
