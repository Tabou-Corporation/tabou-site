/**
 * Calcule un layout force-directed pour les systèmes Providence.
 * Les coordonnées astronomiques EVE (projetées 3D→2D) servent de seed initial,
 * puis un algorithme de forces (répulsion entre nœuds + attraction des arêtes)
 * espace les systèmes et minimise les croisements de lignes.
 *
 * Usage : node scripts/compute-providence-layout.mjs
 * Résultat : ajoute/met à jour `layoutPositions` dans providence.json
 */

import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const jsonPath = join(__dirname, "../src/lib/map/sde/providence.json");

const data = JSON.parse(readFileSync(jsonPath, "utf-8"));
const PROV_ID = data.region.id; // 10000047
// Régions cœur — Providence + Catch (CVA y détient des systèmes)
const CORE_IDS = new Set(data.coreRegionIds ?? [PROV_ID]);

// [id, name, x, z, sec, regionId]
const systemById = new Map(data.systems.map((s) => [s[0], s]));
const coreSystems = data.systems.filter((s) => CORE_IDS.has(s[5]));
const coreSystemIds = new Set(coreSystems.map((s) => s[0]));
// On garde le nom `provIds` pour la suite (compatibilité minimale), mais c'est
// désormais "tous les systèmes des régions cœur".
const provIds = coreSystemIds;
const providenceSystems = coreSystems;

console.log(`Régions cœur (${[...CORE_IDS].join(", ")}) : ${coreSystems.length} systèmes`);

// ── Arêtes intra-cœur (entre systèmes des régions cœur)
const edges = data.jumps.filter(([a, b]) => provIds.has(a) && provIds.has(b));
console.log(`Stargates intra-cœur : ${edges.length}`);

// ── Initialisation : positions géographiques comme seed (scale ×3 pour espacement)
const nodes = providenceSystems.map((s) => ({
  id: s[0],
  name: s[1],
  x: s[2] * 3,
  y: s[3] * 3,
  fx: 0,
  fy: 0,
}));
const nodeById = new Map(nodes.map((n) => [n.id, n]));

// ── Simulation force-directed (Fruchterman-Reingold)
const ITERATIONS = 600;
const REPULSION = 1200;      // force de répulsion entre tous les nœuds
const ATTRACTION = 0.06;     // force d'attraction le long des arêtes
const IDEAL_LENGTH = 22;     // longueur idéale d'une arête
const MIN_DIST = 10;         // distance minimum entre nœuds
const INITIAL_TEMP = 8;      // température initiale (max déplacement par iter)

for (let iter = 0; iter < ITERATIONS; iter++) {
  const temp = INITIAL_TEMP * (1 - iter / ITERATIONS);

  // Reset forces
  for (const n of nodes) { n.fx = 0; n.fy = 0; }

  // Répulsion entre toutes les paires (Coulomb)
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i], b = nodes[j];
      let dx = b.x - a.x, dy = b.y - a.y;
      let dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < MIN_DIST) dist = MIN_DIST;
      const force = REPULSION / (dist * dist);
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      a.fx -= fx; a.fy -= fy;
      b.fx += fx; b.fy += fy;
    }
  }

  // Attraction le long des arêtes (ressort)
  for (const [aId, bId] of edges) {
    const a = nodeById.get(aId), b = nodeById.get(bId);
    if (!a || !b) continue;
    const dx = b.x - a.x, dy = b.y - a.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 0.1;
    const force = ATTRACTION * (dist - IDEAL_LENGTH);
    const fx = (dx / dist) * force;
    const fy = (dy / dist) * force;
    a.fx += fx; a.fy += fy;
    b.fx -= fx; b.fy -= fy;
  }

  // Appliquer les forces (limité par la température)
  for (const n of nodes) {
    const mag = Math.sqrt(n.fx * n.fx + n.fy * n.fy) || 0.001;
    const clamp = Math.min(mag, temp) / mag;
    n.x += n.fx * clamp;
    n.y += n.fy * clamp;
  }
}

