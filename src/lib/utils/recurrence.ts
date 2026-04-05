/**
 * Expand recurring events into individual occurrences.
 * Each occurrence gets a stable id: `${baseId}__${index}` for display,
 * but keeps the original eventId for RSVP (RSVP is per base event).
 */

interface BaseEvent {
  id: string;
  startAt: Date;
  endAt: Date | null;
  recurrence: string;
  recurrenceEndAt: Date | null;
}

export interface ExpandedEvent<T extends BaseEvent> {
  occurrenceId: string; // unique per occurrence
  startAt: Date;
  endAt: Date | null;
  base: T;
}

const MAX_LOOKAHEAD_DAYS = 90;

export function expandRecurringEvents<T extends BaseEvent>(events: T[]): ExpandedEvent<T>[] {
  const results: ExpandedEvent<T>[] = [];
  const horizon = new Date();
  horizon.setDate(horizon.getDate() + MAX_LOOKAHEAD_DAYS);

  for (const event of events) {
    if (event.recurrence === "none" || !event.recurrenceEndAt) {
      // Event simple — une seule occurrence
      results.push({ occurrenceId: event.id, startAt: event.startAt, endAt: event.endAt, base: event });
      continue;
    }

    // Étendre la borne de fin à 23:59:59 pour inclure les événements du dernier jour
    const recEndEOD = new Date(event.recurrenceEndAt);
    recEndEOD.setHours(23, 59, 59, 999);
    const endBoundary = recEndEOD < horizon ? recEndEOD : horizon;
    const duration = event.endAt
      ? event.endAt.getTime() - event.startAt.getTime()
      : 0;

    let current = new Date(event.startAt);
    let i = 0;

    while (current <= endBoundary) {
      const occurrenceEnd = duration > 0 ? new Date(current.getTime() + duration) : null;
      results.push({
        occurrenceId: i === 0 ? event.id : `${event.id}__${i}`,
        startAt: new Date(current),
        endAt: occurrenceEnd,
        base: event,
      });

      // Avancer selon la récurrence
      const next = new Date(current);
      if (event.recurrence === "weekly")         next.setDate(next.getDate() + 7);
      else if (event.recurrence === "biweekly")  next.setDate(next.getDate() + 14);
      else if (event.recurrence === "monthly") {
        // Conserver le jour d'origine (ex: 31 → dernier jour si le mois est plus court)
        const originalDay = event.startAt.getDate();
        next.setDate(1); // éviter l'overflow de setMonth
        next.setMonth(next.getMonth() + 1);
        const daysInMonth = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
        next.setDate(Math.min(originalDay, daysInMonth));
      }
      else break; // pattern inconnu

      current = next;
      i++;
      if (i > 500) break; // sécurité boucle infinie
    }
  }

  return results.sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
}
