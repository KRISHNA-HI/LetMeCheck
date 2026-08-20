// ==========================================================
// Universal Content Normalizer
// Maps provider responses (TMDB, AniList, etc.) into clean,
// normalized ContentItem models with reliable industry, language,
// and content-type detection.
// ==========================================================

import { ContentItem, ContentType, ContentStatus, SeasonModel } from '../../types/content';

// Map of ISO language code + production country to primary Indian/Global Industry
export function detectIndustry(
  originalLanguage?: string | null,
  originCountries?: string[] | null,
  genres?: string[] | null,
  isAnimation?: boolean
): { industryCode: string; industryName: string } {
  const lang = (originalLanguage || '').toLowerCase().trim();
  const countries = (originCountries || []).map((c) => c.toUpperCase().trim());

  // Anime classification
  if ((lang === 'ja' || countries.includes('JP')) && (isAnimation || genres?.some((g) => g.toLowerCase().includes('animation') || g.toLowerCase().includes('anime')))) {
    return { industryCode: 'anime_industry', industryName: 'Anime Industry' };
  }

  // Japanese Live-Action Cinema / J-Drama
  if (lang === 'ja' || countries.includes('JP')) {
    return { industryCode: 'japanese_cinema', industryName: 'Japanese Cinema & J-Drama' };
  }

  // Korean Cinema & K-Drama
  if (lang === 'ko' || countries.includes('KR')) {
    return { industryCode: 'korean_cinema', industryName: 'Korean Cinema & K-Drama' };
  }

  // Chinese Cinema & C-Drama
  if (lang === 'zh' || countries.includes('CN') || countries.includes('HK') || countries.includes('TW')) {
    return { industryCode: 'chinese_cinema', industryName: 'Chinese Cinema & C-Drama' };
  }

  // Indian Regional Cinemas
  if (countries.includes('IN') || ['hi', 'te', 'ta', 'ml', 'kn', 'bn', 'mr', 'pa', 'gu'].includes(lang)) {
    switch (lang) {
      case 'te':
        return { industryCode: 'tollywood', industryName: 'Tollywood' };
      case 'ta':
        return { industryCode: 'kollywood', industryName: 'Kollywood' };
      case 'ml':
        return { industryCode: 'mollywood', industryName: 'Mollywood' };
      case 'kn':
        return { industryCode: 'sandalwood', industryName: 'Sandalwood' };
      case 'bn':
        return { industryCode: 'bengali_cinema', industryName: 'Bengali Cinema' };
      case 'mr':
        return { industryCode: 'marathi_cinema', industryName: 'Marathi Cinema' };
      case 'pa':
        return { industryCode: 'punjabi_cinema', industryName: 'Pollywood' };
      case 'hi':
      default:
        return { industryCode: 'bollywood', industryName: 'Bollywood' };
    }
  }

  // Hollywood / Western Cinema
  if (lang === 'en' || countries.includes('US') || countries.includes('GB') || countries.includes('CA') || countries.includes('AU')) {
    return { industryCode: 'hollywood', industryName: 'Hollywood' };
  }

  // Generic fallback
  return { industryCode: 'global_cinema', industryName: 'Global Cinema' };
}

// Standardize Genre Names across TMDB / AniList / etc.
export function normalizeGenre(name: string): string {
  const clean = name.trim();
  const lower = clean.toLowerCase();

  if (lower === 'sci-fi & fantasy' || lower === 'science fiction') return 'Science Fiction';
  if (lower === 'action & adventure') return 'Action';
  if (lower === 'war & politics') return 'War';
  if (lower === 'kids') return 'Family';
  return clean;
}

// Normalize TMDB status to ContentStatus
export function normalizeContentStatus(rawStatus?: string | null): ContentStatus {
  if (!rawStatus) return 'Released';
  const s = rawStatus.toLowerCase();
  if (s.includes('post') || s.includes('production') || s.includes('in production')) return 'In Production';
  if (s.includes('plan') || s.includes('rumored')) return 'Planned';
  if (s.includes('return') || s.includes('ongoing')) return 'Ongoing';
  if (s.includes('end') || s.includes('released')) return 'Released';
  if (s.includes('complete')) return 'Completed';
  if (s.includes('cancel')) return 'Cancelled';
  if (s.includes('hiatus') || s.includes('pause')) return 'Hiatus';
  return 'Released';
}

