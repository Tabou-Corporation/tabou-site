"use client";

import { useActionState, useState, useEffect } from "react";
import { updateAssembly, republishAssemblyToDiscord } from "@/lib/actions/content";
import { Container } from "@/components/layout/Container";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { Separator } from "@/components/ui/Separator";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import Link from "next/link";
import { ArrowLeft, Send } from "lucide-react";
import { useParams } from "next/navigation";

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

interface AssemblyData {
  id: string;
  title: string;
  content: string;
  videoUrl: string | null;
  type: string;
  heldAt: string;
}

export default function EditAssemblyPage() {
  const { id } = useParams<{ id: string }>();
  const [state, action, pending] = useActionState(updateAssembly, {});
  const [assembly, setAssembly] = useState<AssemblyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [republishing, setRepublishing] = useState(false);
  const [republished, setRepublished] = useState(false);

  useEffect(() => {
    fetch(`/api/assemblies/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: AssemblyData | null) => {
        setAssembly(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="py-10 flex justify-center">
        <Spinner />
      </div>
    );
  }

  if (!assembly) {
    return (
      <div className="py-10 sm:py-14">
        <Container size="md">
          <p className="text-text-muted">Assemblée introuvable.</p>
        </Container>
      </div>
    );
  }

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
            Modifier le compte rendu
          </h1>
        </div>

        <Separator gold className="mb-8" />

        <Card>
          <CardHeader>
            <h2 className="font-display font-semibold text-base text-text-primary">
              Modifier le compte rendu
            </h2>
          </CardHeader>
          <CardBody>
            <form action={action} className="space-y-5">
              <input type="hidden" name="id" value={assembly.id} />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="block text-text-secondary text-sm font-medium">
                    Titre <span className="text-red-400 text-xs">*</span>
                  </label>
                  <input
                    name="title"
                    type="text"
                    required
                    defaultValue={assembly.title}
                    className={inputClass}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-text-secondary text-sm font-medium">Type</label>
                  <select name="type" defaultValue={assembly.type} className={inputClass}>
                    {ASSEMBLY_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-text-secondary text-sm font-medium">
                    Date de la réunion <span className="text-red-400 text-xs">*</span>
                  </label>
                  <input
                    name="heldAt"
                    type="date"
                    required
                    defaultValue={assembly.heldAt.slice(0, 10)}
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
                    defaultValue={assembly.videoUrl ?? ""}
                    placeholder="https://youtube.com/watch?v=..."
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-text-secondary text-sm font-medium">
                  Compte rendu <span className="text-red-400 text-xs">*</span>
                </label>
                <RichTextEditor
                  name="content"
                  placeholder="Ordre du jour, décisions prises, points abordés…"
                  minHeight={240}
                  defaultValue={assembly.content}
                />
              </div>

              {state.error && (
                <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded px-3 py-2">
                  {state.error}
                </p>
              )}

              <div className="flex items-center gap-3">
                <Button type="submit" disabled={pending}>
                  {pending ? <><Spinner />Enregistrement…</> : "Enregistrer les modifications"}
                </Button>
                <button
                  type="button"
                  disabled={republishing}
                  onClick={async () => {
                    setRepublishing(true);
                    setRepublished(false);
                    const result = await republishAssemblyToDiscord(id);
                    setRepublishing(false);
                    if (result.success) setRepublished(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs rounded border border-[#5865F2]/40 text-[#5865F2] hover:bg-[#5865F2]/10 transition-colors disabled:opacity-50"
                >
                  {republishing ? <Spinner /> : <Send size={13} />}
                  Republier sur Discord
                </button>
                {republished && (
                  <span className="text-green-400 text-xs">Envoyé !</span>
                )}
              </div>
            </form>
          </CardBody>
        </Card>
      </Container>
    </div>
  );
}