// ── Centrage + normalisation → plage ≈ [-80, +80]
const provLayout = {};
for (const n of nodes) provLayout[n.id] = { x: n.x, y: n.y };

const xs = nodes.map((n) => n.x);
const ys = nodes.map((n) => n.y);
const minX = Math.min(...xs), maxX = Math.max(...xs);
const minY = Math.min(...ys), maxY = Math.max(...ys);
const cx = (minX + maxX) / 2;
const cy = (minY + maxY) / 2;
const range = Math.max(maxX - minX, maxY - minY) || 1;
const scale = 160 / range;

for (const id of Object.keys(provLayout)) {
  provLayout[id].x = (provLayout[id].x - cx) * scale;
  provLayout[id].y = (provLayout[id].y - cy) * scale;
}

// ── Vérification : distance minimum entre nœuds après normalisation
let minNodeDist = Infinity;
let closestPair = "";
const layoutNodes = Object.entries(provLayout);
for (let i = 0; i < layoutNodes.length; i++) {
  for (let j = i + 1; j < layoutNodes.length; j++) {
    const [idA, a] = layoutNodes[i];
    const [idB, b] = layoutNodes[j];
    const d = Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
    if (d < minNodeDist) {
      minNodeDist = d;
      const nameA = systemById.get(Number(idA))?.[1] ?? idA;
      const nameB = systemById.get(Number(idB))?.[1] ?? idB;
      closestPair = `${nameA} ↔ ${nameB}`;
    }
  }
}

// ── Positions systèmes adjacents (entry points hors régions cœur)
const adjLayout = {};
const adjSystems = data.systems.filter((s) => !CORE_IDS.has(s[5]));

for (const sys of adjSystems) {
  const id = sys[0];
  const geoX = sys[2], geoZ = sys[3];

  const neighbors = data.jumps
    .filter(([a, b]) => (a === id && provIds.has(b)) || (b === id && provIds.has(a)))
    .map(([a, b]) => (a === id ? b : a));

  if (neighbors.length === 0) continue;

  let nx = 0, ny = 0, cnt = 0;
  for (const nid of neighbors) {
    const lp = provLayout[nid];
    if (!lp) continue;
    nx += lp.x; ny += lp.y; cnt++;
  }
  if (cnt === 0) continue;
  nx /= cnt; ny /= cnt;

  const firstNeighbor = systemById.get(neighbors[0]);
  if (!firstNeighbor) continue;
  const dgx = firstNeighbor[2] - geoX;
  const dgz = firstNeighbor[3] - geoZ;
  const dist = Math.sqrt(dgx * dgx + dgz * dgz) || 1;

  const pad = 22;
  adjLayout[id] = {
    x: nx - (dgx / dist) * pad,
    y: ny - (dgz / dist) * pad,
  };
}

// ── Merge et écriture
data.layoutPositions = { ...provLayout, ...adjLayout };

for (const pos of Object.values(data.layoutPositions)) {
  pos.x = Math.round(pos.x * 100) / 100;
  pos.y = Math.round(pos.y * 100) / 100;
}

writeFileSync(jsonPath, JSON.stringify(data));

const adjCount = Object.keys(adjLayout).length;
const provCount = Object.keys(provLayout).length;
console.log(`✅ Layout calculé : ${provCount} Providence + ${adjCount} adjacents`);
console.log(`   Plage X : [${Math.min(...Object.values(data.layoutPositions).map((p) => p.x)).toFixed(1)}, ${Math.max(...Object.values(data.layoutPositions).map((p) => p.x)).toFixed(1)}]`);
console.log(`   Plage Y : [${Math.min(...Object.values(data.layoutPositions).map((p) => p.y)).toFixed(1)}, ${Math.max(...Object.values(data.layoutPositions).map((p) => p.y)).toFixed(1)}]`);
console.log(`   Paire la plus proche : ${closestPair} (${minNodeDist.toFixed(1)} unités)`);
