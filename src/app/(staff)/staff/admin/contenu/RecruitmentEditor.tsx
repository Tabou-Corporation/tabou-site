"use client";

import { useActionState, useState } from "react";
import { saveSiteContentAction } from "@/lib/actions/site-content";
import {
  Field,
  TextareaField,
  StringListField,
  EditorSection,
  SaveBar,
} from "./EditorFields";
import type { RecruitmentContent, RecruitmentProfile, RecruitmentStep } from "@/lib/site-content/types";

function ProfileEditor({
  profile,
  index,
  onChange,
  onRemove,
}: {
  profile: RecruitmentProfile;
  index: number;
  onChange: (p: RecruitmentProfile) => void;
  onRemove: () => void;
}) {
  return (
    <div className="space-y-3 p-4 bg-bg-elevated/40 border border-border rounded-md">
      <div className="flex items-center justify-between">
        <span className="text-text-muted text-xs font-semibold uppercase tracking-wide">
          Profil {index + 1}
        </span>
        <button
          type="button"
          onClick={onRemove}
          className="text-red-400/70 hover:text-red-400 text-xs"
        >
          Supprimer
        </button>
      </div>
      <Field
        label="Titre"
        value={profile.title}
        onChange={(v) => onChange({ ...profile, title: v })}
      />
      <TextareaField
        label="Description"
        value={profile.description}
        onChange={(v) => onChange({ ...profile, description: v })}
        rows={2}
      />
      <StringListField
        label="Points clés (traits)"
        value={profile.traits}
        onChange={(v) => onChange({ ...profile, traits: v })}
        addLabel="+ Ajouter un trait"
      />
    </div>
  );
}

function StepEditor({
  step,
  onChange,
}: {
  step: RecruitmentStep;
  onChange: (s: RecruitmentStep) => void;
}) {
  return (
    <div className="space-y-3 pb-4 border-b border-border last:border-0 last:pb-0">
      <span className="text-text-muted text-xs font-semibold uppercase tracking-wide">
        Étape {step.number}
      </span>
      <div className="grid grid-cols-2 gap-3">
        <Field
          label="Titre"
          value={step.title}
          onChange={(v) => onChange({ ...step, title: v })}
        />
        <Field
          label="Durée"
          value={step.duration}
          onChange={(v) => onChange({ ...step, duration: v })}
        />
      </div>
      <TextareaField
        label="Description"
        value={step.description}
        onChange={(v) => onChange({ ...step, description: v })}
        rows={3}
      />
    </div>
  );
}

export function RecruitmentEditor({ initialContent }: { initialContent: RecruitmentContent }) {
  const [state, formAction, pending] = useActionState(saveSiteContentAction, {});
  const [content, setContent] = useState<RecruitmentContent>(initialContent);

  const set = <K extends keyof RecruitmentContent>(key: K, value: RecruitmentContent[K]) =>
    setContent((c) => ({ ...c, [key]: value }));

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="page" value="recruitment" />
      <input type="hidden" name="content" value={JSON.stringify(content)} />

      {/* Intro */}
      <EditorSection title="Introduction">
        <Field
          label="Eyebrow"
          value={content.intro.eyebrow}
          onChange={(v) => set("intro", { ...content.intro, eyebrow: v })}
        />
        <TextareaField
          label="Titre"
          hint="Saut de ligne avec \\n"
          value={content.intro.headline}
          onChange={(v) => set("intro", { ...content.intro, headline: v })}
          rows={2}
        />
        <TextareaField
          label="Corps"
          value={content.intro.body}
          onChange={(v) => set("intro", { ...content.intro, body: v })}
          rows={3}
        />
      </EditorSection>

      {/* Wanted profiles */}
      <EditorSection title="Profils recherchés">
        <div className="space-y-4">
          {content.wantedProfiles.map((profile, i) => (
            <ProfileEditor
              key={i}
              profile={profile}
              index={i}
              onChange={(p) => {
                const next = [...content.wantedProfiles];
                next[i] = p;
                set("wantedProfiles", next);
              }}
              onRemove={() => set("wantedProfiles", content.wantedProfiles.filter((_, j) => j !== i))}
            />
          ))}
          <button
            type="button"
            onClick={() =>
              set("wantedProfiles", [
                ...content.wantedProfiles,
                { title: "", description: "", traits: [] },
              ])
            }
            className="text-gold/70 hover:text-gold text-xs font-medium"
          >
            + Ajouter un profil recherché
          </button>
        </div>
      </EditorSection>

      {/* Not adapted profiles */}
      <EditorSection title="Profils non adaptés">
        <div className="space-y-4">
          {content.notAdaptedProfiles.map((profile, i) => (
            <ProfileEditor
              key={i}
              profile={profile}
              index={i}
              onChange={(p) => {
                const next = [...content.notAdaptedProfiles];
                next[i] = p;
                set("notAdaptedProfiles", next);
              }}
              onRemove={() =>
                set("notAdaptedProfiles", content.notAdaptedProfiles.filter((_, j) => j !== i))
              }
            />
          ))}
          <button
            type="button"
            onClick={() =>
              set("notAdaptedProfiles", [
                ...content.notAdaptedProfiles,
                { title: "", description: "", traits: [] },
              ])
            }
            className="text-gold/70 hover:text-gold text-xs font-medium"
          >
            + Ajouter un profil non adapté
          </button>
        </div>
      </EditorSection>

      {/* Requirements */}
      <EditorSection title="Prérequis">
        <Field
          label="Titre de section"
          value={content.requirements.headline}
          onChange={(v) => set("requirements", { ...content.requirements, headline: v })}
        />
        <StringListField
          label="Points"
          value={content.requirements.items}
          onChange={(v) => set("requirements", { ...content.requirements, items: v })}
          addLabel="+ Ajouter un prérequis"
        />
      </EditorSection>

      {/* Steps */}
      <EditorSection title="Étapes du recrutement">
        <div className="space-y-4">
          {content.steps.map((step, i) => (
            <StepEditor
              key={i}
              step={step}
              onChange={(s) => {
                const next = [...content.steps];
                next[i] = s;
                set("steps", next);
              }}
            />
          ))}
        </div>
      </EditorSection>

      <SaveBar pending={pending} success={state.success} error={state.error} />
    </form>
  );
}
