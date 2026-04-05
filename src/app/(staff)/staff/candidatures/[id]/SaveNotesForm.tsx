"use client";

import { useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { saveApplicationNotes } from "@/lib/actions/applications";
import { useToast } from "@/contexts/ToastContext";
import { cn } from "@/lib/utils/cn";

interface Props {
  applicationId: string;
  defaultNotes: string;
}

export function SaveNotesForm({ applicationId, defaultNotes }: Props) {
  const [isPending, startTransition] = useTransition();
  const { addToast } = useToast();
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const notes = textareaRef.current?.value ?? "";
    startTransition(async () => {
      const result = await saveApplicationNotes(applicationId, notes);
      if (!result.success) {
        addToast(result.error, "error");
      } else {
        addToast("Notes sauvegardées.", "success");
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <textarea
        ref={textareaRef}
        defaultValue={defaultNotes}
        rows={5}
        placeholder="Impressions, points à vérifier, remarques..."
        className={cn(
          "w-full bg-bg-elevated border rounded px-3 py-2.5 resize-y",
          "text-text-primary text-sm placeholder:text-text-muted",
          "border-border focus:border-gold/60 focus:outline-none focus:ring-1 focus:ring-gold/40",
          "transition-colors duration-150"
        )}
      />
      <Button type="submit" variant="secondary" size="sm" disabled={isPending}>
        {isPending ? <><Spinner />Sauvegarde…</> : "Sauvegarder les notes"}
      </Button>
    </form>
  );
}
