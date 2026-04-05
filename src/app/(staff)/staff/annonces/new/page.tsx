"use client";

import { useActionState } from "react";
import { useSession } from "next-auth/react";
import { createAnnouncement } from "@/lib/actions/content";
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
import { ArrowLeft } from "lucide-react";

const inputClass = [
  "w-full bg-bg-elevated border rounded px-3 py-2.5",
  "text-text-primary text-sm placeholder:text-text-muted",
  "border-border focus:border-gold/60 focus:outline-none focus:ring-1 focus:ring-gold/40",
  "transition-colors duration-150",
].join(" ");

export default function NewAnnouncementPage() {
  const [state, action, pending] = useActionState(createAnnouncement, {});
  const { data: session } = useSession();

  const role = (session?.user?.role ?? "candidate") as UserRole;
  const domains = parseSpecialties(session?.user?.specialties);
  const allowedDomains = getAllowedContentDomains(role, domains);

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
            Zone staff
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 space-y-1.5">
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
                    Domaine
                  </label>
                  <select name="domain" defaultValue={allowedDomains[0] ?? "general"} className={inputClass}>
                    {allowedDomains.map((d) => (
                      <option key={d} value={d}>{CONTENT_DOMAIN_LABELS[d] ?? d}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-text-secondary text-sm font-medium">
                  Contenu <span className="text-red-400 text-xs">*</span>
                </label>
                <RichTextEditor
                  name="content"
                  placeholder="Contenu de l'annonce…"
                  minHeight={180}
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
                {pending ? <><Spinner />Publication…</> : "Publier l'annonce"}
              </Button>
            </form>
          </CardBody>
        </Card>
      </Container>
    </div>
  );
}
