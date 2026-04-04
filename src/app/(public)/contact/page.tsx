import type { Metadata } from "next";
import { ExternalLink, Clock } from "lucide-react";

export const dynamic = "force-dynamic";

import { PageHeader } from "@/components/layout/PageHeader";
import { Section } from "@/components/blocks/Section";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Separator } from "@/components/ui/Separator";

import { getContactContent } from "@/lib/site-content/loader";
import { CONTACT_META } from "@/content/contact";

export const metadata: Metadata = {
  title: CONTACT_META.title,
  description: CONTACT_META.description,
};

export default async function ContactPage() {
  const contact = await getContactContent();

  return (
    <>
      <PageHeader
        eyebrow={contact.intro.eyebrow}
        title={contact.intro.headline}
        description={contact.intro.body}
      />

      <Section bg="surface" spacing="lg">
        <div className="max-w-4xl">
          {/* Disponibilité */}
          <div className="flex items-center gap-3 mb-10 p-4 bg-bg-elevated border border-border rounded-md">
            <Clock size={16} className="text-gold/70 flex-shrink-0" aria-hidden />
            <div>
              <span className="text-text-muted text-xs font-semibold tracking-widest uppercase">
                Disponibilité
              </span>
              <span className="text-text-secondary text-sm ml-3">
                {contact.availability}
              </span>
            </div>
          </div>

          {/* Canaux */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {contact.channels.map((channel) => (
              <Card key={channel.id} className="h-full">
                <CardBody className="space-y-3 h-full flex flex-col">
                  <h3 className="font-display font-semibold text-lg text-text-primary">
                    {channel.title}
                  </h3>
                  <p className="text-text-secondary text-sm leading-relaxed flex-1">
                    {channel.description}
                  </p>
                  <p className="text-text-muted text-xs font-mono">
                    {channel.detail}
                  </p>
                  {channel.ctaLabel && channel.ctaHref && (
                    <div className="pt-2">
                      <Button
                        as="a"
                        href={channel.ctaHref}
                        variant="secondary"
                        size="sm"
                        className="w-full"
                        {...(channel.ctaExternal
                          ? { target: "_blank", rel: "noopener noreferrer" }
                          : {})}
                      >
                        {channel.ctaLabel}
                        {channel.ctaExternal && (
                          <ExternalLink size={13} aria-hidden />
                        )}
                      </Button>
                    </div>
                  )}
                </CardBody>
              </Card>
            ))}
          </div>

          <Separator className="mb-12" />

          {/* Formulaire — placeholder */}
          <div className="space-y-4">
            <h2 className="font-display font-bold text-2xl text-text-primary">
              Formulaire de contact
            </h2>
            <p className="text-text-secondary text-sm leading-relaxed max-w-lg">
              {contact.formNote}
            </p>
            <div className="bg-bg-elevated border border-border border-dashed rounded-md p-8 text-center">
              <p className="text-text-muted text-sm">
                Formulaire de contact — disponible prochainement.
              </p>
              <p className="text-text-muted text-xs mt-2">
                En attendant, utilisez Discord ou le contact en jeu.
              </p>
              <Button
                as="a"
                href="https://discord.gg/tabou"
                variant="primary"
                size="md"
                className="mt-6"
                target="_blank"
                rel="noopener noreferrer"
              >
                Rejoindre le Discord
              </Button>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
