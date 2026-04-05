"use client";

import { useState, useCallback } from "react";
import { Calendar, momentLocalizer, Views } from "react-big-calendar";
import moment from "moment";
import "moment/locale/fr";
import { motion, AnimatePresence } from "framer-motion";
import { X, Clock, User, Check, HelpCircle, XCircle, Send, RefreshCw, Trash2, Pencil } from "lucide-react";
import { rsvpEvent, cancelRsvp, notifyDiscordEvent } from "@/lib/actions/rsvp";
import { deleteCalendarEvent } from "@/lib/actions/content";
import { useToast } from "@/contexts/ToastContext";
import { cn } from "@/lib/utils/cn";
import { RichTextContent } from "@/components/ui/RichTextContent";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "../../app/(member)/membre/calendrier/calendar.css";

// ── Localizer ──────────────────────────────────────────────────────────────

moment.locale("fr");
const localizer = momentLocalizer(moment);

// ── Types ──────────────────────────────────────────────────────────────────

export interface CalendarEvent {
  id: string;         // occurrenceId (unique par occurrence)
  eventId: string;    // id base de l'événement (pour RSVP)
  title: string;
  type: string;
  description: string | null;
  recurrence: string;
  startAt: Date;
  endAt: Date | null;
  authorName: string | null;
  participations: {
    userId: string;
    status: "GOING" | "MAYBE" | "NOT_GOING";
    userName: string | null;
  }[];
}

interface CorpCalendarProps {
  events: CalendarEvent[];
  currentUserId: string;
  isOfficer: boolean;
}

// ── Couleurs par type ──────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  op: "Opération", training: "Formation", social: "Event social", other: "Autre",
};

const RSVP_LABELS = {
  GOING:     { label: "Je participe", icon: Check,       color: "text-green-400 border-green-400/30 bg-green-400/10" },
  MAYBE:     { label: "Peut-être",    icon: HelpCircle,  color: "text-yellow-400 border-yellow-400/30 bg-yellow-400/10" },
  NOT_GOING: { label: "Absent",       icon: XCircle,     color: "text-red-400 border-red-400/30 bg-red-400/10" },
};

// ── Composant principal ────────────────────────────────────────────────────

