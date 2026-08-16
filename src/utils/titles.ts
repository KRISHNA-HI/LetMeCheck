import { Manga } from '../types';

/**
 * Centralized primary title resolver.
 * Priority order: English -> Romaji -> Native -> raw string -> Unknown Title
 */
export function getDisplayTitle(manga?: Manga | null | string | { title?: any; title_details?: any; alternative_titles?: string[] }): string {
  if (!manga) return 'Unknown Title';

  if (typeof manga === 'string') {
    const trimmed = manga.trim();
    return trimmed || 'Unknown Title';
  }

  // 1. Check title_details
  if (manga.title_details) {
    if (manga.title_details.english && manga.title_details.english.trim()) {
      return manga.title_details.english.trim();
    }
    if (manga.title_details.romaji && manga.title_details.romaji.trim()) {
      return manga.title_details.romaji.trim();
    }
    if (manga.title_details.native && manga.title_details.native.trim()) {
      return manga.title_details.native.trim();
    }
  }

  // 2. Check title object if formatted as an object (e.g. from AniList raw response)
  if (typeof (manga as any).title === 'object' && (manga as any).title !== null) {
    const rawObj = (manga as any).title;
    if (rawObj.english && typeof rawObj.english === 'string' && rawObj.english.trim()) {
      return rawObj.english.trim();
    }
    if (rawObj.romaji && typeof rawObj.romaji === 'string' && rawObj.romaji.trim()) {
      return rawObj.romaji.trim();
    }
    if (rawObj.native && typeof rawObj.native === 'string' && rawObj.native.trim()) {
      return rawObj.native.trim();
    }
  }

  // 3. Fallback to manga.title string
  if (typeof (manga as any).title === 'string' && (manga as any).title.trim()) {
    return (manga as any).title.trim();
  }

  // 4. Fallback to first available alternative title
  const altTitles = (manga as any).alternative_titles;
  if (Array.isArray(altTitles) && altTitles.length > 0) {
    const validAlt = altTitles.find((t: any) => typeof t === 'string' && t.trim().length > 0);
    if (validAlt) return validAlt.trim();
  }

  return 'Unknown Title';
}

/**
 * Returns the English title if available
 */
export function getEnglishTitle(manga?: Manga | null | { title?: any; title_details?: any }): string | undefined {
  if (!manga) return undefined;
  if (manga.title_details?.english?.trim()) return manga.title_details.english.trim();
  if (typeof (manga as any).title === 'object' && (manga as any).title?.english?.trim()) {
    return (manga as any).title.english.trim();
  }
  return undefined;
}

/**
 * Returns the Romanized title if available
 */
export function getRomajiTitle(manga?: Manga | null | { title?: any; title_details?: any }): string | undefined {
  if (!manga) return undefined;
  if (manga.title_details?.romaji?.trim()) return manga.title_details.romaji.trim();
  if (typeof (manga as any).title === 'object' && (manga as any).title?.romaji?.trim()) {
    return (manga as any).title.romaji.trim();
  }
  return undefined;
}

/**
 * Returns the Native/Original (e.g. Japanese Kanji, Korean Hangul, Chinese Hanzi) title if available
 */
export function getNativeTitle(manga?: Manga | null | { title?: any; title_details?: any }): string | undefined {
  if (!manga) return undefined;
  if (manga.title_details?.native?.trim()) return manga.title_details.native.trim();
  if (typeof (manga as any).title === 'object' && (manga as any).title?.native?.trim()) {
    return (manga as any).title.native.trim();
  }
  return undefined;
}

/**
 * Collects all unique title variations (English, Romaji, Native, alternative titles, synonyms)
 */
export function getAllTitleVariants(manga?: Manga | null | { title?: any; title_details?: any; alternative_titles?: string[] }): string[] {
  if (!manga) return [];
  const set = new Set<string>();

  const add = (t?: string | null) => {
    if (typeof t === 'string' && t.trim().length > 0) {
      set.add(t.trim());
    }
  };

  if (typeof (manga as any).title === 'string') add((manga as any).title);
  if (typeof (manga as any).title === 'object' && (manga as any).title !== null) {
    add((manga as any).title.english);
    add((manga as any).title.romaji);
    add((manga as any).title.native);
  }
  if (manga.title_details) {
    add(manga.title_details.english);
    add(manga.title_details.romaji);
    add(manga.title_details.native);
  }
  if (Array.isArray(manga.alternative_titles)) {
    manga.alternative_titles.forEach(add);
  }

  return Array.from(set);
}

/**
 * Unicode-normalized case-insensitive matching across all title variants
 */
export function matchesMangaTitle(manga: Manga | null | undefined, searchQuery: string): boolean {
  if (!manga || !searchQuery) return false;
  const q = searchQuery.trim().toLowerCase().normalize('NFKD');
  if (!q) return true;

  const variants = getAllTitleVariants(manga);
  return variants.some((variant) => {
    const v = variant.toLowerCase().normalize('NFKD');
    return v.includes(q) || q.includes(v);
  });
}
