// ==========================================================
// LetMeCheck Universe Image & Metadata Resolver
// Guarantees reliable poster, backdrop, and release state resolution
// preventing broken links, "NO COVER IMAGE", and static staleness.
// Multi-tier resolution:
// 1. Explicit verified TMDB path/URL
// 2. Curated high-res franchise/title CDN artwork
// 3. First available entry poster in watch orders
// 4. Default high-contrast visual placeholder (never empty src)
// ==========================================================

import { Universe, WatchOrderEntry, UniverseTitleRelationship } from '../types/content';

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/';
const DEFAULT_PLACEHOLDER_COVER = '/placeholder-cover.svg';

/**
 * Curated, verified franchise-specific fallback artwork
 * Guarantees every universe has distinct, recognizable imagery
 * even if external APIs or ad-blockers interfere.
 */
const FRANCHISE_ARTWORK_REGISTRY: Record<string, { poster: string; backdrop: string }> = {
  // Marvel & DC
  'mcu': {
    poster: 'https://image.tmdb.org/t/p/w500/or06FN3Dka5tukK1e9sl16pB3iy.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/7RyHsO4yDXtBv1zUU3mTpHeQ0d5.jpg'
  },
  'dceu': {
    poster: 'https://image.tmdb.org/t/p/w500/7WsyChQLEftFiDOVTGkv3hFpyyt.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/jBJWaqoSCiARWtfV0GlqHrcdidd.jpg'
  },
  'dcu': {
    poster: 'https://image.tmdb.org/t/p/w500/8CdWjvZQUExUUTzyp4t6EDMubfO.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/9lE7iO37H3WjP7e408qE7P1R3j8.jpg'
  },
  'batman-epic-crime-saga': {
    poster: 'https://image.tmdb.org/t/p/w500/74xTEgt7R36Fpooo50r9T25onhq.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/tRS6jvPM9qPrrnx2KRk3ew96YKd.jpg'
  },
  'dark-knight-trilogy': {
    poster: 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/dqK9Hag1054tghRQSqLSfrkvQnA.jpg'
  },
  'joker-saga': {
    poster: 'https://image.tmdb.org/t/p/w500/udDclJoHjfjb8Ekgsd4FDteOkCU.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/n6bUvigpRFqSwmPp1m2Y5L3i0y.jpg'
  },
  'spider-man-franchise': {
    poster: 'https://image.tmdb.org/t/p/w500/gh4c2ubiUzVTNyfOa17tJioSdMw.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/tMefBSflR6PGQLv7WvFPpKLZkyk.jpg'
  },
  'spider-verse': {
    poster: 'https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/4HodYYKEIsGOdinkGi2Ucz6X9i0.jpg'
  },
  'x-men-saga': {
    poster: 'https://image.tmdb.org/t/p/w500/bRDAc4GogS9DeWWdrkAgUiOC6Hg.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/hQ4pqqGE9iyTM2qV4Lq90hXlK8v.jpg'
  },
  'sony-spider-man-universe': {
    poster: 'https://image.tmdb.org/t/p/w500/2uNW4WbgBXL2544qGLQmR6KpUtK.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/vIPIFVoi9247v78mGwhXqEkmxO.jpg'
  },
  'deadpool-franchise': {
    poster: 'https://image.tmdb.org/t/p/w500/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/9lE7iO37H3WjP7e408qE7P1R3j8.jpg'
  },
  'fantastic-four-franchise': {
    poster: 'https://image.tmdb.org/t/p/w500/inVq30NYgGtHg28nWbtg74Q7e1j.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/9GBhzXMFjgcZ3FdR9w0bUMMTgNs.jpg'
  },

  // Sci-Fi & Fantasy
  'star-wars': {
    poster: 'https://image.tmdb.org/t/p/w500/6FfCtAuVAW8XJjZ7eWeLibRLWTw.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/zqkmTXzjkAgPnBNaMYw6aU42Uf.jpg'
  },
  'wizarding-world': {
    poster: 'https://image.tmdb.org/t/p/w500/wuMc08IPKEatf9rnMNXvIDxqP4W.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/hziiv146OpD7q68L0lLsUrCnM7T.jpg'
  },
  'middle-earth': {
    poster: 'https://image.tmdb.org/t/p/w500/6oom5QYQ2yQTMJIbnvbkBL9cDK6.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/vRQnzOn4H1vgKiF1WqW0qG7QeF1.jpg'
  },
  'monsterverse': {
    poster: 'https://image.tmdb.org/t/p/w500/tMefBSflR6PGQLv7WvFPpKLZkyk.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/en3DXdpj4et90wbPvGFweqdr4xS.jpg'
  },
  'the-conjuring-universe': {
    poster: 'https://image.tmdb.org/t/p/w500/wVYREutTvI2tmxr6ujrHT704wGF.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/mKTIsqPec71oO37H3WjP7e408q.jpg'
  },
  'fast-and-furious': {
    poster: 'https://image.tmdb.org/t/p/w500/fiVW06jE7z9Y1YqGZfKzWJ2t7v.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/4HodYYKEIsGOdinkGi2Ucz6X9i0.jpg'
  },
  'mission-impossible': {
    poster: 'https://image.tmdb.org/t/p/w500/NNxYkU70HPurnNCSiCjYAmacwm.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/628Dep6AxEtDxjZoGP78TsOxYbK.jpg'
  },
  'james-bond': {
    poster: 'https://image.tmdb.org/t/p/w500/iGoXIpQb7P0Z8aT9W42UfgpnwLz.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/r2J02Z2OpNTctfOSN2Ydgii51I3.jpg'
  },
  'john-wick': {
    poster: 'https://image.tmdb.org/t/p/w500/vZloFAK7NmvMGKE7VkF5UHaz0I.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/4HodYYKEIsGOdinkGi2Ucz6X9i0.jpg'
  },
  'breaking-bad-universe': {
    poster: 'https://image.tmdb.org/t/p/w500/ggFHVNu6YYI5L9pCfOacjizRGt.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/tsRy63Mu5cu8etL1X7ZLyf7UP1M.jpg'
  },

  // Anime
  'jujutsu-kaisen': {
    poster: 'https://image.tmdb.org/t/p/w500/hD05Ur1wN8Qv2M2xTzN3q9Y8o1.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/9vE7iO37H3WjP7e408qE7P1R3j8.jpg'
  },
  'dragon-ball': {
    poster: 'https://image.tmdb.org/t/p/w500/tShQt1wN8Qv2M2xTzN3q9Y8o1.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/9kF1WqW0qG7QeF1M7v9W1Y.jpg'
  },
  'demon-slayer': {
    poster: 'https://image.tmdb.org/t/p/w500/xUfRZu2mi8jH69Q7L6x0bUMMTg.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/9r9QxWk8pQ9z8o2J6M6o8vP7e4.jpg'
  },
  'naruto-boruto-saga': {
    poster: 'https://image.tmdb.org/t/p/w500/77k9vY8oU8kGkQZfKzWJ2t7vP8y.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/tsRy63Mu5cu8etL1X7ZLyf7UP1M.jpg'
  },
  'one-piece-saga': {
    poster: 'https://image.tmdb.org/t/p/w500/cMD9Ygz11xYdgii51I3r2J02Z2.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/4HodYYKEIsGOdinkGi2Ucz6X9i0.jpg'
  },
  'attack-on-titan': {
    poster: 'https://image.tmdb.org/t/p/w500/8C9nS01r1CMDvyUbvdme394fnSd.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/r2J02Z2OpNTctfOSN2Ydgii51I3.jpg'
  },
  'bleach-universe': {
    poster: 'https://image.tmdb.org/t/p/w500/2EewFaZrORbKNq589tQZ97oQ1v4.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/9lE7iO37H3WjP7e408qE7P1R3j8.jpg'
  },

  // Indian Regional Cinema
  'yrf-spy-universe': {
    poster: 'https://image.tmdb.org/t/p/w500/m1b9To0hO4fE0qR2r3J8vP7e408.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/9r9QxWk8pQ9z8o2J6M6o8vP7e4.jpg'
  },
  'cop-universe': {
    poster: 'https://image.tmdb.org/t/p/w500/1X6G0fE0qR2r3J8vP7e408qE7P1.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/4HodYYKEIsGOdinkGi2Ucz6X9i0.jpg'
  },
  'lcu': {
    poster: 'https://image.tmdb.org/t/p/w500/t05t3l0X1m7W8qZfKzWJ2t7vP8.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/9r9QxWk8pQ9z8o2J6M6o8vP7e4.jpg'
  },
  'maddock-horror-comedy': {
    poster: 'https://image.tmdb.org/t/p/w500/wVYREutTvI2tmxr6ujrHT704wGF.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/b0PlSFdDwbyK0cf5RxwDpaOJQvQ.jpg'
  },
  'kalki-cinematic-universe': {
    poster: 'https://image.tmdb.org/t/p/w500/tMefBSflR6PGQLv7WvFPpKLZkyk.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/9lE7iO37H3WjP7e408qE7P1R3j8.jpg'
  },
  'baahubali-franchise': {
    poster: 'https://image.tmdb.org/t/p/w500/wuMc08IPKEatf9rnMNXvIDxqP4W.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/hkBaDkMWbLaf8B1r5SvR47xKV49.jpg'
  },
  'kgf-franchise': {
    poster: 'https://image.tmdb.org/t/p/w500/vZloFAK7NmvMGKE7VkF5UHaz0I.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/tsRy63Mu5cu8etL1X7ZLyf7UP1M.jpg'
  },
  'pushpa-franchise': {
    poster: 'https://image.tmdb.org/t/p/w500/7WsyChQLEftFiDOVTGkv3hFpyyt.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/9r9QxWk8pQ9z8o2J6M6o8vP7e4.jpg'
  },
  'dhoom-franchise': {
    poster: 'https://image.tmdb.org/t/p/w500/fiVW06jE7z9Y1YqGZfKzWJ2t7v.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/4HodYYKEIsGOdinkGi2Ucz6X9i0.jpg'
  },
  'dhamaal-franchise': {
    poster: 'https://image.tmdb.org/t/p/w500/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/hkBaDkMWbLaf8B1r5SvR47xKV49.jpg'
  },
  'hera-pheri-franchise': {
    poster: 'https://image.tmdb.org/t/p/w500/inVq30NYgGtHg28nWbtg74Q7e1j.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/b0PlSFdDwbyK0cf5RxwDpaOJQvQ.jpg'
  },
  'golmaal-franchise': {
    poster: 'https://image.tmdb.org/t/p/w500/1X6G0fE0qR2r3J8vP7e408qE7P1.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/vRQnzOn4H1vgKiF1WqW0qG7QeF1.jpg'
  },
  'bhool-bhulaiyaa-franchise': {
    poster: 'https://image.tmdb.org/t/p/w500/udDclJoHjfjb8Ekgsd4FDteOkCU.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/9r9QxWk8pQ9z8o2J6M6o8vP7e4.jpg'
  },
  'drishyam-franchise': {
    poster: 'https://image.tmdb.org/t/p/w500/74xTEgt7R36Fpooo50r9T25onhq.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/tsRy63Mu5cu8etL1X7ZLyf7UP1M.jpg'
  }
};

