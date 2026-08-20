// ==========================================================
// LetMeCheck Universal Universe & Franchise Registry
// Modular, audited multi-regional universes, cinematic continuities,
// anime sagas, and accurate chronological/release watch orders.
// ==========================================================

import { Universe } from '../types/content';
import { MCU_UNIVERSE } from './universes/mcuData';
import { DC_UNIVERSES } from './universes/dcData';
import { MARVEL_LEGACY_UNIVERSES } from './universes/marvelLegacyData';
import { SCIFI_FANTASY_UNIVERSES } from './universes/scifiFantasyData';
import { ANIME_UNIVERSES } from './universes/animeData';
import { INDIAN_CINEMA_UNIVERSES } from './universes/indianCinemaData';

export const UNIVERSE_REGISTRY: Universe[] = [
  MCU_UNIVERSE,
  ...DC_UNIVERSES,
  ...MARVEL_LEGACY_UNIVERSES,
  ...SCIFI_FANTASY_UNIVERSES,
  ...ANIME_UNIVERSES,
  ...INDIAN_CINEMA_UNIVERSES,
];

export const getUniverseById = (id: string): Universe | undefined => {
  return UNIVERSE_REGISTRY.find(
    (u) => u.id.toLowerCase() === id.toLowerCase() || u.slug?.toLowerCase() === id.toLowerCase()
  );
};
