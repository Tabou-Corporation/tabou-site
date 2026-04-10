"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { Search, ClipboardList, MessageSquare, History } from "lucide-react";

const TABS = [
  { key: undefined,        label: "Parcourir",     icon: Search },
  { key: "mes-annonces",   label: "Mes annonces",  icon: ClipboardList },
  { key: "mes-offres",     label: "Mes offres",    icon: MessageSquare },
  { key: "historique",     label: "Historique",     icon: History },
] as const;

interface Props {
  myListingsCount?: number;
  myPendingOffersCount?: number;
}

export function MarketTabs({ myListingsCount, myPendingOffersCount }: Props) {
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") ?? undefined;

  return (
    <div className="flex items-center gap-1 border-b border-border mb-6 overflow-x-auto">
      {TABS.map(({ key, label, icon: Icon }) => {
        const isActive = currentTab === key;
        const badge =
          key === "mes-annonces" ? myListingsCount :
          key === "mes-offres" ? myPendingOffersCount :
          undefined;

        return (
          <Link
            key={label}
            href={key ? `/membre/marche?tab=${key}` : "/membre/marche"}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium whitespace-nowrap transition-colors border-b-2 -mb-px",
              isActive
                ? "border-gold text-gold"
                : "border-transparent text-text-muted hover:text-text-secondary hover:border-border-accent"
            )}
          >
            <Icon size={13} />
            {label}
            {badge !== undefined && badge > 0 && (
              <span className="bg-gold text-bg-deep text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                {badge}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
