"use client";

import { useActionState } from "react";
import { useSession } from "next-auth/react";
import { createGuide } from "@/lib/actions/content";
import { Container } from "@/components/layout/Container";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { Separator } from "@/components/ui/Separator";
import { getAllowedGuideCategories, parseSpecialties } from "@/types/roles";
import { CATEGORY_LABELS } from "@/lib/constants/labels";
import type { UserRole } from "@/types/roles";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const inputClass = [
  "w-full bg-bg-elevated border rounded px-3 py-2.5",
  "text-text-primary text-sm placeholder:text-text-muted",
  "border-border focus:border-gold/60 focus:outline-none focus:ring-1 focus:ring-gold/40",
  "transition-colors duration-150",
].join(" ");

export default function NewGuidePage() {
  const [state, action, pending] = useActionState(createGuide, {});
  const { data: session } = useSession();

  const role = (session?.user?.role ?? "candidate") as UserRole;
  const domains = parseSpecialties(session?.user?.specialties);
  const allowedCategories = getAllowedGuideCategories(role, domains);

  return (
    <div className="py-10 sm:py-14">
      <Container size="md">
        <div className="mb-6">
          <Link
            href="/membre/guides"
            className="inline-flex items-center gap-1.5 text-text-muted text-sm hover:text-text-secondary transition-colors"
          >
            <ArrowLeft size={14} />
            Retour aux guides
          </Link>
        </div>

        <div className="mb-8">
          <p className="text-gold text-xs font-semibold tracking-extra-wide uppercase mb-2">
            Zone staff
          </p>
          <h1 className="font-display font-bold text-3xl text-text-primary">
            Nouveau guide
          </h1>
        </div>

        <Separator gold className="mb-8" />

        <Card>
          <CardHeader>
            <h2 className="font-display font-semibold text-base text-text-primary">
              Rédiger le guide
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
                    placeholder="Titre du guide"
                    className={inputClass}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-text-secondary text-sm font-medium">
                    Catégorie
                  </label>
                  <select name="category" defaultValue={allowedCategories[0] ?? "general"} className={inputClass}>
                    {allowedCategories.map((c) => (
                      <option key={c} value={c}>{CATEGORY_LABELS[c] ?? c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-text-secondary text-sm font-medium">
                  Contenu <span className="text-red-400 text-xs">*</span>
                </label>
                <textarea
                  name="content"
                  required
                  rows={16}
                  placeholder="Rédigez le guide ici…&#10;&#10;Vous pouvez utiliser des sauts de ligne pour structurer le contenu."
                  className={`${inputClass} resize-y min-h-[300px] font-mono text-xs`}
                />
              </div>

              {state.error && (
                <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded px-3 py-2">
                  {state.error}
                </p>
              )}

              <Button type="submit" disabled={pending}>
                {pending ? <><Spinner />Création…</> : "Créer le guide"}
              </Button>
            </form>
          </CardBody>
        </Card>
      </Container>
    </div>
  );
}
