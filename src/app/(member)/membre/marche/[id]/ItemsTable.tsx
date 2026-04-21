"use client";

import { useState } from "react";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { ChevronDown, ChevronUp } from "lucide-react";

interface ParsedItem {
  typeId: number;
  name: string;
  quantity: number;
  jitaBuy: number;
  totalBuy: number;
  amarrBuy?: number;
  totalAmarrBuy?: number;
}

function formatISK(amount: number): string {
  if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(2)}B ISK`;
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M ISK`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(1)}K ISK`;
  return `${Math.round(amount)} ISK`;
}

const PREVIEW_COUNT = 8;

export function ItemsTable({
  items,
  totalJitaBuy,
  totalAmarrBuy,
}: {
  items: ParsedItem[];
  totalJitaBuy: number | null;
  totalAmarrBuy?: number | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const needsCollapse = items.length > PREVIEW_COUNT;
  const visibleItems = expanded || !needsCollapse ? items : items.slice(0, PREVIEW_COUNT);
  const hasAmarr = items.some((it) => it.amarrBuy != null && it.amarrBuy > 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h2 className="font-display font-semibold text-base text-text-primary">
            Items ({items.length})
          </h2>
          {needsCollapse && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="flex items-center gap-1 text-text-muted text-xs hover:text-gold transition-colors"
            >
              {expanded ? (
                <>Reduire <ChevronUp size={14} /></>
              ) : (
                <>Voir tout <ChevronDown size={14} /></>
              )}
            </button>
          )}
        </div>
      </CardHeader>
      <CardBody>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-text-muted text-xs uppercase tracking-wide">
                <th className="text-left pb-2 font-semibold">Item</th>
                <th className="text-right pb-2 font-semibold">Qte</th>
                <th className="text-right pb-2 font-semibold">Jita Buy</th>
                {hasAmarr && <th className="text-right pb-2 font-semibold text-text-muted/70">Amarr Buy</th>}
                <th className="text-right pb-2 font-semibold">Total</th>
              </tr>
            </thead>
            <tbody>
              {visibleItems.map((item, i) => (
                <tr key={i} className="border-b border-border-subtle">
                  <td className="py-2 text-text-primary">{item.name}</td>
                  <td className="py-2 text-text-secondary text-right font-mono">
                    {item.quantity.toLocaleString("fr-FR")}
                  </td>
                  <td className="py-2 text-text-secondary text-right font-mono text-xs">
                    {formatISK(item.jitaBuy)}
                  </td>
                  {hasAmarr && (
                    <td className="py-2 text-text-muted text-right font-mono text-xs">
                      {item.amarrBuy ? formatISK(item.amarrBuy) : "—"}
                    </td>
                  )}
                  <td className="py-2 text-text-primary text-right font-mono">
                    {formatISK(item.totalBuy)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {needsCollapse && !expanded && (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="w-full mt-2 py-2 text-center text-text-muted text-xs hover:text-gold transition-colors border-t border-border-subtle"
          >
            + {items.length - PREVIEW_COUNT} items masques
          </button>
        )}

        {totalJitaBuy != null && totalJitaBuy > 0 && (
          <div className="mt-3 pt-3 border-t border-border space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-text-muted text-xs">Valeur Jita buy totale</span>
              <span className="text-text-secondary font-mono font-semibold">
                {formatISK(totalJitaBuy)}
              </span>
            </div>
            {totalAmarrBuy != null && totalAmarrBuy > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-text-muted text-xs">Valeur Amarr buy totale</span>
                <span className="text-text-muted font-mono text-sm">
                  {formatISK(totalAmarrBuy)}
                </span>
              </div>
            )}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
