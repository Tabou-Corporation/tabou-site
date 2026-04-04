/**
 * ─── ZKILLBOARD — Mock data ───────────────────────────────────────────────────
 *
 * Données fictives calquées sur la structure réelle de l'API zkillboard.
 * Les ship_type_id sont réels → les icônes EVE se chargent correctement.
 * Supprimer ce fichier une fois l'API branchée.
 */

import type { ZkillEntry } from "./types";

const now = new Date();
const ago = (minutes: number) =>
  new Date(now.getTime() - minutes * 60_000).toISOString();

export const MOCK_KILLS: ZkillEntry[] = [
  {
    killmail_id: 100000001,
    killmail_time: ago(3),
    victim: {
      character_id: 90000001,
      character_name: "Vargur Pilot",
      corporation_id: 99000001,
      ship_type_id: 17738,        // Vargur
      ship_name: "Vargur",
    },
    zkb: {
      totalValue: 1_850_000_000,
      hash: "abc123",
      url: "https://zkillboard.com/kill/100000001/",
    },
  },
  {
    killmail_id: 100000002,
    killmail_time: ago(18),
    victim: {
      character_id: 90000002,
      character_name: "T3C Pilot",
      corporation_id: 99000002,
      ship_type_id: 29984,        // Tengu
      ship_name: "Tengu",
    },
    zkb: {
      totalValue: 1_240_000_000,
      hash: "def456",
      url: "https://zkillboard.com/kill/100000002/",
    },
  },
  {
    killmail_id: 100000003,
    killmail_time: ago(47),
    victim: {
      character_id: 90000003,
      character_name: "Machariel Pilot",
      corporation_id: 99000003,
      ship_type_id: 17922,        // Machariel
      ship_name: "Machariel",
    },
    zkb: {
      totalValue: 680_000_000,
      hash: "ghi789",
      url: "https://zkillboard.com/kill/100000003/",
    },
  },
  {
    killmail_id: 100000004,
    killmail_time: ago(92),
    victim: {
      character_id: 90000004,
      character_name: "Loki Pilot",
      corporation_id: 99000004,
      ship_type_id: 29990,        // Loki
      ship_name: "Loki",
    },
    zkb: {
      totalValue: 3_400_000_000,
      hash: "jkl012",
      url: "https://zkillboard.com/kill/100000004/",
    },
  },
  {
    killmail_id: 100000005,
    killmail_time: ago(210),
    victim: {
      character_id: 90000005,
      character_name: "Nyx Pilot",
      corporation_id: 99000005,
      ship_type_id: 23913,        // Nyx
      ship_name: "Nyx",
    },
    zkb: {
      totalValue: 24_500_000_000,
      hash: "mno345",
      url: "https://zkillboard.com/kill/100000005/",
    },
  },
];
