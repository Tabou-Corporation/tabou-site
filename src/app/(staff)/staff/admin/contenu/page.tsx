import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { hasMinRole } from "@/types/roles";
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
import type { UserRole } from "@/types/roles";

const TABS = [
  { key: "home",        label: "Accueil" },
  { key: "corporation", label: "Corporation" },
  { key: "recruitment", label: "Recrutement" },
  { key: "faq",         label: "FAQ" },
  { key: "activities",  label: "Activités" },
  { key: "contact",     label: "Contact" },
  { key: "discord",     label: "Discord" },
] as const;

type TabKey = typeof TABS[number]["key"];

export default async function ContenuPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const role = (session.user.role ?? "candidate") as UserRole;
  if (!hasMinRole(role, "director")) redirect("/membre");

  const { tab } = await searchParams;
  const activeTab: TabKey =
    TABS.find((t) => t.key === tab)?.key ?? "home";

  // Charger le contenu de l'onglet actif
  const [homeContent, corpContent, recruitContent, faqContent, activitiesContent, contactContent, discordContent] =
    await Promise.all([
      getRawPageContent("home"),
      getRawPageContent("corporation"),
      getRawPageContent("recruitment"),
      getRawPageContent("faq"),
      getRawPageContent("activities"),
      getRawPageContent("contact"),
      getRawPageContent("discord"),
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
          {TABS.map((t) => (
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
          {activeTab === "home" && <HomeEditor initialContent={homeContent} />}
          {activeTab === "corporation" && <CorporationEditor initialContent={corpContent} />}
          {activeTab === "recruitment" && <RecruitmentEditor initialContent={recruitContent} />}
          {activeTab === "faq" && <FaqEditor initialContent={faqContent} />}
          {activeTab === "activities" && <ActivitiesEditor initialContent={activitiesContent} />}
          {activeTab === "contact" && <ContactEditor initialContent={contactContent} />}
          {activeTab === "discord" && <DiscordEditor initialContent={discordContent} />}
        </div>
      </Container>
    </div>
  );
}
