import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { hasMinRole } from "@/types/roles";
import { Container } from "@/components/layout/Container";
import { Card, CardBody } from "@/components/ui/Card";
import { Separator } from "@/components/ui/Separator";
import { Badge } from "@/components/ui/Badge";
import type { UserRole } from "@/types/roles";

// ── Types ──────────────────────────────────────────────────────────────────

type ChangeType = "feature" | "improvement" | "fix" | "security";

interface Change {
  type: ChangeType;
  label: string;
}

interface Version {
  version: string;
  title: string;
  description: string;
  status: "released" | "current" | "upcoming";
  changes: Change[];
}

// ── Données changelog ──────────────────────────────────────────────────────

const VERSIONS: Version[] = [
  {
    version: "2.4",
    title: "Intégrations EVE Online",
    description: "Connexion aux APIs EVE pour enrichir les profils pilotes et le suivi d'activité.",
    status: "current",
    changes: [
      { type: "feature", label: "Statut de sécurité récupéré via ESI pour tous les membres" },
      { type: "feature", label: "Top pilotes du mois basé sur les données zKillboard" },
      { type: "feature", label: "Lien vers le profil zKillboard dans l'annuaire" },
      { type: "improvement", label: "Fiche pilote de l'annuaire entièrement redesignée" },
      { type: "feature", label: "Page Changelog — historique des versions du site" },
    ],
  },
  {
    version: "2.3",
    title: "Backoffice Staff & Administration",
    description: "Outils de gestion complets pour les officiers et directeurs.",
    status: "released",
    changes: [
      { type: "feature", label: "Gestion des membres et attribution des rôles (directeurs+)" },
      { type: "feature", label: "Tableau de bord d'administration" },
      { type: "feature", label: "Éditeur CMS pour les pages publiques du site" },
      { type: "feature", label: "Création et édition d'annonces, guides, événements et assemblées" },
      { type: "improvement", label: "Éditeur de texte riche (Tiptap) pour tout le contenu" },
    ],
  },
  {
    version: "2.2",
    title: "Pipeline de Recrutement",
    description: "Système complet de gestion des candidatures, de la soumission à la décision.",
    status: "released",
    changes: [
      { type: "feature", label: "Formulaire de candidature pour les aspirants (membres candidate)" },
      { type: "feature", label: "Espace staff : liste et gestion des candidatures en attente" },
      { type: "feature", label: "Attribution d'un recruteur référent par candidature" },
      { type: "feature", label: "Système de notes et de décision (accepter / refuser)" },
      { type: "feature", label: "Badge de notification dans la navigation pour les candidatures en attente" },
    ],
  },
  {
    version: "2.1",
    title: "Profil Pilote",
    description: "Identité complète de chaque pilote, visible et éditable depuis l'espace membre.",
    status: "released",
    changes: [
      { type: "feature", label: "Page de profil avec portrait EVE officiel" },
      { type: "feature", label: "Bio éditable affichée dans l'annuaire interne" },
      { type: "feature", label: "Informations étendues : fuseau horaire, activités, langues" },
      { type: "feature", label: "Badges de rôle et d'appartenance à la corporation" },
      { type: "improvement", label: "Informations étendues réservées aux officiers" },
    ],
  },
  {
    version: "2.0",
    title: "Espace Membre",
    description: "Lancement de l'espace privatif pour les membres de la corporation.",
    status: "released",
    changes: [
      { type: "feature", label: "Authentification sécurisée via EVE Online SSO" },
      { type: "feature", label: "Tableau de bord personnalisé selon le rôle du pilote" },
      { type: "feature", label: "Annonces internes de la corporation" },
      { type: "feature", label: "Calendrier des événements avec système RSVP" },
      { type: "feature", label: "Base de connaissances — Guides par catégorie" },
      { type: "feature", label: "Archives des Assemblées avec vidéos" },
      { type: "feature", label: "Annuaire interne des membres avec filtres par rôle" },
    ],
  },
  {
    version: "1.1",
    title: "Administration du Contenu",
    description: "Premier outil de gestion de contenu pour les pages publiques du site.",
    status: "released",
    changes: [
      { type: "feature", label: "Interface d'édition pour les textes des pages publiques" },
      { type: "improvement", label: "Contenu du site stocké en base de données (non codé en dur)" },
    ],
  },
  {
    version: "1.0",
    title: "Site Public",
    description: "Mise en ligne du site vitrine de la Tabou Corporation.",
    status: "released",
    changes: [
      { type: "feature", label: "Page d'accueil avec présentation de la corporation" },
      { type: "feature", label: "Pages : La Corporation, Activités, Recrutement, FAQ, Contact" },
      { type: "feature", label: "Annuaire public des pilotes (lecture seule)" },
      { type: "feature", label: "Intégration Discord" },
      { type: "feature", label: "Design system EVE — thème sombre, typographie, couleurs corporation" },
    ],
  },
];

