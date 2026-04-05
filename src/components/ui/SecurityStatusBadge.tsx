/**
 * Badge affichant le statut de sécurité EVE d'un personnage.
 * Couleurs : positif = bleu-gris, 0 à -2 = orange, < -2 = rouge, < -5 = rouge vif
 */

import { cn } from "@/lib/utils/cn";

interface Props {
  value: number | null | undefined;
  /** Afficher le label "Sécu." devant la valeur */
  showLabel?: boolean;
  className?: string;
}

function getSecStatusColor(v: number): string {
  if (v >= 0) return "text-[#7dd3fc]";   // bleu-gris neutre → positif
  if (v >= -2) return "text-amber-400";   // orange → faiblement négatif
  if (v >= -5) return "text-orange-500";  // orange vif → négatif modéré
  return "text-red-500";                   // rouge → pirate
}

export function SecurityStatusBadge({ value, showLabel = false, className }: Props) {
  if (value === null || value === undefined) return null;

  const rounded = value.toFixed(1);
  const color   = getSecStatusColor(value);

  return (
    <span className={cn("inline-flex items-center gap-1 text-xs font-mono font-semibold", className)}>
      {showLabel && <span className="text-text-muted font-sans font-normal">Sécu.</span>}
      <span className={color}>{rounded}</span>
    </span>
  );
}
