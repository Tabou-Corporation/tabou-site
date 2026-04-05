"use client";

import { useActionState } from "react";
import { createAssembly } from "@/lib/actions/content";
import { Container } from "@/components/layout/Container";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { Separator } from "@/components/ui/Separator";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const inputClass = [
  "w-full bg-bg-elevated border rounded px-3 py-2.5",
  "text-text-primary text-sm placeholder:text-text-muted",
  "border-border focus:border-gold/60 focus:outline-none focus:ring-1 focus:ring-gold/40",
  "transition-colors duration-150",
].join(" ");

const ASSEMBLY_TYPES = [
  { value: "monthly", label: "Mensuelle" },
  { value: "extraordinary", label: "Exceptionnelle" },
];

export default function NewAssemblyPage() {
  const [state, action, pending] = useActionState(createAssembly, {});

  return (
    <div className="py-10 sm:py-14">
      <Container size="md">
        <div className="mb-6">
          <Link
            href="/staff/assemblees"
            className="inline-flex items-center gap-1.5 text-text-muted text-sm hover:text-text-secondary transition-colors"
          >
            <ArrowLeft size={14} />
            Retour aux assemblées
          </Link>
        </div>

        <div className="mb-8">
          <p className="text-gold text-xs font-semibold tracking-extra-wide uppercase mb-2">
            Zone staff
          </p>
          <h1 className="font-display font-bold text-3xl text-text-primary">
            Nouveau compte rendu
          </h1>
        </div>

        <Separator gold className="mb-8" />

        <Card>
          <CardHeader>
            <h2 className="font-display font-semibold text-base text-text-primary">
              Rédiger le compte rendu
            </h2>
          </CardHeader>
          <CardBody>
            <form action={action} className="space-y-5">
              {/* Title + Type */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="block text-text-secondary text-sm font-medium">
                    Titre <span className="text-red-400 text-xs">*</span>
                  </label>
                  <input
                    name="title"
                    type="text"
                    required
                    placeholder="Assemblée mensuelle — Avril 2026"
                    className={inputClass}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-text-secondary text-sm font-medium">Type</label>
                  <select name="type" defaultValue="monthly" className={inputClass}>
                    {ASSEMBLY_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Date + Video URL */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-text-secondary text-sm font-medium">
                    Date de la réunion <span className="text-red-400 text-xs">*</span>
                  </label>
                  <input
                    name="heldAt"
                    type="date"
                    required
                    className={inputClass}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-text-secondary text-sm font-medium">
                    Lien vidéo <span className="text-text-muted font-normal">(optionnel)</span>
                  </label>
                  <input
                    name="videoUrl"
                    type="url"
                    placeholder="https://youtube.com/watch?v=..."
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Content */}
              <div className="space-y-1.5">
                <label className="block text-text-secondary text-sm font-medium">
                  Compte rendu <span className="text-red-400 text-xs">*</span>
                </label>
                <RichTextEditor
                  name="content"
                  placeholder="Ordre du jour, décisions prises, points abordés…"
                  minHeight={240}
                />
              </div>

              {state.error && (
                <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded px-3 py-2">
                  {state.error}
                </p>
              )}

              <Button type="submit" disabled={pending}>
                {pending ? <><Spinner />Publication…</> : "Publier le compte rendu"}
              </Button>
            </form>
          </CardBody>
        </Card>
      </Container>
    </div>
  );
}
