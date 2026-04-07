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

      <SaveBar pending={pending} success={state.success} error={state.error} />
    </form>
  );
}
