"use client";

import { useRouter } from "next/navigation";

interface Props {
  /** Server action à appeler après confirmation */
  action: () => Promise<unknown>;
  confirmMessage?: string;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Bouton de suppression avec confirmation native.
 * Appelle `router.refresh()` après suppression pour mettre à jour la liste.
 */
export function DeleteButton({
  action,
  confirmMessage = "Supprimer définitivement ?",
  className = "text-text-muted text-xs hover:text-red-400 transition-colors flex-shrink-0",
  children = "Supprimer",
}: Props) {
  const router = useRouter();

  async function handleClick() {
    if (!window.confirm(confirmMessage)) return;
    await action();
    router.refresh();
  }

  return (
    <button type="button" onClick={handleClick} className={className}>
      {children}
    </button>
  );
}
