"use client";

import { useActionState, useState } from "react";
import { saveSiteContentAction } from "@/lib/actions/site-content";
import { useRefreshOnSuccess } from "@/lib/hooks/useRefreshOnSuccess";
import { EditorSection, SaveBar } from "./EditorFields";
import type { SettingsContent } from "@/lib/site-content/types";

export function SettingsEditor({ initialContent }: { initialContent: SettingsContent }) {
  const [state, formAction, pending] = useActionState(saveSiteContentAction, {});
  useRefreshOnSuccess(state.success);
  const [content, setContent] = useState<SettingsContent>(initialContent);

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="page" value="settings" />
      <input type="hidden" name="content" value={JSON.stringify(content)} />

      <EditorSection title="Navigation principale">
        <label className="flex items-center gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={content.pilotesNavVisible}
            onChange={(e) => setContent((c) => ({ ...c, pilotesNavVisible: e.target.checked }))}
            className="accent-gold w-4 h-4"
          />
          <div>
            <span className="text-text-primary text-sm font-medium group-hover:text-white transition-colors">
              Afficher l&apos;onglet &quot;Pilotes&quot;
            </span>
            <p className="text-text-muted text-xs mt-0.5">
              Visible dans la barre de navigation publique (desktop + mobile).
            </p>
          </div>
        </label>
      </EditorSection>

      <EditorSection title="Programme Buyback">
        <label className="flex items-center gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={content.buybackEnabled}
            onChange={(e) => setContent((c) => ({ ...c, buybackEnabled: e.target.checked }))}
            className="accent-gold w-4 h-4"
          />
          <div>
            <span className="text-text-primary text-sm font-medium group-hover:text-white transition-colors">
              Activer le programme de buyback
            </span>
            <p className="text-text-muted text-xs mt-0.5">
              Les membres peuvent soumettre des demandes de rachat d&apos;items.
            </p>
          </div>
        </label>

        <div className="pt-2">
          <label className="block text-text-muted text-xs font-medium mb-1.5">
            Taux de rachat ({content.buybackRate}% du Jita buy)
          </label>
          <input
            type="range"
            min={50}
            max={100}
            step={1}
            value={content.buybackRate}
            onChange={(e) => setContent((c) => ({ ...c, buybackRate: parseInt(e.target.value) }))}
            className="w-full accent-gold"
          />
          <div className="flex justify-between text-text-muted text-[10px] mt-1">
            <span>50%</span>
            <span className="text-gold font-semibold">{content.buybackRate}%</span>
            <span>100%</span>
          </div>
        </div>
      </EditorSection>

      <SaveBar pending={pending} success={state.success} error={state.error} />
    </form>
  );
}