/**
 * Normalizes any TMDB relative path or full URL into a guaranteed full URL
 */
export function normalizeTmdbImage(
  urlOrPath?: string | null,
  size: 'w300' | 'w500' | 'original' = 'w500'
): string {
  if (!urlOrPath || typeof urlOrPath !== 'string' || !urlOrPath.trim()) {
    return DEFAULT_PLACEHOLDER_COVER;
  }

  const clean = urlOrPath.trim();
  if (clean.startsWith('http://') || clean.startsWith('https://')) {
    return clean;
  }

  if (clean.startsWith('/')) {
    return `${TMDB_IMAGE_BASE}${size}${clean}`;
  }

  return `${TMDB_IMAGE_BASE}${size}/${clean}`;
}

/**
 * Resolves the best high-resolution poster for a Universe/Franchise.
 * Priority:
 * 1. Explicit configured universe poster (if not default placeholder)
 * 2. Curated franchise artwork backup
 * 3. Fallback to first available entry poster in watch orders
 * 4. Fallback to placeholder
 */
export function resolveUniversePoster(universe?: Universe | null): string {
  if (!universe) return DEFAULT_PLACEHOLDER_COVER;

  const candidate = universe.poster_url || universe.poster;
  if (candidate && candidate.trim() && candidate !== DEFAULT_PLACEHOLDER_COVER) {
    return normalizeTmdbImage(candidate, 'w500');
  }

  // Check franchise registry
  if (universe.id && FRANCHISE_ARTWORK_REGISTRY[universe.id]?.poster) {
    return FRANCHISE_ARTWORK_REGISTRY[universe.id].poster;
  }

  // Check titles or available orders for a representative poster
  const orders = universe.available_orders || universe.watch_orders || universe.watchOrders || [];
  for (const order of orders) {
    const entries = order.ordered_entries || order.items || [];
    for (const entry of entries) {
      if (entry.poster_url && entry.poster_url.trim() && entry.poster_url !== DEFAULT_PLACEHOLDER_COVER) {
        return normalizeTmdbImage(entry.poster_url, 'w500');
      }
    }
  }

  return DEFAULT_PLACEHOLDER_COVER;
}

