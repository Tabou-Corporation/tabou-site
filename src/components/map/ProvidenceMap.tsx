"use client";

/**
 * ProvidenceMap — Canvas 2D, style Verite (influence blobs).
 *
 * Porté depuis neocom-zorath/NewEdenMap.jsx, adapté Tabou :
 *  - Filtré à Providence + adjacents (~93 systèmes)
 *  - Couleurs sov via /api/map/sov (proxy ESI backend)
 *  - Overlay tension : ring autour des systèmes "hot"
 *  - Pin/épingles : losanges (issus de /api/map/pins)
 *  - Pas de subject reticle (carte publique, pas de "moi" connecté)
 */

import { useEffect, useMemo, useRef, useState } from "react";
import {
  SDE_SYSTEMS,
  SDE_JUMPS,
  SDE_REGIONS,
  SDE_BY_ID,
  CORE_REGION_IDS,
  type SdeSystem,
} from "@/lib/map/sde";
import { LEVEL_COLORS } from "@/lib/map/tension";
import type { MapStateDTO, MapSystemDTO } from "./types";

interface SovData {
  sov: Record<number, { allianceId: number | null; corporationId: number | null; factionId: number | null }>;
  alliances: Array<{ id: number; name: string; count: number; color: string; isCva: boolean }>;
  cvaSystems: number[];
  factionColors: Record<number, string>;
  othersColor: string;
  cvaColor: string;
  fetchedAt: string;
}

interface PinData {
  id: string;
  systemId: number;
  label: string;
  kind: "info" | "hostile" | "friendly" | "objective";
  note: string | null;
}

interface Props {
  state: MapStateDTO;
  selectedSystemId: number | null;
  onSelectSystem: (id: number | null) => void;
  height?: number | string;
}

const BG = "#08080C";
const COL = {
  jump: "rgba(120, 140, 180, 0.10)",
  jumpRegion: "rgba(230, 194, 101, 0.20)",
  regionLbl: "rgba(230, 194, 101, 0.18)",
  hoverRing: "#F4F4F5",
  selectedRing: "#F0B030",
};

const MIN_ZOOM = 0.6;
const MAX_ZOOM = 16;

const PIN_COLORS: Record<PinData["kind"], string> = {
  info: "#7FB8FF",
  hostile: "#FF6B6B",
  friendly: "#5BD4A0",
  objective: "#FFCB55",
};