// Transform TMDB Movie or TV Response to standard ContentItem
export function normalizeTmdbItem(
  raw: any,
  mediaType: 'movie' | 'tv',
  imageBaseUrl: string = 'https://image.tmdb.org/t/p'
): ContentItem {
  const isMovie = mediaType === 'movie';
  const title = isMovie ? raw.title || raw.original_title : raw.name || raw.original_name;
  const originalTitle = isMovie ? raw.original_title : raw.original_name;
  const releaseDate = isMovie ? raw.release_date : raw.first_air_date;
  const year = releaseDate ? new Date(releaseDate).getFullYear() : null;

  // Extract genre strings
  const genreList: string[] = (raw.genres || raw.genre_ids || [])
    .map((g: any) => (typeof g === 'object' ? g.name : null))
    .filter(Boolean)
    .map(normalizeGenre);

  const isAnimation = genreList.some((g) => g.toLowerCase().includes('animation'));

  // Content type classification
  let contentType: ContentType = isMovie ? 'movie' : 'tv_series';
  const lang = (raw.original_language || '').toLowerCase();
  const countries: string[] = raw.origin_country || (raw.production_countries || []).map((c: any) => c.iso_3166_1);

  if (!isMovie) {
    if ((lang === 'ja' || countries.includes('JP')) && isAnimation) {
      contentType = 'anime';
    } else if (lang === 'ko' || lang === 'ja' || lang === 'zh' || countries.includes('KR') || countries.includes('JP') || countries.includes('CN')) {
      contentType = 'drama';
    } else if ((raw.networks || []).some((n: any) => ['Netflix', 'Amazon', 'Disney+', 'Apple TV+', 'Hulu', 'SonyLIV', 'ZEE5', 'JioCinema', 'Hotstar'].some(net => n.name?.includes(net)))) {
      contentType = 'web_series';
    }
  }

  // Detect Industry
  const { industryCode, industryName } = detectIndustry(lang, countries, genreList, isAnimation);

  // Poster & Backdrop full CDN URLs
  const posterUrl = raw.poster_path ? `${imageBaseUrl}/w500${raw.poster_path}` : '';
  const backdropUrl = raw.backdrop_path ? `${imageBaseUrl}/original${raw.backdrop_path}` : null;

  // Rating and popularity
  const ratingAverage = typeof raw.vote_average === 'number' ? Math.round(raw.vote_average * 10) / 10 : null;
  const ratingCount = raw.vote_count || 0;
  const popularity = typeof raw.popularity === 'number' ? Math.round(raw.popularity * 10) / 10 : 0;

  // Runtime
  let runtime: number | null = null;
  if (isMovie && raw.runtime) {
    runtime = raw.runtime;
  } else if (!isMovie && Array.isArray(raw.episode_run_time) && raw.episode_run_time.length > 0) {
    runtime = raw.episode_run_time[0];
  }

  // Seasons & Episodes if available
  let seasons: SeasonModel[] | undefined = undefined;
  if (!isMovie && Array.isArray(raw.seasons)) {
    seasons = raw.seasons
      .filter((s: any) => s.season_number > 0) // exclude specials/season 0 by default
      .map((s: any) => ({
        id: `tmdb-season-${raw.id}-${s.season_number}`,
        content_id: `tmdb-${raw.id}`,
        season_number: s.season_number,
        title: s.name || `Season ${s.season_number}`,
        overview: s.overview || null,
        poster_url: s.poster_path ? `${imageBaseUrl}/w500${s.poster_path}` : null,
        air_date: s.air_date || null,
        episode_count: s.episode_count || 0
      }));
  }

  // Collection / Franchise
  const franchiseId = raw.belongs_to_collection ? `tmdb-col-${raw.belongs_to_collection.id}` : null;
  const franchiseName = raw.belongs_to_collection ? raw.belongs_to_collection.name : null;

  // Build Materials Guide items for UI compatibility
  const materials: any[] = [];
  if (isMovie) {
    materials.push({
      id: `mat-main-${raw.id}`,
      external_id: `main-${raw.id}`,
      type: 'Movie',
      title: `${title || 'Feature Film'} (Main Feature)`,
      number: runtime ? `${runtime} mins` : 'Feature Film',
      release_date: releaseDate || undefined
    });
  } else if (seasons && seasons.length > 0) {
    seasons.forEach((s) => {
      materials.push({
        id: `mat-season-${raw.id}-${s.season_number}`,
        external_id: `season-${raw.id}-${s.season_number}`,
        type: contentType === 'anime' ? 'Anime' : 'TV Series',
        title: s.title || `Season ${s.season_number}`,
        number: s.episode_count ? `${s.episode_count} Episodes` : 'Season',
        release_date: s.air_date || undefined
      });
    });
  } else {
    materials.push({
      id: `mat-series-${raw.id}`,
      external_id: `series-${raw.id}`,
      type: contentType === 'anime' ? 'Anime' : 'TV Series',
      title: `${title || 'Original Series'} (Main Series)`,
      number: raw.number_of_episodes ? `${raw.number_of_episodes} Episodes` : 'Full Series',
      release_date: releaseDate || undefined
    });
  }

  // Extract official trailer if videos included
  let trailerUrl: string | null = null;
  if (raw.videos?.results && Array.isArray(raw.videos.results)) {
    const trailer = raw.videos.results.find(
      (v: any) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser')
    );
    if (trailer) {
      trailerUrl = `https://www.youtube.com/watch?v=${trailer.key}`;
    }
  }

  return {
    id: `tmdb-${isMovie ? 'm' : 'tv'}-${raw.id}`,
    content_type: contentType,
    title: title || 'Untitled',
    original_title: originalTitle || null,
    alternative_titles: [],
    overview: raw.overview || '',
    description: raw.overview || '',
    poster_url: posterUrl,
    cover_url: posterUrl,
    backdrop_url: backdropUrl,
    banner_url: backdropUrl,
    trailer_url: trailerUrl,
    release_date: releaseDate || null,
    year: year || null,
    runtime,
    status: normalizeContentStatus(raw.status),
    rating_average: ratingAverage,
    score: ratingAverage ? Math.round(ratingAverage * 10) : undefined,
    rating_count: ratingCount,
    popularity,
    source: 'TMDB',
    external_ids: {
      tmdb_id: raw.id,
      imdb_id: raw.imdb_id || (raw.external_ids ? raw.external_ids.imdb_id : undefined)
    },
    genres: genreList,
    languages: raw.spoken_languages ? raw.spoken_languages.map((l: any) => l.english_name || l.name || l.iso_639_1) : [lang],
    primary_language: lang,
    countries: countries.length > 0 ? countries : undefined,
    industries: [industryName],
    primary_industry: industryCode,
    franchise_id: franchiseId,
    franchise_name: franchiseName,
    seasons_count: raw.number_of_seasons || (seasons ? seasons.length : null),
    episodes_count: raw.number_of_episodes || null,
    seasons,
    materials
  };
}
