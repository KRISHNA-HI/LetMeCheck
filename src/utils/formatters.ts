import { ReadingStatus, MaterialType, MaterialStatus, MangaType, ContentType } from '../types';

export function calculateProgressPercentage(current: number, total: number | null | undefined): number {
  if (!total || total <= 0) return 0;
  const pct = (current / total) * 100;
  return Math.min(100, Math.max(0, Math.round(pct * 10) / 10));
}

export function formatCompactNumber(num?: number | null): string {
  if (num === null || num === undefined) return '0';
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1)}K`;
  }
  return num.toString();
}

/**
 * Checks if a given media type belongs to the Reading category (Manga/Manhwa/Novel)
 * vs Entertainment category (Movie/TV/Anime).
 */
export function isReadingMedia(type?: string | MangaType | ContentType | null): boolean {
  if (!type) return false;
  const t = type.toString().toLowerCase().trim().replace(/[-_]/g, ' ');
  return (
    t === 'manga' ||
    t === 'manhwa' ||
    t === 'manhua' ||
    t === 'light novel' ||
    t === 'light_novel' ||
    t === 'one shot' ||
    t === 'one_shot' ||
    t === 'novel' ||
    t === 'comic'
  );
}

/**
 * Maps internal storage statuses ('Reading', 'Pending', 'Completed', etc.)
 * to domain-appropriate presentation labels:
 * Entertainment -> 'Want to Watch', 'Watching', 'Watched'
 * Reading       -> 'Want to Read', 'Reading', 'Read'
 */
export function getPresentationStatus(
  status?: ReadingStatus | string | null,
  type?: string | MangaType | ContentType | null
): string {
  if (!status) return '';

  const s = status.trim();
  const isReading = isReadingMedia(type);

  if (isReading) {
    switch (s) {
      case 'Reading':
      case 'In Progress':
        return 'Reading';
      case 'Pending':
      case 'Plan to Read':
      case 'Want to Read':
      case 'Want to Watch':
        return 'Want to Read';
      case 'Completed':
      case 'Read':
      case 'Watched':
      case 'Complete':
        return 'Read';
      case 'On Hold':
        return 'On Hold';
      case 'Dropped':
        return 'Dropped';
      default:
        return s;
    }
  } else {
    // Entertainment (Movies, TV Series, Web Series, Anime, Drama, OVA, Special)
    switch (s) {
      case 'Reading':
      case 'Watching':
      case 'In Progress':
        return 'Watching';
      case 'Pending':
      case 'Plan to Read':
      case 'Want to Watch':
      case 'Want to Read':
        return 'Want to Watch';
      case 'Completed':
      case 'Watched':
      case 'Read':
      case 'Complete':
        return 'Watched';
      case 'On Hold':
        return 'On Hold';
      case 'Dropped':
        return 'Dropped';
      default:
        return s;
    }
  }
}

/**
 * Returns available user-facing status options mapped to their underlying
 * backward-compatible database value.
 */
export function getStatusOptions(type?: string | MangaType | ContentType | null): {
  value: ReadingStatus;
  label: string;
}[] {
  const isReading = isReadingMedia(type);
  if (isReading) {
    return [
      { value: 'Reading', label: 'Reading' },
      { value: 'Pending', label: 'Want to Read' },
      { value: 'Completed', label: 'Read' },
      { value: 'On Hold', label: 'On Hold' },
      { value: 'Dropped', label: 'Dropped' }
    ];
  } else {
    return [
      { value: 'Reading', label: 'Watching' },
      { value: 'Pending', label: 'Want to Watch' },
      { value: 'Completed', label: 'Watched' },
      { value: 'On Hold', label: 'On Hold' },
      { value: 'Dropped', label: 'Dropped' }
    ];
  }
}

/**
 * Presentation label for Material items (adaptation guide checkpoints)
 */
export function getMaterialStatusLabel(
  status: MaterialStatus,
  materialType?: MaterialType | string | null
): string {
  const isReading = isReadingMedia(materialType);
  if (isReading) {
    switch (status) {
      case 'Completed':
        return 'Read';
      case 'In Progress':
        return 'Reading';
      case 'Pending':
      default:
        return 'Want to Read';
    }
  } else {
    switch (status) {
      case 'Completed':
        return 'Watched';
      case 'In Progress':
        return 'Watching';
      case 'Pending':
      default:
        return 'Want to Watch';
    }
  }
}

export function getStatusColorClass(status: ReadingStatus | string): string {
  const s = (status || '').toLowerCase();
  if (s.includes('read') && !s.includes('want') && !s.includes('plan')) {
    if (s === 'read' || s === 'completed' || s === 'watched' || s === 'complete') {
      return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
    }
    return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
  }
  if (s.includes('watching') || s === 'in progress') {
    return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
  }
  if (s.includes('want') || s.includes('plan') || s === 'pending') {
    return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
  }
  if (s.includes('complete') || s.includes('watched') || s === 'read') {
    return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
  }
  if (s.includes('hold')) {
    return 'bg-orange-500/10 text-orange-400 border-orange-500/30';
  }
  if (s.includes('drop')) {
    return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
  }
  return 'bg-slate-800 text-slate-300 border-slate-700';
}

export function getMaterialTypeBadgeClass(type: MaterialType | string): string {
  const t = (type || '').toLowerCase();
  switch (t) {
    case 'movie':
      return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    case 'tv series':
    case 'tv_series':
      return 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30';
    case 'web series':
    case 'web_series':
      return 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30';
    case 'anime':
    case 'ova':
      return 'bg-orange-500/15 text-orange-400 border-orange-500/30';
    case 'drama':
      return 'bg-pink-500/15 text-pink-400 border-pink-500/30';
    case 'manga':
      return 'bg-sky-500/15 text-sky-400 border-sky-500/30';
    case 'manhwa':
      return 'bg-purple-500/15 text-purple-400 border-purple-500/30';
    case 'manhua':
      return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
    case 'light novel':
    case 'light_novel':
      return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    case 'special':
    case 'one-shot':
      return 'bg-fuchsia-500/15 text-fuchsia-400 border-fuchsia-500/30';
    default:
      return 'bg-zinc-800 text-zinc-300 border-zinc-700';
  }
}

export function truncateText(text: string, maxLength = 160): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}

/**
 * Safely constructs a canonical CDN URL for posters / covers,
 * automatically handling TMDB relative paths (/xyz.jpg).
 */
export function getReliableCoverUrl(
  item?: { cover_url?: string | null; poster_url?: string | null } | null
): string {
  if (!item) return '/placeholder-cover.svg';
  const url = (item.cover_url || item.poster_url || '').trim();
  if (!url || url === '/placeholder-cover.svg' || url === 'placeholder-cover.svg') {
    return '/placeholder-cover.svg';
  }
  // If it's a relative TMDB path like "/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg"
  if (url.startsWith('/') && !url.startsWith('/placeholder') && !url.startsWith('/images/')) {
    return `https://image.tmdb.org/t/p/w500${url}`;
  }
  return url;
}

