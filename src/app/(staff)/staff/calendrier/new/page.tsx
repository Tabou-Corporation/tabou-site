"use client";

import { useActionState, useState } from "react";
import { useSession } from "next-auth/react";
import { createCalendarEvent } from "@/lib/actions/content";
import { Container } from "@/components/layout/Container";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { Separator } from "@/components/ui/Separator";
import { getAllowedContentDomains, parseSpecialties } from "@/types/roles";
import { CONTENT_DOMAIN_LABELS } from "@/lib/constants/labels";
import type { UserRole } from "@/types/roles";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import Link from "next/link";
import { ArrowLeft, RefreshCw } from "lucide-react";

const inputClass = [
  "w-full bg-bg-elevated border rounded px-3 py-2.5",
  "text-text-primary text-sm placeholder:text-text-muted",
  "border-border focus:border-gold/60 focus:outline-none focus:ring-1 focus:ring-gold/40",
  "transition-colors duration-150",
].join(" ");

const EVENT_TYPES = [
  { value: "op",       label: "Opération" },
  { value: "training", label: "Formation" },
  { value: "social",   label: "Event social" },
  { value: "other",    label: "Autre" },
];

const RECURRENCE_OPTIONS = [
  { value: "weekly",   label: "Chaque semaine" },
  { value: "biweekly", label: "Toutes les 2 semaines" },
  { value: "monthly",  label: "Chaque mois" },
];

export default function NewCalendarEventPage() {
  const [state, action, pending] = useActionState(createCalendarEvent, {});
  const [recurring, setRecurring] = useState(false);
  const { data: session } = useSession();

  const role = (session?.user?.role ?? "candidate") as UserRole;
  const domains = parseSpecialties(session?.user?.specialties);
  const allowedDomains = getAllowedContentDomains(role, domains);

  return (
    <div className="py-10 sm:py-14">
      <Container size="md">
        <div className="mb-6">
          <Link
            href="/membre/calendrier"
            className="inline-flex items-center gap-1.5 text-text-muted text-sm hover:text-text-secondary transition-colors"
          >
            <ArrowLeft size={14} />
            Retour au calendrier
          </Link>
        </div>

        <div className="mb-8">
          <p className="text-gold text-xs font-semibold tracking-extra-wide uppercase mb-2">
            Zone staff
          </p>
          <h1 className="font-display font-bold text-3xl text-text-primary">
            Nouvel événement
          </h1>
        </div>

        <Separator gold className="mb-8" />

        <Card>
          <CardHeader>
            <h2 className="font-display font-semibold text-base text-text-primary">
              Planifier un événement
            </h2>
          </CardHeader>
          <CardBody>
            <form action={action} className="space-y-5">

              {/* Titre + Type + Domaine */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="block text-text-secondary text-sm font-medium">
                    Titre <span className="text-red-400 text-xs">*</span>
                  </label>
                  <input
                    name="title"
                    type="text"
                    required
                    placeholder="Nom de l'opération / événement"
                    className={inputClass}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-text-secondary text-sm font-medium">Type</label>
                  <select name="type" defaultValue="op" className={inputClass}>
                    {EVENT_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-text-secondary text-sm font-medium">Domaine</label>
                  <select name="domain" defaultValue={allowedDomains[0] ?? "general"} className={inputClass}>
                    {allowedDomains.map((d) => (
                      <option key={d} value={d}>{CONTENT_DOMAIN_LABELS[d] ?? d}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-text-secondary text-sm font-medium">
                    Date et heure de début <span className="text-red-400 text-xs">*</span>
                  </label>
                  <input name="startAt" type="datetime-local" required className={inputClass} />
                  <p className="text-text-muted text-xs">Heure locale — affiché en EVE Time (UTC)</p>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-text-secondary text-sm font-medium">
                    Fin <span className="text-text-muted font-normal">(optionnel)</span>
                  </label>
                  <input name="endAt" type="datetime-local" className={inputClass} />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="block text-text-secondary text-sm font-medium">
                  Description <span className="text-text-muted font-normal">(optionnel)</span>
                </label>
                <RichTextEditor
                  name="description"
                  placeholder="Doctrine, objectif, point de rendez-vous…"
                  minHeight={120}
                />
              </div>

              {/* Récurrence */}
              <div className="border border-border-subtle rounded p-4 space-y-4">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <div className="relative">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={recurring}
                      onChange={(e) => setRecurring(e.target.checked)}
                    />
                    <div className="w-9 h-5 bg-bg-elevated border border-border rounded-full peer-checked:bg-gold/80 transition-colors" />
                    <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-text-muted rounded-full transition-transform peer-checked:translate-x-4 peer-checked:bg-white" />
                  </div>
                  <div className="flex items-center gap-2">
                    <RefreshCw size={14} className="text-text-muted" />
                    <span className="text-sm font-medium text-text-secondary">Événement récurrent</span>
                  </div>
                </label>

                {!recurring && (
                  <input type="hidden" name="recurrence" value="none" />
                )}

                {recurring && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    <div className="space-y-1.5">
                      <label className="block text-text-secondary text-sm font-medium">
                        Se répète
                      </label>
                      <select name="recurrence" defaultValue="weekly" className={inputClass}>
                        {RECURRENCE_OPTIONS.map((r) => (
                          <option key={r.value} value={r.value}>{r.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-text-secondary text-sm font-medium">
                        Jusqu&apos;au <span className="text-red-400 text-xs">*</span>
                      </label>
                      <input
                        name="recurrenceEndAt"
                        type="date"
                        required={recurring}
                        className={inputClass}
                      />
                    </div>
                  </div>
                )}
              </div>

              {state.error && (
                <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded px-3 py-2">
                  {state.error}
                </p>
              )}

              <Button type="submit" disabled={pending}>
                {pending ? <><Spinner />Planification…</> : "Planifier l'événement"}
              </Button>
            </form>
          </CardBody>
        </Card>
      </Container>
    </div>
  );
}
