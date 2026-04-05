"use client";

import { useEffect } from "react";
import { Container } from "@/components/layout/Container";

export default function MemberError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[membre]", error);
  }, [error]);

  return (
    <div className="py-20">
      <Container size="sm">
        <div className="text-center space-y-4">
          <p className="text-text-muted text-xs font-semibold tracking-extra-wide uppercase">
            Espace membre
          </p>
          <h2 className="font-display font-bold text-2xl text-text-primary">
            Une erreur est survenue
          </h2>
          <p className="text-text-muted text-sm">
            Impossible de charger cette page. Réessaie ou contacte un officier.
          </p>
          <button
            onClick={reset}
            className="inline-flex items-center gap-1.5 text-gold text-sm hover:text-gold-light transition-colors mt-2"
          >
            ↺ Réessayer
          </button>
        </div>
      </Container>
    </div>
  );
}