/**
 * Safely constructs a canonical CDN URL for banners / backdrops,
 * automatically handling TMDB relative paths (/xyz.jpg).
 */
export function getReliableBannerUrl(
  item?: { banner_url?: string | null; backdrop_url?: string | null; cover_url?: string | null; poster_url?: string | null } | null
): string | null {
  if (!item) return null;
  const url = (item.banner_url || item.backdrop_url || '').trim();
  if (!url) {
    const fallbackCover = (item.cover_url || item.poster_url || '').trim();
    if (!fallbackCover || fallbackCover === '/placeholder-cover.svg' || fallbackCover === 'placeholder-cover.svg') {
      return null;
    }
    if (fallbackCover.startsWith('/') && !fallbackCover.startsWith('/placeholder') && !fallbackCover.startsWith('/images/')) {
      return `https://image.tmdb.org/t/p/w500${fallbackCover}`;
    }
    return fallbackCover;
  }
  if (url.startsWith('/') && !url.startsWith('/placeholder') && !url.startsWith('/images/')) {
    return `https://image.tmdb.org/t/p/original${url}`;
  }
  return url;
}

/**
 * Determines whether a content item or manga model has a genuine, usable cover/poster image.
 * Returns false if the image URL is missing, empty, null, undefined, or refers to the placeholder asset.
 */
export function hasUsableImage(
  item?: { cover_url?: string | null; poster_url?: string | null } | null
): boolean {
  if (!item) return false;
  const url = (item.cover_url || item.poster_url || '').trim();
  if (!url) return false;
  if (
    url === '/placeholder-cover.svg' ||
    url === 'placeholder-cover.svg' ||
    url.endsWith('/placeholder-cover.svg')
  ) {
    return false;
  }
  return true;
}

export * from './titles';