export function ProvidenceMap({ state, selectedSystemId, onSelectSystem, height = "100%" }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef({
    offsetX: 0, offsetY: 0, zoom: 5,
    dragging: false, didDrag: false,
    lastMx: 0, lastMy: 0,
    width: 0, height: 0,
    needsDraw: true,
  });

  const [hover, setHover] = useState<SdeSystem | null>(null);
  const [sovData, setSovData] = useState<SovData | null>(null);
  const [pins, setPins] = useState<PinData[]>([]);
  // Cache logos d'alliances (id → HTMLImageElement). Persistant.
  const logoCacheRef = useRef<Map<number, HTMLImageElement | null>>(new Map());

  // Index par systemId pour overlay tension
  const tensionBySystem = useMemo(() => {
    const m = new Map<number, MapSystemDTO>();
    for (const s of state.systems) m.set(s.system.systemId, s);
    return m;
  }, [state.systems]);

  // ── Fetch sov (1h staleness, refetch toutes les 10min)
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const r = await fetch("/api/map/sov", { cache: "no-store" });
        if (!r.ok) return;
        const data = (await r.json()) as SovData;
        if (!cancelled) {
          setSovData(data);
          // Précharge les logos d'alliances présentes
          for (const a of data.alliances) {
            if (logoCacheRef.current.has(a.id)) continue;
            logoCacheRef.current.set(a.id, null); // placeholder pendant chargement
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => {
              logoCacheRef.current.set(a.id, img);
              stateRef.current.needsDraw = true;
            };
            img.onerror = () => {
              logoCacheRef.current.set(a.id, null); // échec — on dessine juste un dot
            };
            img.src = `https://images.evetech.net/alliances/${a.id}/logo?size=64`;
          }
        }
      } catch { /* silent */ }
    }
    void load();
    const id = setInterval(load, 10 * 60 * 1000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  // ── Fetch pins
  useEffect(() => {
    let cancelled = false;
    fetch("/api/map/pins").then((r) => r.json()).then((d) => {
      if (!cancelled && d?.pins) setPins(d.pins);
    }).catch(() => { /* silent */ });
    return () => { cancelled = true; };
  }, []);

  // ── ResizeObserver — auto-centre sur Providence au premier sizing
  useEffect(() => {
    const cv = canvasRef.current;
    const wrap = containerRef.current;
    if (!cv || !wrap) return;

    function applySize(w: number, h: number) {
      if (!cv || !wrap || w === 0 || h === 0) return;
      const dpr = window.devicePixelRatio || 1;
      cv.width = w * dpr;
      cv.height = h * dpr;
      cv.style.width = w + "px";
      cv.style.height = h + "px";
      const ctx = cv.getContext("2d");
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const s = stateRef.current;
      const firstTime = s.width === 0;
      if (firstTime) {
        fitProvidence(w, h, s);
      } else {
        s.offsetX += (w - s.width) / 2;
        s.offsetY += (h - s.height) / 2;
      }
      s.width = w; s.height = h; s.needsDraw = true;
    }

    // Mesure immédiate (au cas où ResizeObserver tarde)
    applySize(wrap.clientWidth, wrap.clientHeight);

    const ro = new ResizeObserver(() => {
      applySize(wrap.clientWidth, wrap.clientHeight);
    });
    ro.observe(wrap);

    // Fallback : reflow check toutes les 500ms tant que pas dimensionné
    const interval = setInterval(() => {
      if (stateRef.current.width > 0) { clearInterval(interval); return; }
      applySize(wrap.clientWidth, wrap.clientHeight);
    }, 500);

    return () => {
      ro.disconnect();
      clearInterval(interval);
    };
  }, []);

  // ── Render loop
  useEffect(() => {
    let raf: number;
    const tick = () => {
      const s = stateRef.current;
      if (s.needsDraw) { s.needsDraw = false; draw(); }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sovData, hover, selectedSystemId, pins, state]);

  // ── Animation tension (pulse les "hot")
  useEffect(() => {
    let raf: number;
    const loop = () => {
      stateRef.current.needsDraw = true;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  // ── Wheel zoom natif (passive: false)
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      const s = stateRef.current;
      const rect = cv.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const factor = e.deltaY < 0 ? 1.18 : 1 / 1.18;
      const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, s.zoom * factor));
      const k = newZoom / s.zoom;
      s.offsetX = mx - (mx - s.offsetX) * k;
      s.offsetY = my - (my - s.offsetY) * k;
      s.zoom = newZoom;
      s.needsDraw = true;
    };
    cv.addEventListener("wheel", handler, { passive: false });
    return () => cv.removeEventListener("wheel", handler);
  }, []);

  // ── Souris
  function onMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    const s = stateRef.current;
    s.dragging = true; s.didDrag = false;
    s.lastMx = e.clientX; s.lastMy = e.clientY;
  }
  function onMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    const s = stateRef.current;
    const cv = canvasRef.current;
    if (!cv) return;
    const rect = cv.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    if (s.dragging) {
      const dx = e.clientX - s.lastMx;
      const dy = e.clientY - s.lastMy;
      if (Math.abs(dx) + Math.abs(dy) > 2) s.didDrag = true;
      s.offsetX += dx; s.offsetY += dy;
      s.lastMx = e.clientX; s.lastMy = e.clientY;
      s.needsDraw = true;
      if (hover) setHover(null);
      return;
    }
    // Hover : système le plus proche dans un rayon écran
    const wx = (mx - s.offsetX) / s.zoom;
    const wy = (my - s.offsetY) / s.zoom;
    const radius = 8 / s.zoom;
    const r2 = radius * radius;
    let best: SdeSystem | null = null;
    let bestD = r2;
    for (const sys of SDE_SYSTEMS) {
      const dx = sys.coords.x - wx;
      const dy = sys.coords.y - wy;
      const d = dx * dx + dy * dy;
      if (d < bestD) { bestD = d; best = sys; }
    }
    if ((best && hover?.systemId !== best.systemId) || (!best && hover)) {
      setHover(best);
      s.needsDraw = true;
    }
  }
  function onMouseUp() {
    const s = stateRef.current;
    s.dragging = false;
    if (!s.didDrag && hover) {
      onSelectSystem(hover.systemId);
    }
  }
  function onMouseLeave() { stateRef.current.dragging = false; setHover(null); }

  // ── Recentrage helpers
  function fitProvidence(w: number, h: number, s: typeof stateRef.current) {
    const provs = SDE_SYSTEMS.filter((sys) => sys.inRegion);
    const xs = provs.map((sys) => sys.coords.x);
    const ys = provs.map((sys) => sys.coords.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    const pad = 72;
    const zx = (w - pad * 2) / (maxX - minX);
    const zy = (h - pad * 2) / (maxY - minY);
    s.zoom = Math.min(zx, zy, 14);
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    s.offsetX = w / 2 - cx * s.zoom;
    s.offsetY = h / 2 - cy * s.zoom;
    s.needsDraw = true;
  }
  function centerOnProvidence() {
    const s = stateRef.current;
    fitProvidence(s.width, s.height, s);
  }
  function fitAll() {
    const s = stateRef.current;
    // Vue large : tous les systèmes (Providence + adjacents)
    const xs = SDE_SYSTEMS.map((sys) => sys.coords.x);
    const ys = SDE_SYSTEMS.map((sys) => sys.coords.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    const pad = 40;
    const zx = (s.width - pad * 2) / (maxX - minX);
    const zy = (s.height - pad * 2) / (maxY - minY);
    s.zoom = Math.min(zx, zy, 8);
    s.offsetX = s.width / 2 - ((minX + maxX) / 2) * s.zoom;
    s.offsetY = s.height / 2 - ((minY + maxY) / 2) * s.zoom;
    s.needsDraw = true;
  }

  // ── Couleur pour un système
  function colorForSystem(systemId: number, regionId: number): { color: string; kind: string } {
    if (!sovData) return { color: "#3A3A40", kind: "loading" };
    const sov = sovData.sov[systemId];
    if (sov?.allianceId != null) {
      const a = sovData.alliances.find((x) => x.id === sov.allianceId);
      if (a) return { color: a.color, kind: a.isCva ? "cva" : "alliance" };
      return { color: sovData.othersColor, kind: "other-alliance" };
    }
    if (sov?.factionId != null) {
      const c = sovData.factionColors[sov.factionId];
      if (c) return { color: c, kind: "faction" };
    }
    // Empire highsec via region.factionId
    const region = SDE_REGIONS.find((r) => r.id === regionId);
    if (region && region.factionId) {
      const c = sovData.factionColors[region.factionId];
      if (c) return { color: c, kind: "empire" };
    }
    return { color: "#2A2A30", kind: "unclaimed" };
  }

  // ── Drawing
  function draw() {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const s = stateRef.current;
    const W = s.width, H = s.height;

    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, W, H);

    const wx0 = -s.offsetX / s.zoom;
    const wy0 = -s.offsetY / s.zoom;
    const wx1 = (W - s.offsetX) / s.zoom;
    const wy1 = (H - s.offsetY) / s.zoom;

    // Region labels (basse résolution, régions adjacentes seulement)
    if (s.zoom < 10) {
      ctx.font = `${Math.max(9, 12 * Math.min(1, s.zoom * 0.22))}px monospace`;
      ctx.fillStyle = COL.regionLbl;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      for (const r of SDE_REGIONS) {
        if (CORE_REGION_IDS.has(r.id)) continue;
        if (r.coords.x < wx0 - 30 || r.coords.x > wx1 + 30) continue;
        if (r.coords.y < wy0 - 30 || r.coords.y > wy1 + 30) continue;
        const sx = r.coords.x * s.zoom + s.offsetX;
        const sy = r.coords.y * s.zoom + s.offsetY;
        ctx.fillText(r.name.toUpperCase(), sx, sy);
      }
      ctx.textBaseline = "alphabetic";
    }

    // ── Connexions inter-région (très discrètes)
    ctx.lineWidth = Math.max(0.4, s.zoom * 0.04);
    ctx.strokeStyle = "rgba(100, 110, 145, 0.15)";
    ctx.beginPath();
    for (const [a, b] of SDE_JUMPS) {
      const sa = SDE_BY_ID.get(a);
      const sb = SDE_BY_ID.get(b);
      if (!sa || !sb) continue;
      if (CORE_REGION_IDS.has(sa.regionId) && CORE_REGION_IDS.has(sb.regionId)) continue;
      ctx.moveTo(sa.coords.x * s.zoom + s.offsetX, sa.coords.y * s.zoom + s.offsetY);
      ctx.lineTo(sb.coords.x * s.zoom + s.offsetX, sb.coords.y * s.zoom + s.offsetY);
    }
    ctx.stroke();

    // ── Connexions intra-Providence (style Wanderer — rose/magenta)
    ctx.lineWidth = Math.max(0.8, s.zoom * 0.09);
    ctx.strokeStyle = "#B02858";
    ctx.beginPath();
    for (const [a, b] of SDE_JUMPS) {
      const sa = SDE_BY_ID.get(a);
      const sb = SDE_BY_ID.get(b);
      if (!sa || !sb) continue;
      if (!CORE_REGION_IDS.has(sa.regionId) || !CORE_REGION_IDS.has(sb.regionId)) continue;
      ctx.moveTo(sa.coords.x * s.zoom + s.offsetX, sa.coords.y * s.zoom + s.offsetY);
      ctx.lineTo(sb.coords.x * s.zoom + s.offsetX, sb.coords.y * s.zoom + s.offsetY);
    }
    ctx.stroke();

    // ── Nodes système (style Wanderer)
    const pulseT = (Date.now() % 2200) / 2200;
    const pulse = 0.55 + 0.45 * Math.sin(pulseT * Math.PI * 2);
    const nodeR = Math.max(3.5, Math.min(10, s.zoom * 0.75));
    const logoSize = Math.max(12, Math.min(20, s.zoom * 1.8));

    for (const sys of SDE_SYSTEMS) {
      if (sys.coords.x < wx0 - 14 || sys.coords.x > wx1 + 14) continue;
      if (sys.coords.y < wy0 - 14 || sys.coords.y > wy1 + 14) continue;
      const c = colorForSystem(sys.systemId, sys.regionId);
      const sx = sys.coords.x * s.zoom + s.offsetX;
      const sy = sys.coords.y * s.zoom + s.offsetY;
      const r = sys.inRegion ? nodeR : nodeR * 0.50;

      // Anneau de tension — proportionnel au score (visible dès "watch")
      const t = tensionBySystem.get(sys.systemId);
      if (t && sys.inRegion && t.level !== "calm") {
        const isHot = t.level === "hot" || t.level === "burning";
        ctx.strokeStyle = LEVEL_COLORS[t.level];
        // Pulse uniquement pour hot/burning ; statique pour watch/warm
        ctx.globalAlpha = isHot ? 0.35 + 0.45 * pulse : 0.30 + 0.10 * Math.min(1, t.tension.score * 2);
        ctx.lineWidth = Math.max(1, s.zoom * (isHot ? 0.14 : 0.10));
        ctx.beginPath();
        ctx.arc(sx, sy, r + 5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
      // Halo de traffic (jumps/h élevés) — cyan diffus
      if (t && t.activity && sys.inRegion && t.activity.shipJumps > 50) {
        const intensity = Math.min(1, (t.activity.shipJumps - 50) / 200);
        ctx.fillStyle = "#6EC8FF";
        ctx.globalAlpha = 0.06 + intensity * 0.12;
        ctx.beginPath();
        ctx.arc(sx, sy, r + 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      if (t && t.activeCampaigns > 0) {
        ctx.strokeStyle = "#FF3030";
        ctx.globalAlpha = 0.5 + 0.5 * pulse;
        ctx.lineWidth = Math.max(1.5, s.zoom * 0.18);
        ctx.beginPath();
        ctx.arc(sx, sy, r + 9, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      // Node : contour foncé + fill sov
      ctx.fillStyle = "#0C0C14";
      ctx.beginPath();
      ctx.arc(sx, sy, r + 1.5, 0, Math.PI * 2);
      ctx.fill();

      const fillColor = c.kind === "loading"
        ? (sys.inRegion ? "#E6C265" : "#3A3A48")
        : c.color;
      ctx.fillStyle = fillColor;
      ctx.globalAlpha = c.kind === "unclaimed" ? 0.38 : sys.inRegion ? 0.92 : 0.42;
      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      // Nom du système — toujours visible pour inRegion
      if (sys.inRegion || s.zoom > 5.5) {
        const fontSize = Math.max(8, Math.min(13, 6 + s.zoom * 0.48));
        ctx.font = `${fontSize}px monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        ctx.shadowColor = "rgba(0,0,0,0.98)";
        ctx.shadowBlur = 5;
        ctx.fillStyle = sys.inRegion ? "#DADAE8" : "#606075";
        ctx.fillText(sys.name, sx, sy - r - 3);
        ctx.shadowBlur = 0;
        ctx.textBaseline = "alphabetic";
      }

      // Badge kills — petit pastille rouge en haut-droite si shipKills > 0
      if (t && t.activity && sys.inRegion && t.activity.shipKills > 0 && s.zoom > 3) {
        const bx = sx + r * 0.85;
        const by = sy - r * 0.85;
        const badgeR = Math.max(5, Math.min(9, s.zoom * 0.7));
        // Halo pulsé pour signaler de l'activité fraîche
        ctx.fillStyle = "#FF3030";
        ctx.globalAlpha = 0.25 + 0.35 * pulse;
        ctx.beginPath();
        ctx.arc(bx, by, badgeR + 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        // Disque rouge plein
        ctx.fillStyle = "#0C0C14";
        ctx.beginPath();
        ctx.arc(bx, by, badgeR + 1, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#FF4848";
        ctx.beginPath();
        ctx.arc(bx, by, badgeR, 0, Math.PI * 2);
        ctx.fill();
        // Chiffre kills
        const kills = t.activity.shipKills;
        const label = kills > 99 ? "99+" : String(kills);
        const fs = Math.max(7, Math.min(10, badgeR * 1.2));
        ctx.font = `bold ${fs}px monospace`;
        ctx.fillStyle = "#FFFFFF";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(label, bx, by);
        ctx.textBaseline = "alphabetic";
      }

      // Logo alliance par système (sous le node, Wanderer-style)
      if (sovData && sys.inRegion && s.zoom > 2.5) {
        const allianceId = sovData.sov[sys.systemId]?.allianceId;
        if (allianceId) {
          const logo = logoCacheRef.current.get(allianceId);
          const lx = sx - logoSize / 2;
          const ly = sy + r + 3;
          if (logo) {
            ctx.save();
            ctx.fillStyle = "#0C0C14";
            ctx.beginPath();
            ctx.arc(sx, ly + logoSize / 2, logoSize / 2 + 1.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(sx, ly + logoSize / 2, logoSize / 2, 0, Math.PI * 2);
            ctx.clip();
            ctx.globalAlpha = 0.88;
            try { ctx.drawImage(logo, lx, ly, logoSize, logoSize); } catch { /* tainted */ }
            ctx.restore();
          }
        }
      }
    }

    // ── Pins (losanges)
    if (pins.length > 0 && s.zoom > 1.2) {
      for (const p of pins) {
        const sys = SDE_BY_ID.get(p.systemId);
        if (!sys) continue;
        const sx = sys.coords.x * s.zoom + s.offsetX;
        const sy = sys.coords.y * s.zoom + s.offsetY;
        const color = PIN_COLORS[p.kind];
        const size = 5 + Math.min(3, s.zoom * 0.22);
        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(Math.PI / 4);
        ctx.fillStyle = "#0A0A0E";
        ctx.fillRect(-size - 1.5, -size - 1.5, (size + 1.5) * 2, (size + 1.5) * 2);
        ctx.fillStyle = color;
        ctx.fillRect(-size, -size, size * 2, size * 2);
        ctx.restore();
      }
    }

    // ── Système sélectionné
    if (selectedSystemId != null) {
      const sel = SDE_BY_ID.get(selectedSystemId);
      if (sel) {
        const sx = sel.coords.x * s.zoom + s.offsetX;
        const sy = sel.coords.y * s.zoom + s.offsetY;
        ctx.strokeStyle = COL.selectedRing;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(sx, sy, nodeR + 5, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // ── Hover ring
    if (hover) {
      const sx = hover.coords.x * s.zoom + s.offsetX;
      const sy = hover.coords.y * s.zoom + s.offsetY;
      ctx.strokeStyle = COL.hoverRing;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(sx, sy, nodeR + 4, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  // ── Tooltip
  const tooltip = useMemo(() => {
    if (!hover) return null;
    const s = stateRef.current;
    const c = sovData ? colorForSystem(hover.systemId, hover.regionId) : { color: "#666", kind: "loading" };
    let owner = "Inconnu";
    if (sovData) {
      const sov = sovData.sov[hover.systemId];
      if (sov?.allianceId) {
        const a = sovData.alliances.find((x) => x.id === sov.allianceId);
        owner = a?.name ?? `Alliance ${sov.allianceId}`;
      } else if (sov?.factionId) {
        owner = `Faction ${sov.factionId}`;
      } else if (c.kind === "empire") {
        owner = `Empire (${hover.regionName})`;
      } else {
        owner = "Sans souveraineté";
      }
    }
    const sx = hover.coords.x * s.zoom + s.offsetX;
    const sy = hover.coords.y * s.zoom + s.offsetY;
    const t = state.systems.find((x) => x.system.systemId === hover.systemId);
    return { sys: hover, color: c.color, owner, sx, sy, tension: t?.tension.score ?? null, level: t?.level ?? null };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hover, sovData, state]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-[500px] bg-[#08080C] border border-border rounded-md overflow-hidden"
      style={typeof height === "number" ? { height: `${height}px` } : {}}
    >
      <canvas
        ref={canvasRef}
        className="block w-full h-full cursor-grab active:cursor-grabbing"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseLeave}
      />

      {/* Status — top left */}
      <div className="absolute top-3 left-3 font-mono text-[10px] tracking-widest uppercase bg-bg-deep/90 border border-border px-3 py-1.5 flex items-center gap-3 text-text-secondary">
        <span className="flex items-center gap-1.5 text-gold">
          <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
          ESI · live
        </span>
        {sovData && (
          <>
            <span className="text-text-muted">·</span>
            <span><span className="text-gold">{sovData.cvaSystems.length}</span> CVA</span>
            <span className="text-text-muted">·</span>
            <span>{sovData.alliances.length} alliances</span>
          </>
        )}
      </div>

      {/* Controls — top right */}
      <div className="absolute top-3 right-3 flex flex-col gap-1.5 font-mono text-[10px] tracking-widest uppercase">
        <button
          type="button"
          onClick={centerOnProvidence}
          className="px-3 py-1.5 bg-bg-deep/90 border border-gold/30 text-gold hover:bg-gold/10 transition-colors"
        >
          Recentrer · Providence
        </button>
        <button
          type="button"
          onClick={fitAll}
          className="px-3 py-1.5 bg-bg-deep/90 border border-border text-text-secondary hover:text-text-primary transition-colors"
        >
          Vue · large
        </button>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="absolute pointer-events-none bg-bg-deep/95 border border-gold/40 px-3 py-2 font-mono text-[10px] uppercase tracking-wider"
          style={{
            left: Math.min(tooltip.sx + 12, stateRef.current.width - 240),
            top: Math.min(tooltip.sy + 12, stateRef.current.height - 110),
            minWidth: 220,
          }}
        >
          <div className="font-display text-base normal-case tracking-normal text-text-primary leading-tight">
            {tooltip.sys.name}
          </div>
          <div className="mt-1 text-text-muted">
            sec ·{" "}
            <span className={
              tooltip.sys.security >= 0.45 ? "text-green-400" :
              tooltip.sys.security > 0 ? "text-amber-400" : "text-red-400"
            }>
              {tooltip.sys.security.toFixed(1)}
            </span>
            {" · "}{tooltip.sys.regionName}
          </div>
          <div className="mt-1 flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ backgroundColor: tooltip.color }} />
            <span className="tracking-normal normal-case text-text-secondary text-[11px] truncate">
              {tooltip.owner}
            </span>
          </div>
          {tooltip.tension != null && (
            <div className="mt-1 text-text-muted">
              tension · <span style={{ color: LEVEL_COLORS[tooltip.level ?? "calm"] }}>{(tooltip.tension * 100).toFixed(0)}</span>
              {" "}<span className="lowercase">{tooltip.level}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
