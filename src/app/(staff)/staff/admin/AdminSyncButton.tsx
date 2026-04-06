"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";

export function AdminSyncButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function handleSync() {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/cron/sync-corporations", { method: "POST" });
      const data = await res.json() as { ok?: boolean; checked?: number; updated?: number; errors?: number; aborted?: boolean; error?: string };
      if (data.ok) {
        setResult(`${data.checked} vérifiés · ${data.updated} mis à jour${data.aborted ? " (avorté)" : ""}`);
      } else {
        setResult(data.error ?? "Erreur inconnue");
      }
    } catch {
      setResult("Erreur réseau");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={handleSync}
        disabled={loading}
        className="w-full flex items-center gap-3 px-4 py-3 border border-border rounded-md hover:border-gold/30 hover:bg-gold/5 transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <RefreshCw
          size={16}
          className={`text-gold/60 group-hover:text-gold ${loading ? "animate-spin" : ""}`}
        />
        <span className="text-sm text-text-secondary group-hover:text-text-primary flex-1 text-left">
          {loading ? "Sync en cours…" : "Forcer sync ESI"}
        </span>
      </button>
      {result && (
        <p className="text-xs text-text-muted mt-1.5 px-1">{result}</p>
      )}
    </div>
  );
}
