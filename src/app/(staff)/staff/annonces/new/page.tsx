"use client";

import { useActionState } from "react";
import { createAnnouncement } from "@/lib/actions/content";
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

export default function NewAnnouncementPage() {
  const [state, action, pending] = useActionState(createAnnouncement, {});

  return (
    <div className="py-10 sm:py-14">
      <Container size="md">
        <div className="mb-6">
          <Link
            href="/membre/annonces"
            className="inline-flex items-center gap-1.5 text-text-muted text-sm hover:text-text-secondary transition-colors"
          >
            <ArrowLeft size={14} />
            Retour aux annonces
          </Link>
        </div>

        <div className="mb-8">
          <p className="text-gold text-xs font-semibold tracking-extra-wide uppercase mb-2">
            Zone recrutement
          </p>
          <h1 className="font-display font-bold text-3xl text-text-primary">
            Nouvelle annonce
          </h1>
        </div>

        <Separator gold className="mb-8" />

        <Card>
          <CardHeader>
            <h2 className="font-display font-semibold text-base text-text-primary">
              Rédiger l&apos;annonce
            </h2>
          </CardHeader>
          <CardBody>
            <form action={action} className="space-y-5">
              <div className="space-y-1.5">
                <label className="block text-text-secondary text-sm font-medium">
                  Titre <span className="text-red-400 text-xs">*</span>
                </label>
                <input
                  name="title"
                  type="text"
                  required
                  placeholder="Titre de l'annonce"
                  className={inputClass}
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-text-secondary text-sm font-medium">
                  Contenu <span className="text-red-400 text-xs">*</span>
                </label>
                <textarea
                  name="content"
                  required
                  rows={8}
                  placeholder="Contenu de l'annonce..."
                  className={`${inputClass} resize-y min-h-[160px]`}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  name="pinned"
                  type="checkbox"
                  id="pinned"
                  className="accent-gold"
                />
                <label htmlFor="pinned" className="text-text-secondary text-sm cursor-pointer">
                  Épingler sur le dashboard membre
                </label>
              </div>

              {state.error && (
                <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded px-3 py-2">
                  {state.error}
                </p>
              )}

              <Button type="submit" disabled={pending}>
                {pending ? "Publication…" : "Publier l'annonce"}
              </Button>
            </form>
          </CardBody>
        </Card>
      </Container>
    </div>
  );
}
