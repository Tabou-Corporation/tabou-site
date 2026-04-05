"use client";

import { useActionState, useState } from "react";
import { changeUserRoleAction } from "@/lib/actions/members";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/utils/cn";
import { useRefreshOnSuccess } from "@/lib/hooks/useRefreshOnSuccess";
import { ALL_DOMAINS } from "@/types/roles";
import { DOMAIN_LABELS } from "@/lib/constants/labels";

const ROLES = [
  { value: "candidate",  label: "Candidat" },
  { value: "member_uz",  label: "Membre Urban Zone" },
  { value: "member",     label: "Membre Tabou" },
  { value: "officer",    label: "Officier" },
  { value: "director",   label: "Directeur" },
  { value: "ceo",        label: "CEO" },
  { value: "admin",      label: "Administrateur" },
];

interface Props {
  userId:             string;
  currentRole:        string;
  currentDomains:     string[];
  actorRole:          string;
}

export function RoleForm({ userId, currentRole, currentDomains, actorRole }: Props) {
  const [state, dispatch, pending] = useActionState(changeUserRoleAction, {});
  const [selectedRole, setSelectedRole] = useState(currentRole);
  const [selectedDomains, setSelectedDomains] = useState<Set<string>>(
    () => new Set(currentDomains)
  );
  useRefreshOnSuccess(state.success);

  // Rôles disponibles selon l'acteur
  const allowedRoles = actorRole === "admin"
    ? ROLES
    : actorRole === "ceo"
    ? ROLES.filter((r) => ["candidate", "member_uz", "member", "officer", "director"].includes(r.value))
    : ROLES.filter((r) => ["candidate", "member_uz", "member", "officer"].includes(r.value));

  const showDomains = selectedRole === "officer";

  function toggleDomain(domain: string) {
    setSelectedDomains((prev) => {
      const next = new Set(prev);
      if (next.has(domain)) next.delete(domain);
      else next.add(domain);
      return next;
    });
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    dispatch(new FormData(e.currentTarget));
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input type="hidden" name="userId" value={userId} />

      <div className="space-y-1.5">
        <label className="block text-text-muted text-xs uppercase tracking-wide font-semibold">
          Rôle actuel → nouveau rôle
        </label>
        <div className="flex items-center gap-3 flex-wrap">
          <select
            name="role"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className={cn(
              "flex-1 min-w-[160px] bg-bg-elevated border rounded px-3 py-2",
              "text-text-primary text-sm border-border",
              "focus:border-gold/60 focus:outline-none focus:ring-1 focus:ring-gold/40"
            )}
          >
            {allowedRoles.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
          <Button type="submit" variant="secondary" size="sm" disabled={pending}>
            {pending ? <><Spinner />Application…</> : "Appliquer"}
          </Button>
        </div>
      </div>

      {/* Domaines — visible uniquement pour le rôle Officier */}
      {showDomains && (
        <div className="space-y-2">
          <label className="block text-text-muted text-xs uppercase tracking-wide font-semibold">
            Domaines (cumulables)
          </label>
          <div className="grid grid-cols-2 gap-2">
            {ALL_DOMAINS.map((domain) => {
              const checked = selectedDomains.has(domain);
              return (
                <label
                  key={domain}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded border cursor-pointer select-none transition-colors",
                    checked
                      ? "border-gold/40 bg-gold/5 text-text-primary"
                      : "border-border bg-bg-elevated text-text-muted hover:border-border-subtle"
                  )}
                >
                  <input
                    type="checkbox"
                    name="domains"
                    value={domain}
                    checked={checked}
                    onChange={() => toggleDomain(domain)}
                    className="w-3.5 h-3.5 rounded accent-[#c9a227] cursor-pointer"
                  />
                  <span className="text-sm font-medium">
                    {DOMAIN_LABELS[domain] ?? domain}
                  </span>
                </label>
              );
            })}
          </div>
          {selectedDomains.size === 0 && (
            <p className="text-amber-400/80 text-xs">
              Aucun domaine sélectionné — l&apos;officier n&apos;aura aucune permission spécifique.
            </p>
          )}
        </div>
      )}

      {state.error && (
        <p className="text-red-400 text-xs bg-red-400/10 border border-red-400/20 rounded px-3 py-2">
          {state.error}
        </p>
      )}
    </form>
  );
}
