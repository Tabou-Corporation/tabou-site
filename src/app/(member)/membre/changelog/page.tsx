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
    version: "3.1",
    title: "Suivi Pro & Securite",
    description: "Notifications en temps reel, historique des transactions, dashboard marche repense, audit de securite complet et optimisations de performance.",
    status: "current",
    changes: [
      { type: "feature", label: "Notifications in-app — offre recue, acceptee, refusee, annonce vendue ou expiree" },
      { type: "feature", label: "Historique des transactions — snapshot permanent avec prix final, acheteur et vendeur" },
      { type: "feature", label: "Dashboard marche a onglets — Parcourir, Mes annonces, Mes offres, Historique" },
      { type: "feature", label: "Badges dans la sidebar — compteur de notifications non lues sur le marche" },
      { type: "feature", label: "Centre de notifications (/membre/notifications) avec marquage automatique" },
      { type: "feature", label: "Gestion admin des transactions — archivage (directeurs) et suppression avec double confirmation (admin)" },
      { type: "feature", label: "Champ localisation sur les annonces du marche" },
      { type: "feature", label: "Cron de nettoyage quotidien — purge notifications, logs, sessions et annonces perimees" },
      { type: "improvement", label: "Liste d'items repliable (8 par defaut) sur les annonces" },
      { type: "improvement", label: "Slider de prix sur les offres — mode pourcentage (50-150%) ou saisie libre" },
      { type: "improvement", label: "Top pilotes charge en parallele au dashboard (+5s de gain)" },
      { type: "improvement", label: "Notifications batch via createMany au lieu de boucles individuelles" },
      { type: "improvement", label: "Index DB ajoutes (Session, Account) pour accelerer les requetes" },
      { type: "improvement", label: "Pagination reduite (200 → 50) sur candidatures, transactions, guides" },
      { type: "fix", label: "Acces member_uz corrige — pages et actions du marche accessibles" },
      { type: "fix", label: "Separateurs FAQ visibles entre chaque question" },
      { type: "security", label: "Sanitisation HTML Tiptap via DOMPurify (anti-XSS)" },
      { type: "security", label: "Auth cron securisee avec crypto.timingSafeEqual (anti timing-attack)" },
      { type: "security", label: "Verification d'ownership par domaine sur update/delete annonces et evenements" },
      { type: "security", label: "Validation Zod stricte sur les donnees de profil etendu" },
      { type: "security", label: "CSP durcie — img-src restreint aux domaines connus, upgrade-insecure-requests" },
      { type: "security", label: "Retry ESI avec backoff exponentiel (3 tentatives) — plus de promotions silencieusement ratees" },
      { type: "security", label: "Optimisation images — suppression de 10x unoptimized (lazy loading reactif)" },
    ],
  },
  {
    version: "3.0",
    title: "Marche inter-membres",
    description: "Place de marche entre membres : publiez des annonces de vente, achat ou echange d'items avec estimation Jita en temps reel, systeme d'offres et negociation directe.",
    status: "released",
    changes: [
      { type: "feature", label: "Marche P2P — les membres publient des annonces (vente, achat, echange) avec leurs propres prix" },
      { type: "feature", label: "Estimation Jita automatique — collez vos items depuis EVE, les prix Jita buy sont calcules via ESI + Fuzzwork" },
      { type: "feature", label: "Systeme d'offres — proposez un prix et/ou un message, le vendeur accepte ou refuse" },
      { type: "feature", label: "Tarification flexible — prix fixe ISK, pourcentage du Jita buy, ou ouvert aux offres" },
      { type: "feature", label: "Expiration automatique apres 14 jours (max 5 annonces ouvertes par membre)" },
      { type: "feature", label: "Notifications Discord pour les nouvelles annonces et offres" },
      { type: "improvement", label: "Navigation membre enrichie avec acces direct au marche" },
      { type: "improvement", label: "Moderation officer — possibilite de fermer toute annonce" },
    ],
  },
  {
    version: "2.9",
    title: "Filet de Securite Auto-Role",
    description: "Deux garde-fous pour que plus aucun membre Tabou/UZ ne reste bloque en candidat : fallback DB quand l'ESI timeout au login, et le cron sync rattrape desormais les candidats manques.",
    status: "released",
    changes: [
      { type: "fix", label: "Auto-role login : fallback sur le corporationId en base quand l'ESI échoue — un membre connu n'est plus bloqué en « candidat »" },
      { type: "fix", label: "Cron sync étendu aux candidates avec un character ID — rattrape automatiquement les promotions manquées au premier login" },
    ],
  },
  {
    version: "2.8",
    title: "ESI-First & Robustesse Recrutement",
    description: "L'ESI devient la seule source de vérité pour les rôles — plus de blocages, plus de doublons, et le processus d'acceptation guide clairement recruteur et candidat.",
    status: "released",
    changes: [
      { type: "security",    label: "Acceptation ESI-first : la promotion interroge l'ESI en temps réel au lieu du corporationId stocké en DB (potentiellement périmé)" },
      { type: "fix",         label: "Conflit signIn ↔ acceptation supprimé — plus de candidat suspendu immédiatement après avoir été accepté" },
      { type: "fix",         label: "Grace period 24h : si une candidature a été acceptée récemment, le signIn et le cron sync ne suspendent pas même si l'ESI n'est pas encore à jour" },
      { type: "fix",         label: "Si le candidat n'est pas encore dans la corp au moment de l'acceptation, la promotion est automatiquement différée à sa prochaine connexion" },
      { type: "fix",         label: "Invalidation de session à l'acceptation — plus de tableau de bord 'candidat' bloqué après promotion" },
      { type: "security",    label: "Champ eveCharacterId unique en base — les doublons de comptes créés par double-clic au premier login sont automatiquement fusionnés" },
      { type: "feature",     label: "Toast 'warning' (ambre) : le recruteur est informé quand la promotion est différée en attente de l'ESI" },
      { type: "improvement", label: "Timeline candidature : étape 'Intégration en jeu' active après acceptation avec instructions claires (rejoindre la corp + délai ESI ~1h)" },
    ],
  },
  {
    version: "2.7",
    title: "Sécurité, Robustesse & SEO",
    description: "Renforcement sécurité HTTP, robustesse du site, indexation Google et correction de bugs critiques.",
    status: "released",
    changes: [
      { type: "security", label: "Header HSTS ajouté — HTTPS forcé sur tous les navigateurs pour 1 an" },
      { type: "fix",      label: "SITE_CONFIG.url corrigé (tabou-corp.fr → tabou-eve.fr) — sitemap, JSON-LD et canonicals étaient sur le mauvais domaine" },
      { type: "feature",  label: "Webhook admin/monitoring Discord — alerte automatique si la sync ESI quotidienne rencontre des erreurs" },
      { type: "improvement", label: "Loading skeletons sur les pages de détail (guides, assemblées, candidatures)" },
      { type: "fix",      label: "Race condition auth corrigée — plus de doublons de compte au premier login (double-clic / retry réseau)" },
      { type: "fix",      label: "Doublon utilisateur multiface supprimé en base, corporationId restauré" },
      { type: "fix",      label: "Lien Discord de la sidebar membre dynamique depuis le CMS (n'était plus hardcodé)" },
    ],
  },
  {
    version: "2.6",
    title: "CMS Étendu & Pilotage Navigation",
    description: "Notifications Discord configurables, compteur ESI en temps réel, suivi des candidatures amélioré et contrôle admin de la navigation.",
    status: "released",
    changes: [
      { type: "feature", label: "Notifications Discord pour annonces, guides, assemblées et événements (webhooks configurables par canal)" },
      { type: "feature", label: "Compteur de membres Tabou dynamique via ESI sur la page d'accueil" },
      { type: "feature", label: "Toggle ESI auto dans l'éditeur CMS pour les stats de la home" },
      { type: "feature", label: "Timeline de suivi dans les candidatures (historique des étapes)" },
      { type: "feature", label: "Alerte recruteur si le candidat appartient à une corporation concurrente" },
      { type: "feature", label: "Onglet \"Pilotes\" masquable/affichable depuis l'admin CMS (onglet Navigation)" },
      { type: "improvement", label: "Logo de la homepage recentré au-dessus du wordmark TABOU" },
      { type: "fix", label: "Liens Discord dynamiques depuis le CMS sur l'ensemble du site" },
      { type: "fix", label: "Label ESI pour le compteur de membres corrigé" },
    ],
  },
  {
    version: "2.5",
    title: "Synchronisation & Fiabilité",
    description: "Sync automatique des corporations, refonte admin et renforcement de la fiabilité du site.",
    status: "released",
    changes: [
      { type: "feature", label: "Sync automatique quotidien des corporations via ESI (Vercel Cron)" },
      { type: "feature", label: "Bouton de sync ESI manuel dans le dashboard admin" },
      { type: "feature", label: "Dashboard admin repensé : alertes, tendances, timeline d'activité" },
      { type: "fix", label: "Premier login : les membres Tabou/UZ obtiennent le bon rôle directement" },
      { type: "fix", label: "Transition automatique member ↔ member_uz au changement de corporation" },
      { type: "fix", label: "Logos de corporation corrects dans l'annuaire et la fiche pilote" },
      { type: "fix", label: "Navigation mobile : toutes les sections Staff et Admin accessibles" },
      { type: "fix", label: "Espace membre : arrivée sur le tableau de bord (plus l'annuaire) sur mobile" },
      { type: "security", label: "Transactions atomiques pour les candidatures et changements de rôle" },
      { type: "security", label: "Invalidation de session immédiate au changement de rôle" },
      { type: "security", label: "ESI down : aucune donnée écrasée, arrêt anticipé après 5 échecs" },
      { type: "improvement", label: "Index DB ajoutés pour les performances (candidatures, événements)" },
      { type: "improvement", label: "Audit trail étendu : actions sync tracées dans les logs" },
    ],
  },
  {
    version: "2.4",
    title: "Intégrations EVE Online",
    description: "Connexion aux APIs EVE pour enrichir les profils pilotes et le suivi d'activité.",
    status: "released",
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
