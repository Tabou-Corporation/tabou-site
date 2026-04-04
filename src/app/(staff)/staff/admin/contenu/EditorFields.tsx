"use client";

/**
 * Composants de champs réutilisables pour les éditeurs CMS.
 * Tous en "use client" — montés dans chaque éditeur de page.
 */

import React from "react";

// ── Styles communs ─────────────────────────────────────────────────────────────
const inputCls =
  "w-full bg-bg-elevated border border-border rounded px-3 py-2 text-text-primary text-sm focus:border-gold/60 focus:outline-none focus:ring-1 focus:ring-gold/40 placeholder:text-text-muted";
const labelCls = "block text-text-muted text-xs uppercase tracking-wide font-semibold mb-1";
const textareaCls = `${inputCls} resize-y min-h-[80px]`;

// ── Champ texte simple ─────────────────────────────────────────────────────────
export function Field({
  label,
  value,
  onChange,
  placeholder,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      {hint && <p className="text-text-muted text-xs mb-1">{hint}</p>}
      <input
        type="text"
        className={inputCls}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

// ── Champ textarea ─────────────────────────────────────────────────────────────
export function TextareaField({
  label,
  value,
  onChange,
  placeholder,
  hint,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
  rows?: number;
}) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      {hint && <p className="text-text-muted text-xs mb-1">{hint}</p>}
      <textarea
        className={textareaCls}
        style={{ minHeight: `${rows * 24}px` }}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

// ── Liste de paragraphes ───────────────────────────────────────────────────────
export function ParagraphsField({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: string[];
  onChange: (v: string[]) => void;
  hint?: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className={labelCls}>{label}</label>
        {hint && <span className="text-text-muted text-xs">{hint}</span>}
      </div>
      {value.map((para, i) => (
        <div key={i} className="flex gap-2">
          <textarea
            className={`${textareaCls} flex-1`}
            value={para}
            rows={3}
            onChange={(e) => {
              const next = [...value];
              next[i] = e.target.value;
              onChange(next);
            }}
          />
          <button
            type="button"
            onClick={() => onChange(value.filter((_, j) => j !== i))}
            className="text-red-400/70 hover:text-red-400 text-sm flex-shrink-0 mt-1"
            title="Supprimer"
          >
            ✕
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...value, ""])}
        className="text-gold/70 hover:text-gold text-xs font-medium"
      >
        + Ajouter un paragraphe
      </button>
    </div>
  );
}

// ── Liste de chaînes simples ───────────────────────────────────────────────────
export function StringListField({
  label,
  value,
  onChange,
  hint,
  addLabel = "+ Ajouter",
}: {
  label: string;
  value: string[];
  onChange: (v: string[]) => void;
  hint?: string;
  addLabel?: string;
}) {
  return (
    <div className="space-y-2">
      <div>
        <label className={labelCls}>{label}</label>
        {hint && <p className="text-text-muted text-xs mb-1">{hint}</p>}
      </div>
      {value.map((item, i) => (
        <div key={i} className="flex gap-2">
          <input
            type="text"
            className={`${inputCls} flex-1`}
            value={item}
            onChange={(e) => {
              const next = [...value];
              next[i] = e.target.value;
              onChange(next);
            }}
          />
          <button
            type="button"
            onClick={() => onChange(value.filter((_, j) => j !== i))}
            className="text-red-400/70 hover:text-red-400 text-sm flex-shrink-0"
            title="Supprimer"
          >
            ✕
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...value, ""])}
        className="text-gold/70 hover:text-gold text-xs font-medium"
      >
        {addLabel}
      </button>
    </div>
  );
}

// ── Section card ───────────────────────────────────────────────────────────────
export function EditorSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-border rounded-md p-5 space-y-4">
      <h3 className="font-display font-semibold text-sm text-text-primary border-b border-border pb-2">
        {title}
      </h3>
      {children}
    </div>
  );
}

// ── Bouton de sauvegarde + feedback ───────────────────────────────────────────
export function SaveBar({
  pending,
  success,
  error,
}: {
  pending: boolean;
  success?: boolean | undefined;
  error?: string | undefined;
}) {
  return (
    <div className="flex items-center gap-4 pt-2">
      <button
        type="submit"
        disabled={pending}
        className={[
          "px-5 py-2 rounded text-sm font-semibold transition-colors",
          "bg-gold text-bg-base hover:bg-gold-light disabled:opacity-50 disabled:cursor-not-allowed",
        ].join(" ")}
      >
        {pending ? "Enregistrement…" : "Enregistrer"}
      </button>
      {success && (
        <span className="text-green-400 text-sm">✓ Sauvegardé avec succès</span>
      )}
      {error && (
        <span className="text-red-400 text-sm">{error}</span>
      )}
    </div>
  );
}
