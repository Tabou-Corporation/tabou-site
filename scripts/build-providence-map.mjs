/**
 * Filtre src de newEden.json (neocom-zorath) pour ne garder que :
 *   - Tous les systèmes de Providence (regionId 10000047)
 *   - Les systèmes adjacents par gate (1 saut hors région)
 *   - Toutes les jumps entre ces systèmes
 *   - Les régions correspondantes (pour les labels)
 *
 * Sortie : src/lib/map/sde/providence.json (format identique au compact source)
 *
 * Lancement : node scripts/build-providence-map.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = "F:/Documents/neocom-zorath/src/data/newEden.json";
const OUT = path.join(__dirname, "..", "src", "lib", "map", "sde", "providence.json");

// Régions cœur ("inRegion") : Providence + Catch (CVA y détient aussi des systèmes).
const CORE_REGION_IDS = new Set([10000047, 10000014]); // Providence, Catch
const PROVIDENCE_REGION_ID = 10000047; // gardé pour le label de la région principale

const data = JSON.parse(fs.readFileSync(SRC, "utf8"));
console.log(`Source : ${data.systems.length} systèmes, ${data.jumps.length} jumps, ${data.regions.length} régions.`);

// 1. Tous les systèmes des régions cœur
const coreIds = new Set(
  data.systems.filter((s) => CORE_REGION_IDS.has(s[5])).map((s) => s[0]),
);
console.log(`Core (Providence + Catch) : ${coreIds.size} systèmes.`);

// 2. Systèmes adjacents par gate (1 saut hors région cœur)
const adjacentIds = new Set();
for (const [a, b] of data.jumps) {
  if (coreIds.has(a) && !coreIds.has(b)) adjacentIds.add(b);
  if (coreIds.has(b) && !coreIds.has(a)) adjacentIds.add(a);
}
console.log(`Adjacents : ${adjacentIds.size} systèmes.`);

// 3. Union finale
const keepIds = new Set([...coreIds, ...adjacentIds]);
const systems = data.systems.filter((s) => keepIds.has(s[0]));

// 4. Jumps entre systèmes conservés
const jumps = data.jumps.filter(([a, b]) => keepIds.has(a) && keepIds.has(b));

// 5. Régions concernées (pour labels)
const regionIds = new Set(systems.map((s) => s[5]));
const regions = data.regions.filter((r) => regionIds.has(r[0]));

// 6. Re-projection autour du centre des régions cœur (Providence + Catch)
const coreSystems = systems.filter((s) => CORE_REGION_IDS.has(s[5]));
const cx = coreSystems.reduce((acc, s) => acc + s[2], 0) / coreSystems.length;
const cz = coreSystems.reduce((acc, s) => acc + s[3], 0) / coreSystems.length;
const recenter = (x, z) => [
  Math.round((x - cx) * 100) / 100,
  Math.round((z - cz) * 100) / 100,
];

const reSystems = systems.map(([id, name, x, z, sec, regionId]) => {
  const [rx, rz] = recenter(x, z);
  return [id, name, rx, rz, sec, regionId];
});
const reRegions = regions.map(([id, name, x, z, factionId]) => {
  const [rx, rz] = recenter(x, z);
  return [id, name, rx, rz, factionId];
});

const out = {
  region: { id: PROVIDENCE_REGION_ID, name: "Providence" }, // région principale (legacy)
  coreRegionIds: [...CORE_REGION_IDS], // toutes les régions "cœur" — Providence + Catch
  systems: reSystems,
  jumps,
  regions: reRegions,
};

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(out));
const size = fs.statSync(OUT).size;
console.log(`Écrit ${OUT} (${(size / 1024).toFixed(1)} KB) — ${reSystems.length} systèmes, ${jumps.length} jumps, ${reRegions.length} régions.`);