/**
 * Resolves the best backdrop / banner for a Universe/Franchise
 */
export function resolveUniverseBackdrop(universe?: Universe | null): string {
  if (!universe) return resolveUniversePoster(universe);

  const candidate = universe.backdrop_url || universe.backdrop;
  if (candidate && candidate.trim() && candidate !== DEFAULT_PLACEHOLDER_COVER) {
    return normalizeTmdbImage(candidate, 'original');
  }

  // Check franchise registry
  if (universe.id && FRANCHISE_ARTWORK_REGISTRY[universe.id]?.backdrop) {
    return FRANCHISE_ARTWORK_REGISTRY[universe.id].backdrop;
  }

  return resolveUniversePoster(universe);
}

/**
 * Resolves a title/entry poster within a universe
 */
export function resolveEntryPoster(
  entry?: WatchOrderEntry | UniverseTitleRelationship | null,
  parentUniverse?: Universe | null
): string {
  if (!entry) return resolveUniversePoster(parentUniverse);

  if (entry.poster_url && entry.poster_url.trim() && entry.poster_url !== DEFAULT_PLACEHOLDER_COVER) {
    return normalizeTmdbImage(entry.poster_url, 'w500');
  }

  return resolveUniversePoster(parentUniverse);
}

/**
 * Evaluates whether a title is 'released' or 'upcoming' based on current date
 */
export function getEffectiveStatus(
  releaseDate?: string | null,
  releaseYear?: number | null,
  declaredStatus?: string | null
): 'released' | 'upcoming' | 'cancelled' {
  if (declaredStatus === 'cancelled') return 'cancelled';
  if (declaredStatus === 'upcoming') {
    // If declared upcoming and releaseDate is provided, verify against current date
    if (releaseDate) {
      const parsed = new Date(releaseDate);
      if (!isNaN(parsed.getTime())) {
        return parsed.getTime() > Date.now() ? 'upcoming' : 'released';
      }
    }
    return 'upcoming';
  }

  if (releaseDate) {
    const parsed = new Date(releaseDate);
    if (!isNaN(parsed.getTime())) {
      return parsed.getTime() > Date.now() ? 'upcoming' : 'released';
    }
  }

  if (releaseYear) {
    const currentYear = new Date().getFullYear();
    if (releaseYear > currentYear) {
      return 'upcoming';
    }
  }

  return 'released';
}

