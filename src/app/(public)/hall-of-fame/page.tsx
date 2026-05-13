import type { Metadata } from "next";
import { HallOfFamePanel } from "@/components/map/HallOfFamePanel";
import { PageHeader } from "@/components/layout/PageHeader";
import { SITE_CONFIG } from "@/config/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Hall of Fame — Classement all-time Tabou × Urban Zone",
  description:
    "Classement cumulé des pilotes Tabou et Urban Zone par kills depuis la "
    + "création de chaque corporation, toutes régions confondues. Source : zKillboard.",
  alternates: { canonical: `${SITE_CONFIG.url}/hall-of-fame` },
  openGraph: { url: `${SITE_CONFIG.url}/hall-of-fame` },
};

export default function HallOfFamePage() {
  return (
    <>
      <PageHeader
        eyebrow="Hall of Fame"
        title="Les pilotes qui dominent"
        description="Classement all-time des pilotes Tabou et Urban Zone par kills cumulés. Données zKillboard, toutes régions confondues, depuis la création de chaque corporation."
      />
      <HallOfFamePanel />
    </>
  );
}
