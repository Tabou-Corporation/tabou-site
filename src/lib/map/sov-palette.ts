/**
 * Palette sov — adaptée de neocom-zorath.
 * Empire faction colors (canonical lore) + alliance palette top-20 + CVA gold.
 */

export const FACTION_COLOR = new Map<number, string>([
  [500001, "#4A90B8"],  // Caldari State
  [500002, "#B85450"],  // Minmatar Republic
  [500003, "#C9A155"],  // Amarr Empire
  [500004, "#5AA08C"],  // Gallente Federation
  [500005, "#7DA8C9"],  // CONCORD
  [500006, "#B79750"],  // Ammatar Mandate
  [500007, "#7E9088"],  // Khanid Kingdom
  [500008, "#6E6E6E"],  // The Syndicate
  [500009, "#8B9D3F"],  // Guristas Pirates
  [500010, "#6FAEC8"],  // Angel Cartel
  [500011, "#A03030"],  // Blood Raider Covenant
  [500012, "#5F5F65"],  // The InterBus
  [500014, "#C97A35"],  // ORE
  [500016, "#B89968"],  // Thukker Tribe
  [500018, "#6BC0E8"],  // Mordu's Legion
  [500019, "#9B2828"],  // Sansha's Nation
  [500020, "#5C8F3E"],  // Serpentis
  [500024, "#9C82B6"],  // Society of Conscious Thought
  [500026, "#D4D8DC"],  // Sisters of EVE
]);

export const FACTION_NAMES = new Map<number, string>([
  [500001, "Caldari State"],
  [500002, "Minmatar Republic"],
  [500003, "Amarr Empire"],
  [500004, "Gallente Federation"],
  [500005, "CONCORD Assembly"],
  [500006, "Ammatar Mandate"],
  [500007, "Khanid Kingdom"],
  [500008, "The Syndicate"],
  [500009, "Guristas Pirates"],
  [500010, "Angel Cartel"],
  [500011, "Blood Raider Covenant"],
  [500012, "The InterBus"],
  [500014, "ORE"],
  [500016, "Thukker Tribe"],
  [500018, "Mordu's Legion"],
  [500019, "Sansha's Nation"],
  [500020, "Serpentis"],
  [500024, "Society of Conscious Thought"],
  [500026, "Sisters of EVE"],
]);

/** Palette 20 hues "golden-angle" distribuées, évite les golds (réservés CVA/Amarr). */
export const ALLIANCE_PALETTE = [
  "#7B5CFF", "#FF7BAC", "#3FBFD9", "#FF9A4D", "#9CDD55",
  "#D86BE8", "#5BD4A0", "#FF6B6B", "#7FB8FF", "#E8B86B",
  "#B888FF", "#5FE8C3", "#FF89D1", "#6F9CFA", "#FFCB55",
  "#A8E66B", "#FF8C6B", "#74C5FF", "#C977FF", "#5BBE85",
];

/** CVA = Curatores Veritatis Alliance — holders historiques de Providence. */
export const CVA_ALLIANCE_ID = 1988009451;
export const CVA_COLOR = "#E6C265";

/** Red Alliance — historiquement hostile, force-colorée en rouge. */
export const RED_ALLIANCE_ID = 1220922756;
export const RED_ALLIANCE_COLOR = "#E63946";

/** Couleurs forcées pour alliances notables (priorité sur le palette dynamique). */
export const FORCED_ALLIANCE_COLORS: Record<number, string> = {
  [CVA_ALLIANCE_ID]: CVA_COLOR,
  [RED_ALLIANCE_ID]: RED_ALLIANCE_COLOR,
};

export const OTHERS_COLOR = "#5A5965";
export const UNCLAIMED_COLOR = "#2A2A30";
