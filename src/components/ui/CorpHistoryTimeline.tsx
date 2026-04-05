/**
 * Timeline de l'historique de corporation EVE d'un personnage.
 * Données ESI, 10 entrées max, plus récente en premier.
 */

import { fetchCorpHistory } from "@/lib/esi/corp-history";
import { Building2 } from "lucide-react";

interface Props {
  characterId: string;
}

export async function CorpHistoryTimeline({ characterId }: Props) {
  const history = await fetchCorpHistory(characterId);

  if (history.length === 0) {
    return (
      <p className="text-text-muted text-xs italic">
        Historique indisponible.
      </p>
    );
  }

  return (
    <ol className="relative border-l border-border-subtle ml-1 space-y-0">
      {history.map((entry, i) => {
        const isFirst = i === 0;
        const dateStr = entry.startDate.toLocaleDateString("fr-FR", {
          month: "short",
          year:  "numeric",
        });

        return (
          <li key={entry.corporationId + entry.startDate.toISOString()} className="pl-5 pb-4 last:pb-0">
            {/* Dot */}
            <span
              className={[
                "absolute -left-[7px] mt-1 flex h-3.5 w-3.5 items-center justify-center rounded-full border",
                isFirst
                  ? "bg-gold/20 border-gold/60"
                  : "bg-bg-elevated border-border",
              ].join(" ")}
            >
              <Building2
                size={8}
                className={isFirst ? "text-gold" : "text-text-muted"}
              />
            </span>

            {/* Corp info */}
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className={`text-xs font-semibold ${isFirst ? "text-text-primary" : "text-text-secondary"}`}>
                [{entry.ticker}] {entry.name}
              </span>
              {entry.isDeleted && (
                <span className="text-[10px] text-red-400/70 italic">dissoute</span>
              )}
            </div>
            <p className="text-[11px] text-text-muted mt-0.5">{dateStr}</p>
          </li>
        );
      })}
    </ol>
  );
}
