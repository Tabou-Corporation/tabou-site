"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { SDE } from "@/lib/map/sde";

interface MapEventLite {
  id: string;
  systemId: number | null;
  severity: string;
  title: string;
  body: string | null;
  occurredAt: string;
  createdAt: string;
}
interface MapCommentLite {
  id: string;
  systemId: number | null;
  body: string;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}
interface MapPinLite {
  id: string;
  systemId: number;
  label: string;
  kind: string;
  note: string | null;
  createdAt: string;
}

interface Props {
  initialEvents: MapEventLite[];
  initialComments: MapCommentLite[];
  initialPins: MapPinLite[];
}

const SEVERITIES = ["info", "warn", "alert"] as const;
const PIN_KINDS = ["info", "hostile", "friendly", "objective"] as const;

export function MapAdminClient({ initialEvents, initialComments, initialPins }: Props) {
  const [events, setEvents] = useState(initialEvents);
  const [comments, setComments] = useState(initialComments);
  const [pins, setPins] = useState(initialPins);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  async function triggerSync() {
    setSyncResult("Synchronisation…");
    try {
      const r = await fetch("/api/cron/map-sync", { method: "POST" });
      const data = await r.json();
      setSyncResult(r.ok ? `OK — ${JSON.stringify(data).slice(0, 200)}` : `Erreur : ${JSON.stringify(data)}`);
    } catch (e) {
      setSyncResult(`Erreur : ${String(e)}`);
    }
  }

  // ── Event form ──
  const [evTitle, setEvTitle] = useState("");
  const [evBody, setEvBody] = useState("");
  const [evSeverity, setEvSeverity] = useState<typeof SEVERITIES[number]>("info");
  const [evSystemId, setEvSystemId] = useState<string>("");

  async function submitEvent(e: React.FormEvent) {
    e.preventDefault();
    const r = await fetch("/api/map/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: evTitle,
        body: evBody || undefined,
        severity: evSeverity,
        systemId: evSystemId ? Number(evSystemId) : null,
      }),
    });
    if (r.ok) {
      const data = await r.json() as { event: { id: string; systemId: number | null; severity: string; title: string; body: string | null; occurredAt: string; createdAt: string } };
      setEvents((evs) => [data.event, ...evs]);
      setEvTitle(""); setEvBody(""); setEvSeverity("info"); setEvSystemId("");
    } else alert("Création échouée");
  }

  async function deleteEvent(id: string) {
    if (!confirm("Supprimer cet événement manuel ?")) return;
    const r = await fetch(`/api/map/events/${id}`, { method: "DELETE" });
    if (r.ok) setEvents((evs) => evs.filter((e) => e.id !== id));
  }

  // ── Comment form ──
  const [cmtBody, setCmtBody] = useState("");
  const [cmtSystemId, setCmtSystemId] = useState<string>("");
  const [cmtPinned, setCmtPinned] = useState(false);

  async function submitComment(e: React.FormEvent) {
    e.preventDefault();
    const r = await fetch("/api/map/comments", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        body: cmtBody,
        systemId: cmtSystemId ? Number(cmtSystemId) : null,
        pinned: cmtPinned,
      }),
    });
    if (r.ok) {
      const data = await r.json() as { comment: MapCommentLite };
      setComments((cs) => [data.comment, ...cs]);
      setCmtBody(""); setCmtSystemId(""); setCmtPinned(false);
    } else alert("Création échouée");
  }

  async function deleteComment(id: string) {
    if (!confirm("Supprimer ce commentaire ?")) return;
    const r = await fetch(`/api/map/comments/${id}`, { method: "DELETE" });
    if (r.ok) setComments((cs) => cs.filter((c) => c.id !== id));
  }

  // ── Pin form ──
  const [pinLabel, setPinLabel] = useState("");
  const [pinNote, setPinNote] = useState("");
  const [pinKind, setPinKind] = useState<typeof PIN_KINDS[number]>("info");
  const [pinSystemId, setPinSystemId] = useState<string>("");

  async function submitPin(e: React.FormEvent) {
    e.preventDefault();
    if (!pinSystemId) { alert("Système requis"); return; }
    const r = await fetch("/api/map/pins", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        label: pinLabel,
        note: pinNote || undefined,
        kind: pinKind,
        systemId: Number(pinSystemId),
      }),
    });
    if (r.ok) {
      const data = await r.json() as { pin: MapPinLite };
      setPins((ps) => [data.pin, ...ps]);
      setPinLabel(""); setPinNote(""); setPinKind("info"); setPinSystemId("");
    } else alert("Création échouée");
  }

  async function deletePin(id: string) {
    if (!confirm("Retirer cette épingle ?")) return;
    const r = await fetch(`/api/map/pins/${id}`, { method: "DELETE" });
    if (r.ok) setPins((ps) => ps.filter((p) => p.id !== id));
  }

  const systemOptions = SDE.systems
    .filter((s) => s.inRegion)
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="space-y-8">
      <section className="bg-bg-elevated border border-border rounded-md p-4">
        <h2 className="font-display text-lg mb-2">Synchronisation ESI</h2>
        <Button onClick={triggerSync} variant="secondary" size="sm">
          Lancer map-sync maintenant
        </Button>
        {syncResult && <pre className="mt-2 text-xs whitespace-pre-wrap text-text-secondary">{syncResult}</pre>}
      </section>

      <section className="bg-bg-elevated border border-border rounded-md p-4">
        <h2 className="font-display text-lg mb-3">Nouvel événement manuel</h2>
        <form onSubmit={submitEvent} className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            value={evTitle} onChange={(e) => setEvTitle(e.target.value)}
            placeholder="Titre (3-200 car.)" required maxLength={200}
            className="px-3 py-2 bg-bg-deep border border-border rounded text-sm"
          />
          <select
            value={evSystemId} onChange={(e) => setEvSystemId(e.target.value)}
            className="px-3 py-2 bg-bg-deep border border-border rounded text-sm"
          >
            <option value="">— événement régional —</option>
            {systemOptions.map((s) => (
              <option key={s.systemId} value={s.systemId}>{s.name}</option>
            ))}
          </select>
          <select
            value={evSeverity} onChange={(e) => setEvSeverity(e.target.value as typeof SEVERITIES[number])}
            className="px-3 py-2 bg-bg-deep border border-border rounded text-sm"
          >
            {SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <textarea
            value={evBody} onChange={(e) => setEvBody(e.target.value)}
            placeholder="Détails (optionnel)" maxLength={4000} rows={3}
            className="md:col-span-2 px-3 py-2 bg-bg-deep border border-border rounded text-sm"
          />
          <Button type="submit" variant="primary" size="sm">Créer</Button>
        </form>

        <ul className="mt-4 space-y-1.5 text-sm">
          {events.map((e) => (
            <li key={e.id} className="flex items-center justify-between border-b border-border-subtle py-1">
              <span>
                <span className="text-text-muted text-xs">{new Date(e.occurredAt).toLocaleString()}</span>{" "}
                [{e.severity}] {e.title}
                {e.systemId && <span className="text-gold ml-1">· {e.systemId}</span>}
              </span>
              <button onClick={() => deleteEvent(e.id)} className="text-xs text-red-400 hover:text-red-300">supprimer</button>
            </li>
          ))}
        </ul>
      </section>

      <section className="bg-bg-elevated border border-border rounded-md p-4">
        <h2 className="font-display text-lg mb-3">Nouveau commentaire éditorial</h2>
        <form onSubmit={submitComment} className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <select
            value={cmtSystemId} onChange={(e) => setCmtSystemId(e.target.value)}
            className="px-3 py-2 bg-bg-deep border border-border rounded text-sm"
          >
            <option value="">— commentaire régional —</option>
            {systemOptions.map((s) => (
              <option key={s.systemId} value={s.systemId}>{s.name}</option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={cmtPinned} onChange={(e) => setCmtPinned(e.target.checked)} />
            Épinglé en haut
          </label>
          <textarea
            value={cmtBody} onChange={(e) => setCmtBody(e.target.value)}
            placeholder="Texte du commentaire" required minLength={2} maxLength={4000} rows={3}
            className="md:col-span-2 px-3 py-2 bg-bg-deep border border-border rounded text-sm"
          />
          <Button type="submit" variant="primary" size="sm">Publier</Button>
        </form>

        <ul className="mt-4 space-y-2 text-sm">
          {comments.map((c) => (
            <li key={c.id} className="border-l-2 border-gold/40 pl-3 py-1 flex justify-between items-start gap-2">
              <div>
                <p className="whitespace-pre-wrap">{c.body}</p>
                <p className="text-xs text-text-muted">
                  {new Date(c.createdAt).toLocaleString()}
                  {c.systemId && ` · système ${c.systemId}`}
                  {c.pinned && " · épinglé"}
                </p>
              </div>
              <button onClick={() => deleteComment(c.id)} className="text-xs text-red-400 hover:text-red-300">supprimer</button>
            </li>
          ))}
        </ul>
      </section>

      <section className="bg-bg-elevated border border-border rounded-md p-4">
        <h2 className="font-display text-lg mb-3">Nouvelle épingle</h2>
        <form onSubmit={submitPin} className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <select
            value={pinSystemId} onChange={(e) => setPinSystemId(e.target.value)}
            required
            className="px-3 py-2 bg-bg-deep border border-border rounded text-sm"
          >
            <option value="">— choisir un système —</option>
            {systemOptions.map((s) => (
              <option key={s.systemId} value={s.systemId}>{s.name}</option>
            ))}
          </select>
          <input
            value={pinLabel} onChange={(e) => setPinLabel(e.target.value)}
            placeholder="Label (1-60)" required maxLength={60}
            className="px-3 py-2 bg-bg-deep border border-border rounded text-sm"
          />
          <select
            value={pinKind} onChange={(e) => setPinKind(e.target.value as typeof PIN_KINDS[number])}
            className="px-3 py-2 bg-bg-deep border border-border rounded text-sm"
          >
            {PIN_KINDS.map((k) => <option key={k} value={k}>{k}</option>)}
          </select>
          <input
            value={pinNote} onChange={(e) => setPinNote(e.target.value)}
            placeholder="Note (optionnel, 280 car.)" maxLength={280}
            className="px-3 py-2 bg-bg-deep border border-border rounded text-sm"
          />
          <Button type="submit" variant="primary" size="sm">Épingler</Button>
        </form>

        <ul className="mt-4 space-y-1 text-sm">
          {pins.map((p) => (
            <li key={p.id} className="flex justify-between items-center border-b border-border-subtle py-1">
              <span>[{p.kind}] <strong>{p.label}</strong> · système {p.systemId}{p.note && ` — ${p.note}`}</span>
              <button onClick={() => deletePin(p.id)} className="text-xs text-red-400 hover:text-red-300">retirer</button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
