"use client";

import { useActionState } from "react";
import { createCalendarEvent } from "@/lib/actions/content";
import { Container } from "@/components/layout/Container";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Separator } from "@/components/ui/Separator";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

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

export default function NewCalendarEventPage() {
  const [state, action, pending] = useActionState(createCalendarEvent, {});

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
            Zone recrutement
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-text-secondary text-sm font-medium">
                    Date et heure de début <span className="text-red-400 text-xs">*</span>
                  </label>
                  <input
                    name="startAt"
                    type="datetime-local"
                    required
                    className={inputClass}
                  />
                  <p className="text-text-muted text-xs">Heure locale — sera affiché en EVE Time (UTC)</p>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-text-secondary text-sm font-medium">
                    Fin <span className="text-text-muted font-normal">(optionnel)</span>
                  </label>
                  <input
                    name="endAt"
                    type="datetime-local"
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-text-secondary text-sm font-medium">
                  Description <span className="text-text-muted font-normal">(optionnel)</span>
                </label>
                <textarea
                  name="description"
                  rows={4}
                  placeholder="Doctrine, objectif, point de rendez-vous…"
                  className={`${inputClass} resize-y`}
                />
              </div>

              {state.error && (
                <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded px-3 py-2">
                  {state.error}
                </p>
              )}

              <Button type="submit" disabled={pending}>
                {pending ? "Création…" : "Planifier l'événement"}
              </Button>
            </form>
          </CardBody>
        </Card>
      </Container>
    </div>
  );
}
