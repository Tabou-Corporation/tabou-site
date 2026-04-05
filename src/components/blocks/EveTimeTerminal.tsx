"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils/cn";

/* ── Messages d'ambiance selon l'heure EVE (UTC) ────────────────────────── */
const TIME_PHASES = [
  { start: 0,  end: 5,  label: "ESPACE DÉSERT",    sub: "risque d'embuscade" },
  { start: 5,  end: 9,  label: "PATROUILLE ACTIVE", sub: "secteur sous contrôle" },
  { start: 9,  end: 12, label: "OPS EN COURS",      sub: "flotte déployée" },
  { start: 12, end: 16, label: "ZONE CONTESTÉE",    sub: "activité hostile détectée" },
  { start: 16, end: 20, label: "HEURE DE CHASSE",   sub: "menace maximale" },
  { start: 20, end: 24, label: "ASSAUT IMMINENT",   sub: "restez en alerte" },
];

const GLITCH_CHARS = "0189ABCDEF!#%";

function scramble(target: string, progress: number): string {
  return target
    .split("")
    .map((ch, i) => {
      if (ch === ":") return ":";
      if (i / target.length < progress) return ch;
      return GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)] ?? ch;
    })
    .join("");
}

function getPhase(hour: number) {
  return TIME_PHASES.find((p) => hour >= p.start && hour < p.end) ?? TIME_PHASES[0]!;
}

function getEveTimeString() {
  const now = new Date();
  const h = String(now.getUTCHours()).padStart(2, "0");
  const m = String(now.getUTCMinutes()).padStart(2, "0");
  const s = String(now.getUTCSeconds()).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

export function EveTimeTerminal() {
  const [display, setDisplay] = useState("--:--:--");
  const [phase, setPhase] = useState(TIME_PHASES[0]!);
  const [stage, setStage] = useState<"scramble" | "live" | "glitch">("scramble");
  const [statusTyped, setStatusTyped] = useState("");
  const [subTyped, setSubTyped] = useState("");

  /* ── 1. Scramble au montage ─────────────────────────────────────────── */
  useEffect(() => {
    const FRAMES = 20;
    const DELAY = 55;
    let frame = 0;

    const id = setInterval(() => {
      frame += 1;
      const target = getEveTimeString();
      const progress = frame / FRAMES;

      if (frame >= FRAMES) {
        clearInterval(id);
        setDisplay(target);
        setPhase(getPhase(new Date().getUTCHours()));
        setStage("live");
      } else {
        setDisplay(scramble(target, progress));
      }
    }, DELAY);

    return () => clearInterval(id);
  }, []);

  /* ── 2. Horloge live ─────────────────────────────────────────────────── */
  useEffect(() => {
    if (stage !== "live") return;
    const id = setInterval(() => {
      setDisplay(getEveTimeString());
      setPhase(getPhase(new Date().getUTCHours()));
    }, 1000);
    return () => clearInterval(id);
  }, [stage]);

  /* ── 3. Glitch ponctuel ─────────────────────────────────────────────── */
  useEffect(() => {
    if (stage !== "live") return;
    const scheduleNext = (): ReturnType<typeof setTimeout> => {
      const delay = 18000 + Math.random() * 15000;
      return setTimeout(() => {
        setStage("glitch");
        let bursts = 0;
        const burstId = setInterval(() => {
          bursts++;
          const target = getEveTimeString();
          setDisplay(scramble(target, 0.2 + Math.random() * 0.4));
          if (bursts >= 5) {
            clearInterval(burstId);
            setDisplay(getEveTimeString());
            setStage("live");
            timerId = scheduleNext();
          }
        }, 60);
      }, delay);
    };
    let timerId = scheduleNext();
    return () => clearTimeout(timerId);
  }, [stage]);

  /* ── 4. Typewriter label ─────────────────────────────────────────────── */
  useEffect(() => {
    if (stage === "scramble") return;
    const fullLabel = `> ${phase.label}`;
    setStatusTyped("");
    setSubTyped("");
    let i = 0;
    const id = setInterval(() => {
      i++;
      setStatusTyped(fullLabel.slice(0, i));
      if (i >= fullLabel.length) clearInterval(id);
    }, 30);
    return () => clearInterval(id);
  }, [stage, phase.label]);

  useEffect(() => {
    if (!statusTyped || statusTyped.length < `> ${phase.label}`.length) return;
    const full = phase.sub;
    setSubTyped("");
    let i = 0;
    const id = setInterval(() => {
      i++;
      setSubTyped(full.slice(0, i));
      if (i >= full.length) clearInterval(id);
    }, 28);
    return () => clearInterval(id);
  }, [statusTyped, phase.label, phase.sub]);

  const isLive = stage === "live" || stage === "glitch";

  return (
    <div className="w-[210px] flex flex-col border-l-2 border-l-gold/30 relative overflow-hidden">
      {/* Scanlines statiques */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.08) 3px, rgba(0,0,0,0.08) 4px)",
        }}
      />

      {/* Header */}
      <div className="px-3 pb-1">
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              "w-1.5 h-1.5 rounded-full transition-colors duration-500",
              isLive ? "bg-gold animate-pulse" : "bg-text-muted",
            )}
          />
          <span className="text-gold/50 text-2xs font-bold tracking-extra-wide uppercase">
            Eve Time
          </span>
        </div>
      </div>

      {/* Horloge */}
      <div className="px-3 pb-1">
        <div
          className={cn(
            "font-mono text-lg font-bold tracking-[0.12em] tabular-nums transition-colors duration-300",
            stage === "glitch" ? "text-gold-light" : isLive ? "text-gold" : "text-gold/50",
          )}
        >
          {display}
        </div>
      </div>

      {/* Message d'ambiance */}
      <div className="px-3 pb-3 min-h-[34px]">
        <p className="font-mono text-2xs text-gold/55 leading-tight tracking-wide uppercase">
          {statusTyped}
          {statusTyped.length < `> ${phase.label}`.length && isLive && (
            <span className="animate-terminal-cursor">▌</span>
          )}
        </p>
        {subTyped && (
          <p className="font-mono text-2xs text-text-muted/60 leading-tight tracking-wide mt-0.5">
            {subTyped}
          </p>
        )}
      </div>
    </div>
  );
}
