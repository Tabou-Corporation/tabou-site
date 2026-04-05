"use client";

import { useActionState } from "react";
import { changeUserRoleAction } from "@/lib/actions/members";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/utils/cn";

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
  userId: string;
  currentRole: string;
  actorRole: string;
}

export function RoleForm({ userId, currentRole, actorRole }: Props) {
  const [state, formAction, pending] = useActionState(changeUserRoleAction, {});

  // Rôles disponibles selon l'acteur
  const allowedRoles = actorRole === "admin"
    ? ROLES
    : actorRole === "ceo"
    ? ROLES.filter((r) => ["candidate", "member_uz", "member", "officer", "director"].includes(r.value))
    : ROLES.filter((r) => ["candidate", "member_uz", "member", "officer"].includes(r.value));

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="userId" value={userId} />

      <div className="space-y-1.5">
        <label className="block text-text-muted text-xs uppercase tracking-wide font-semibold">
          Rôle actuel → nouveau rôle
        </label>
        <div className="flex items-center gap-3 flex-wrap">
          <select
            name="role"
            defaultValue={currentRole}
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

      {state.error && (
        <p className="text-red-400 text-xs bg-red-400/10 border border-red-400/20 rounded px-3 py-2">
          {state.error}
        </p>
      )}
    </form>
  );
}