// ── Helpers ────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<ChangeType, { label: string; color: string }> = {
  feature:     { label: "Nouveau",       color: "text-gold" },
  improvement: { label: "Amélioration",  color: "text-blue-400" },
  fix:         { label: "Correctif",     color: "text-green-400" },
  security:    { label: "Sécurité",      color: "text-red-400" },
};

const STATUS_CONFIG: Record<Version["status"], { label: string; variant: "default" | "gold" | "muted" }> = {
  current:  { label: "Actuelle",   variant: "gold" },
  released: { label: "Publiée",    variant: "muted" },
  upcoming: { label: "À venir",    variant: "default" },
};

// ── Page ───────────────────────────────────────────────────────────────────

export default async function ChangelogPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const role = (session.user.role ?? "candidate") as UserRole;
  if (!hasMinRole(role, "candidate")) redirect("/");

  return (
    <div className="py-10 sm:py-14">
      <Container size="md">

        {/* En-tête */}
        <div className="mb-8">
          <p className="text-gold text-xs font-semibold tracking-extra-wide uppercase mb-2">
            Espace membre
          </p>
          <h1 className="font-display font-bold text-3xl text-text-primary">
            Changelog
          </h1>
          <p className="text-text-muted text-sm mt-2">
            Historique des versions et des fonctionnalités du site de la Tabou Corporation.
          </p>
        </div>

        <Separator gold className="mb-10" />

        {/* Timeline */}
        <div className="relative">
          {/* Ligne verticale */}
          <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border hidden sm:block" />

          <div className="space-y-10">
            {VERSIONS.map((v) => {
              const status = STATUS_CONFIG[v.status];
              return (
                <div key={v.version} className="sm:pl-10 relative">

                  {/* Dot */}
                  <div className={`
                    absolute left-0 top-1.5 w-3.5 h-3.5 rounded-full border-2 hidden sm:block
                    ${v.status === "current"
                      ? "bg-gold border-gold shadow-[0_0_8px_2px_rgba(212,175,55,0.4)]"
                      : v.status === "upcoming"
                        ? "bg-bg-deep border-border"
                        : "bg-bg-elevated border-border-subtle"
                    }
                  `} />

                  <Card accent={v.status === "current"}>
                    <CardBody className="p-5 sm:p-6">

                      {/* Header version */}
                      <div className="flex flex-wrap items-start gap-3 mb-3">
                        <div className="flex items-center gap-2.5">
                          <span className="font-display font-bold text-xl text-text-primary">
                            v{v.version}
                          </span>
                          <Badge variant={status.variant as "default" | "gold" | "muted"}>
                            {status.label}
                          </Badge>
                        </div>
                      </div>

                      <h2 className="font-display font-semibold text-base text-text-primary mb-1">
                        {v.title}
                      </h2>
                      <p className="text-text-muted text-sm mb-4 leading-relaxed">
                        {v.description}
                      </p>

                      {/* Liste des changements */}
                      <ul className="space-y-1.5">
                        {v.changes.map((c, i) => {
                          const cfg = TYPE_CONFIG[c.type];
                          return (
                            <li key={i} className="flex items-start gap-2.5 text-sm">
                              <span className={`${cfg.color} font-semibold text-[11px] uppercase tracking-wide flex-shrink-0 mt-0.5 w-20`}>
                                {cfg.label}
                              </span>
                              <span className="text-text-secondary leading-snug">{c.label}</span>
                            </li>
                          );
                        })}
                      </ul>

                    </CardBody>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>

      </Container>
    </div>
  );
}
