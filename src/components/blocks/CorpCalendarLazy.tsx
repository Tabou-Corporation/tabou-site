"use client";

import nextDynamic from "next/dynamic";
import type { CalendarEvent } from "./CorpCalendar";

// Lazy load côté client : react-big-calendar + moment (~120 KB gzippé)
// chargés uniquement quand ce composant est monté (page calendrier).
// ssr: false obligatoire ici — interdit dans les Server Components.
const CorpCalendarDynamic = nextDynamic(
  () => import("./CorpCalendar").then((m) => m.CorpCalendar),
  {
    ssr: false,
    loading: () => (
      <div className="h-[600px] rounded border border-border bg-bg-elevated animate-pulse" />
    ),
  }
);

interface Props {
  events: CalendarEvent[];
  currentUserId: string;
  isOfficer: boolean;
}

export function CorpCalendarLazy(props: Props) {
  return <CorpCalendarDynamic {...props} />;
}
