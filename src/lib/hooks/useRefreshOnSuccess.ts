import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Appelle router.refresh() dès que `success` passe à true.
 * Force le client Next.js à re-fetcher les server components
 * et affiche les données fraîches sans rechargement complet.
 */
export function useRefreshOnSuccess(success: boolean | undefined) {
  const router = useRouter();
  useEffect(() => {
    if (success) router.refresh();
  }, [success, router]);
}
