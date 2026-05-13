"use client";

import { useEffect, useState } from "react";

/**
 * Petit teaser inline pour cross-link entre la carte et le Hall of Fame.
 * Affiche "Top all-time : Jade · 417 kills" dès que les stats sont chargées.
 */

interface Entry {
  characterId: number;
  characterName: string | null;
  kills: number;
}

interface Payload {
  entries?: Entry[];
}

export function HallOfFameTeaser() {
  const [top, setTop] = useState<Entry | null>(null);

  useEffect(() => {
    fetch("/api/map/stats/corp")
      .then((r) => r.json())
      .then((d: Payload) => {
        if (d.entries && d.entries.length > 0) setTop(d.entries[0] ?? null);
      })
      .catch(() => { /* silent */ });
  }, []);

  if (!top) {
    return <span>Hall of Fame</span>;
  }

  return (
    <span>
      Top all-time : <strong className="text-text-primary normal-case">{top.characterName ?? `#${top.characterId}`}</strong>
      <span className="text-text-muted mx-1">·</span>
      <span className="text-emerald-400">{top.kills.toLocaleString("fr-FR")} kills</span>
    </span>
  );
}
