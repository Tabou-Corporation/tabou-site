import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { hasMinRole, parseSpecialties } from "@/types/roles";
import { Container } from "@/components/layout/Container";
import { Separator } from "@/components/ui/Separator";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getRawPageContent } from "@/lib/site-content/loader";
import { HomeEditor } from "./HomeEditor";
import { CorporationEditor } from "./CorporationEditor";
import { RecruitmentEditor } from "./RecruitmentEditor";
import { FaqEditor } from "./FaqEditor";
import { ActivitiesEditor } from "./ActivitiesEditor";
import { ContactEditor } from "./ContactEditor";
import { DiscordEditor } from "./DiscordEditor";
import { SettingsEditor } from "./SettingsEditor";
import type { UserRole } from "@/types/roles";

const ALL_TABS = [
  { key: "home",        label: "Accueil",      directorOnly: true },
  { key: "corporation", label: "Corporation",   directorOnly: true },
  { key: "recruitment", label: "Recrutement",   directorOnly: true },
  { key: "faq",         label: "FAQ",           directorOnly: true },
  { key: "activities",  label: "Activités",     directorOnly: false },
  { key: "contact",     label: "Contact",       directorOnly: true },
  { key: "discord",     label: "Discord",       directorOnly: true },
  { key: "settings",    label: "Navigation",    directorOnly: true },
] as const;

type TabKey = typeof ALL_TABS[number]["key"];

export default async function ContenuPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const role = (session.user.role ?? "candidate") as UserRole;
  const domains = parseSpecialties(session.user.specialties);
  const isDirector = hasMinRole(role, "director");
  const isOfficer = hasMinRole(role, "officer");

  // Officer avec domaines de contenu : accès uniquement à l'onglet activités
  // Director+ : accès à tout
  const hasContentDomain = domains.some((d) => d !== "recruitment");
  if (!isDirector && !(isOfficer && hasContentDomain)) redirect("/membre");

  // Tabs visibles pour cet utilisateur
  const visibleTabs = isDirector
    ? ALL_TABS
    : ALL_TABS.filter((t) => !t.directorOnly);

  const { tab } = await searchParams;
  const activeTab: TabKey =
    visibleTabs.find((t) => t.key === tab)?.key ?? visibleTabs[0]?.key ?? "activities";

  // Charger le contenu de l'onglet actif
  const [homeContent, corpContent, recruitContent, faqContent, activitiesContent, contactContent, discordContent, settingsContent] =
    await Promise.all([
      getRawPageContent("home"),
      getRawPageContent("corporation"),
      getRawPageContent("recruitment"),
      getRawPageContent("faq"),
      getRawPageContent("activities"),
      getRawPageContent("contact"),
      getRawPageContent("discord"),
      getRawPageContent("settings"),
    ]);

  return (
    <div className="py-10 sm:py-14">
      <Container>
        {/* Back */}
        <div className="mb-6">
          <Link
            href="/staff/admin"
            className="inline-flex items-center gap-1.5 text-text-muted text-sm hover:text-text-secondary transition-colors"
          >
            <ArrowLeft size={14} />
            Retour à l&apos;administration
          </Link>
        </div>

        <div className="mb-8">
          <p className="text-gold text-xs font-semibold tracking-extra-wide uppercase mb-2">Zone admin</p>
          <h1 className="font-display font-bold text-3xl text-text-primary">Contenu du site</h1>
          <p className="text-text-muted text-sm mt-1">
            Modifiez les textes des pages publiques. Les changements sont publiés immédiatement.
          </p>
        </div>

        <Separator gold className="mb-8" />

        {/* Tabs nav */}
        <div className="flex items-center gap-1 flex-wrap mb-8 border-b border-border pb-0">
          {visibleTabs.map((t) => (
            <Link
              key={t.key}
              href={`/staff/admin/contenu?tab=${t.key}`}
              className={[
                "px-4 py-2 text-sm font-medium rounded-t-md border-b-2 transition-colors whitespace-nowrap",
                activeTab === t.key
                  ? "border-gold text-gold bg-gold/5"
                  : "border-transparent text-text-muted hover:text-text-secondary hover:border-border",
              ].join(" ")}
            >
              {t.label}
            </Link>
          ))}
        </div>

        {/* Editor */}
        <div className="max-w-3xl">
          {activeTab === "home" && isDirector && <HomeEditor initialContent={homeContent} />}
          {activeTab === "corporation" && isDirector && <CorporationEditor initialContent={corpContent} />}
          {activeTab === "recruitment" && isDirector && <RecruitmentEditor initialContent={recruitContent} />}
          {activeTab === "faq" && isDirector && <FaqEditor initialContent={faqContent} />}
          {activeTab === "activities" && (
            <ActivitiesEditor
              initialContent={activitiesContent}
              userRole={role}
              userDomains={domains}
            />
          )}
          {activeTab === "contact" && isDirector && <ContactEditor initialContent={contactContent} />}
          {activeTab === "discord" && isDirector && <DiscordEditor initialContent={discordContent} />}
          {activeTab === "settings" && isDirector && <SettingsEditor initialContent={settingsContent} />}
        </div>
      </Container>
    </div>
  );
}
