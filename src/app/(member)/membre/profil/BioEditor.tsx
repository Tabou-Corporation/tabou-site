"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils/cn";

const MAX_BIO = 160;

interface BioEditorProps {
  initialBio: string;
}

export function BioEditor({ initialBio }: BioEditorProps) {
  const [bio, setBio] = useState(initialBio);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  const remaining = MAX_BIO - bio.length;
  const isOverLimit = remaining < 0;
  const isNearLimit = remaining <= 20 && remaining >= 0;

  async function handleSave() {
    if (isOverLimit) return;
    setStatus("saving");
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bio }),
      });
      if (!res.ok) throw new Error();
      setStatus("saved");
      router.refresh();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setStatus("idle"), 2500);
    } catch {
      setStatus("error");
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setStatus("idle"), 3000);
    }
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <textarea
          value={bio}
          onChange={(e) => {
            setBio(e.target.value);
            if (status !== "idle") setStatus("idle");
          }}
          placeholder="Présentez-vous en quelques mots... ex: Vétéran du low-sec, spécialisé flotte de chasse."
          rows={3}
          className={cn(
            "w-full resize-none rounded px-3 py-2.5 pr-14 text-sm leading-relaxed",
            "bg-bg-deep border text-text-primary placeholder:text-text-muted",
            "focus:outline-none focus:ring-1 transition-colors",
            isOverLimit
              ? "border-red-light/60 focus:ring-red-light/40"
              : "border-border focus:border-gold/50 focus:ring-gold/20"
          )}
        />
        {/* Compteur dans le coin */}
        <span
          className={cn(
            "absolute bottom-2.5 right-3 text-xs font-mono tabular-nums transition-colors",
            isOverLimit  ? "text-red-light font-bold" :
            isNearLimit  ? "text-amber-400" :
                           "text-text-muted"
          )}
        >
          {remaining}
        </span>
      </div>

      <div className="flex items-center justify-between">
        {/* Feedback */}
        <span className={cn(
          "text-xs transition-opacity duration-300",
          status === "saved" ? "text-emerald-400 opacity-100" :
          status === "error" ? "text-red-light opacity-100" :
                               "opacity-0"
        )}>
          {status === "saved" && "✓ Sauvegardé"}
          {status === "error" && "✗ Erreur — réessayez"}
        </span>

        <button
          onClick={handleSave}
          disabled={status === "saving" || isOverLimit}
          className={cn(
            "px-4 py-1.5 rounded text-xs font-semibold tracking-wide transition-all duration-150",
            "border",
            status === "saving"
              ? "border-gold/20 text-gold/40 cursor-wait"
              : isOverLimit
              ? "border-border text-text-muted cursor-not-allowed opacity-50"
              : "border-gold/40 text-gold hover:border-gold hover:bg-gold/10 active:scale-95"
          )}
        >
          {status === "saving" ? "Sauvegarde…" : "Enregistrer"}
        </button>
      </div>
    </div>
  );
}