export function CorpCalendar({ events, currentUserId, isOfficer }: CorpCalendarProps) {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [discordSent, setDiscordSent] = useState(false);

  // Adapter pour react-big-calendar
  const rbcEvents = events.map((e) => ({
    id: e.id,
    title: e.title,
    start: new Date(e.startAt),
    end: e.endAt ? new Date(e.endAt) : new Date(new Date(e.startAt).getTime() + 3600_000),
    resource: e,
    className: `event-${e.type}`,
  }));

  const handleSelectEvent = useCallback((rbcEvent: typeof rbcEvents[number]) => {
    setSelectedEvent(rbcEvent.resource);
    setDiscordSent(false);
  }, []);

  const eventPropGetter = useCallback((rbcEvent: typeof rbcEvents[number]) => ({
    className: `event-${rbcEvent.resource.type}`,
  }), []);

  const { addToast } = useToast();

  const handleDiscord = async () => {
    if (!selectedEvent) return;
    await notifyDiscordEvent(selectedEvent.id);
    setDiscordSent(true);
    addToast("Notification envoyée sur Discord", "success");
  };

  return (
    <div className="relative">
      {/* ── Calendrier ── */}
      <div className="h-[640px]">
        <Calendar
          localizer={localizer}
          events={rbcEvents}
          startAccessor="start"
          endAccessor="end"
          views={[Views.MONTH, Views.WEEK, Views.AGENDA]}
          defaultView={Views.MONTH}
          culture="fr"
          onSelectEvent={handleSelectEvent}
          eventPropGetter={eventPropGetter}
          messages={{
            month: "Mois", week: "Semaine", agenda: "Agenda",
            today: "Aujourd'hui", next: "›", previous: "‹",
            showMore: (n) => `+${n} de plus`,
            noEventsInRange: "Aucun événement sur cette période.",
            date: "Date", time: "Horaire", event: "Événement",
          }}
          popup
        />
      </div>

      {/* ── Panel détail événement ── */}
      <AnimatePresence>
        {selectedEvent && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setSelectedEvent(null)}
            />

            {/* Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 400, damping: 35 }}
              className="fixed right-0 top-0 h-full w-full max-w-md bg-bg-surface border-l border-border z-50 flex flex-col overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-start justify-between p-6 border-b border-border-subtle">
                <div className="flex-1 min-w-0 pr-4">
                  <span className={cn(
                    "text-xs font-semibold tracking-widest uppercase mb-2 block",
                    selectedEvent.type === "op" ? "text-gold" : "text-text-muted"
                  )}>
                    {TYPE_LABELS[selectedEvent.type] ?? selectedEvent.type}
                  </span>
                  <h2 className="font-display font-bold text-xl text-text-primary leading-tight">
                    {selectedEvent.title}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="text-text-muted hover:text-text-primary transition-colors flex-shrink-0"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Infos */}
              <div className="p-6 space-y-5 flex-1">
                {/* Date/heure */}
                <div className="flex items-start gap-3">
                  <Clock size={16} className="text-text-muted mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="text-text-primary font-medium capitalize">
                      {new Date(selectedEvent.startAt).toLocaleDateString("fr-FR", {
                        weekday: "long", day: "numeric", month: "long", year: "numeric",
                      })}
                    </p>
                    <p className="text-text-muted">
                      {new Date(selectedEvent.startAt).toLocaleTimeString("fr-FR", {
                        hour: "2-digit", minute: "2-digit",
                      })} EVE
                      {selectedEvent.endAt && (
                        <> → {new Date(selectedEvent.endAt).toLocaleTimeString("fr-FR", {
                          hour: "2-digit", minute: "2-digit",
                        })} EVE</>
                      )}
                    </p>
                  </div>
                </div>

                {/* Récurrence */}
                {selectedEvent.recurrence !== "none" && (
                  <div className="flex items-center gap-3">
                    <RefreshCw size={16} className="text-text-muted flex-shrink-0" />
                    <p className="text-sm text-text-secondary">
                      {{
                        weekly:   "Se répète chaque semaine",
                        biweekly: "Se répète toutes les 2 semaines",
                        monthly:  "Se répète chaque mois",
                      }[selectedEvent.recurrence] ?? "Récurrent"}
                    </p>
                  </div>
                )}

                {/* Organisateur */}
                <div className="flex items-center gap-3">
                  <User size={16} className="text-text-muted flex-shrink-0" />
                  <p className="text-sm text-text-secondary">
                    Organisé par <span className="text-text-primary font-medium">{selectedEvent.authorName ?? "Officier"}</span>
                  </p>
                </div>

                {/* Description */}
                {selectedEvent.description && (
                  <div className="border-l-2 border-gold/30 pl-4">
                    <RichTextContent html={selectedEvent.description} />
                  </div>
                )}

                {/* Séparateur */}
                <div className="h-px bg-border-subtle" />

                {/* RSVP */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-extra-wide text-text-muted mb-3">
                    Ma participation
                  </p>
                  <RsvpButtons
                    eventId={selectedEvent.eventId}
                    currentStatus={
                      selectedEvent.participations.find(p => p.userId === currentUserId)?.status ?? null
                    }
                    onUpdate={(newStatus) => {
                      setSelectedEvent(prev => {
                        if (!prev) return prev;
                        const others = prev.participations.filter(p => p.userId !== currentUserId);
                        if (newStatus === null) return { ...prev, participations: others };
                        return {
                          ...prev,
                          participations: [...others, { userId: currentUserId, status: newStatus, userName: null }],
                        };
                      });
                    }}
                  />
                </div>

                {/* Participants */}
                <ParticipantList participations={selectedEvent.participations} currentUserId={currentUserId} />

                {/* Actions officer */}
                {isOfficer && (
                  <div className="pt-2 border-t border-border-subtle space-y-2">
                    <button
                      onClick={handleDiscord}
                      disabled={discordSent}
                      className={cn(
                        "w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm border rounded transition-colors",
                        discordSent
                          ? "border-green-400/30 text-green-400 bg-green-400/5 cursor-default"
                          : "border-border text-text-muted hover:border-[#5865F2]/60 hover:text-[#5865F2] hover:bg-[#5865F2]/5"
                      )}
                    >
                      <Send size={14} />
                      {discordSent ? "Envoyé sur Discord ✓" : "Notifier sur Discord"}
                    </button>
                    <a
                      href={`/staff/calendrier/${selectedEvent.eventId}/edit`}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm border border-border text-text-muted rounded hover:border-gold/40 hover:text-gold hover:bg-gold/5 transition-colors"
                    >
                      <Pencil size={14} />
                      Modifier l&apos;événement
                    </a>
                    <form
                      action={async () => {
                        if (!window.confirm(`Supprimer "${selectedEvent.title}" définitivement ?`)) return;
                        const result = await deleteCalendarEvent(selectedEvent.eventId);
                        if (!result.success) {
                          addToast(result.error, "error");
                          return;
                        }
                        setSelectedEvent(null);
                        addToast("Événement supprimé", "info");
                      }}
                    >
                      <button
                        type="submit"
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm border border-red-400/20 text-red-400/60 rounded hover:border-red-400/50 hover:text-red-400 hover:bg-red-400/5 transition-colors"
                      >
                        <Trash2 size={14} />
                        Supprimer l&apos;événement
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Boutons RSVP ──────────────────────────────────────────────────────────

function RsvpButtons({
  eventId,
  currentStatus,
  onUpdate,
}: {
  eventId: string;
  currentStatus: "GOING" | "MAYBE" | "NOT_GOING" | null;
  onUpdate: (status: "GOING" | "MAYBE" | "NOT_GOING" | null) => void;
}) {
  const [pending, setPending] = useState(false);
  const { addToast } = useToast();

  const RSVP_TOAST: Record<"GOING" | "MAYBE" | "NOT_GOING", string> = {
    GOING:     "Participation enregistrée ✓",
    MAYBE:     "Réponse « Peut-être » enregistrée",
    NOT_GOING: "Absence enregistrée",
  };

  const handle = async (status: "GOING" | "MAYBE" | "NOT_GOING") => {
    setPending(true);
    if (currentStatus === status) {
      await cancelRsvp(eventId);
      onUpdate(null);
      addToast("Participation annulée", "info");
    } else {
      await rsvpEvent(eventId, status);
      onUpdate(status);
      addToast(RSVP_TOAST[status], "success");
    }
    setPending(false);
  };

  return (
    <div className="flex gap-2">
      {(["GOING", "MAYBE", "NOT_GOING"] as const).map((status) => {
        const { label, icon: Icon, color } = RSVP_LABELS[status];
        const active = currentStatus === status;
        return (
          <button
            key={status}
            onClick={() => handle(status)}
            disabled={pending}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-semibold border rounded transition-all",
              active ? color : "border-border-subtle text-text-muted hover:border-border hover:text-text-secondary",
              pending && "opacity-50 cursor-wait"
            )}
          >
            <Icon size={13} />
            {label}
          </button>
        );
      })}
    </div>
  );
}

// ── Liste participants ─────────────────────────────────────────────────────

function ParticipantList({
  participations,
  currentUserId,
}: {
  participations: CalendarEvent["participations"];
  currentUserId: string;
}) {
  const going    = participations.filter(p => p.status === "GOING");
  const maybe    = participations.filter(p => p.status === "MAYBE");
  const notGoing = participations.filter(p => p.status === "NOT_GOING");

  if (participations.length === 0) {
    return (
      <p className="text-xs text-text-muted italic">Aucune réponse pour l&apos;instant.</p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-extra-wide text-text-muted">
        Participants ({participations.length})
      </p>
      {[
        { list: going,    label: "Présents",    color: "text-green-400" },
        { list: maybe,    label: "Peut-être",   color: "text-yellow-400" },
        { list: notGoing, label: "Absents",     color: "text-red-400" },
      ].map(({ list, label, color }) =>
        list.length > 0 ? (
          <div key={label}>
            <p className={cn("text-xs font-medium mb-1", color)}>
              {label} ({list.length})
            </p>
            <div className="flex flex-wrap gap-1.5">
              {list.map((p) => (
                <span
                  key={p.userId}
                  className={cn(
                    "text-xs px-2 py-0.5 rounded-sm bg-bg-elevated border border-border-subtle",
                    p.userId === currentUserId && "border-gold/40 text-gold"
                  )}
                >
                  {p.userName ?? "Pilote"}
                </span>
              ))}
            </div>
          </div>
        ) : null
      )}
    </div>
  );
}
