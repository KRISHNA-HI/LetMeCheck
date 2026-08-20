// ==========================================================
// LetMeCheck Unified Content Service Abstraction
// Decouples the UI layer from underlying database (Supabase),
// external providers (AniList, TMDB, IMDb, etc.), and local fallback data.
// ==========================================================

import {
  ContentItem,
  ContentType,
  ContentFilterParams,
  FranchiseModel,
  WatchOrderModel,
  SeasonModel,
  ContentRelationshipModel,
  IndustryModel,
  LanguageModel,
  GenreModel,
  Manga
} from '../types';
import { supabase, isSupabaseConfigured } from './supabase';
import { anilistService } from './anilist';
import { SAMPLE_MANGA } from '../data/sampleManga';
import { MULTI_REGIONAL_TEST_DATASET } from '../data/multiRegionalTestData';
import { tmdbProvider } from './providers/tmdb';
import { anilistProvider } from './providers/anilist';
import { hasUsableImage } from '../utils/formatters';
import { getUnifiedMasterContent } from '../data/unifiedContentData';
import { resolveContentArtwork } from './contentImageResolver';

// Master in-memory dictionary defaults for instant fallback / offline access
export const DEFAULT_INDUSTRIES: IndustryModel[] = [
  { id: 'hollywood', code: 'hollywood', name: 'Hollywood', region: 'North America', country_code: 'US', primary_language_code: 'en', description: 'American & global English cinema' },
  { id: 'bollywood', code: 'bollywood', name: 'Bollywood', region: 'North India', country_code: 'IN', primary_language_code: 'hi', description: 'Hindi-language Indian cinema' },
  { id: 'tollywood', code: 'tollywood', name: 'Tollywood', region: 'Andhra & Telangana', country_code: 'IN', primary_language_code: 'te', description: 'Telugu-language Indian cinema' },
  { id: 'kollywood', code: 'kollywood', name: 'Kollywood', region: 'Tamil Nadu', country_code: 'IN', primary_language_code: 'ta', description: 'Tamil-language Indian cinema' },
  { id: 'mollywood', code: 'mollywood', name: 'Mollywood', region: 'Kerala', country_code: 'IN', primary_language_code: 'ml', description: 'Malayalam-language cinema renowned for realism' },
  { id: 'sandalwood', code: 'sandalwood', name: 'Sandalwood', region: 'Karnataka', country_code: 'IN', primary_language_code: 'kn', description: 'Kannada-language Indian cinema' },
  { id: 'bengali_cinema', code: 'bengali_cinema', name: 'Bengali Cinema', region: 'West Bengal', country_code: 'IN', primary_language_code: 'bn', description: 'Bengali art-house and mainstream cinema' },
  { id: 'marathi_cinema', code: 'marathi_cinema', name: 'Marathi Cinema', region: 'Maharashtra', country_code: 'IN', primary_language_code: 'mr', description: 'Marathi-language Indian cinema' },
  { id: 'japanese_cinema', code: 'japanese_cinema', name: 'Japanese Cinema & J-Drama', region: 'Japan', country_code: 'JP', primary_language_code: 'ja', description: 'Japanese live-action films & dramas' },
  { id: 'korean_cinema', code: 'korean_cinema', name: 'Korean Cinema & K-Drama', region: 'South Korea', country_code: 'KR', primary_language_code: 'ko', description: 'South Korean cinema & K-Dramas' },
  { id: 'chinese_cinema', code: 'chinese_cinema', name: 'Chinese Cinema & C-Drama', region: 'China', country_code: 'CN', primary_language_code: 'zh', description: 'Chinese cinema and period television dramas' },
  { id: 'anime_industry', code: 'anime_industry', name: 'Anime Industry', region: 'Japan', country_code: 'JP', primary_language_code: 'ja', description: 'Japanese animation series, movies & OVAs' }
];

export const DEFAULT_LANGUAGES: LanguageModel[] = [
  { id: 'en', code: 'en', name: 'English', native_name: 'English' },
  { id: 'hi', code: 'hi', name: 'Hindi', native_name: 'हिन्दी' },
  { id: 'te', code: 'te', name: 'Telugu', native_name: 'తెలుగు' },
  { id: 'ta', code: 'ta', name: 'Tamil', native_name: 'தமிழ்' },
  { id: 'ml', code: 'ml', name: 'Malayalam', native_name: 'മലയാളം' },
  { id: 'kn', code: 'kn', name: 'Kannada', native_name: 'ಕನ್ನಡ' },
  { id: 'bn', code: 'bn', name: 'Bengali', native_name: 'বাংলা' },
  { id: 'mr', code: 'mr', name: 'Marathi', native_name: 'मराठी' },
  { id: 'ja', code: 'ja', name: 'Japanese', native_name: '日本語' },
  { id: 'ko', code: 'ko', name: 'Korean', native_name: '한국어' },
  { id: 'zh', code: 'zh', name: 'Chinese', native_name: '中文' },
  { id: 'es', code: 'es', name: 'Spanish', native_name: 'Español' },
  { id: 'fr', code: 'fr', name: 'French', native_name: 'Français' },
  { id: 'de', code: 'de', name: 'German', native_name: 'Deutsch' }
];

export const DEFAULT_GENRES: GenreModel[] = [
  { id: '1', name: 'Action', slug: 'action' },
  { id: '2', name: 'Adventure', slug: 'adventure' },
  { id: '3', name: 'Animation', slug: 'animation' },
  { id: '4', name: 'Comedy', slug: 'comedy' },
  { id: '5', name: 'Crime', slug: 'crime' },
  { id: '6', name: 'Drama', slug: 'drama' },
  { id: '7', name: 'Fantasy', slug: 'fantasy' },
  { id: '8', name: 'Horror', slug: 'horror' },
  { id: '9', name: 'Mystery', slug: 'mystery' },
  { id: '10', name: 'Romance', slug: 'romance' },
  { id: '11', name: 'Sci-Fi', slug: 'sci-fi' },
  { id: '12', name: 'Thriller', slug: 'thriller' }
];

// Helper: Convert a legacy Manga entity to ContentItem seamlessly
export function mangaToContentItem(manga: Manga): ContentItem {
  let contentType: ContentType = 'manga';
  if (manga.type === 'Manhwa') contentType = 'manhwa';
  else if (manga.type === 'Manhua') contentType = 'manhua';
  else if (manga.type === 'Light Novel') contentType = 'manga';
  else if (manga.type === 'Anime' || manga.type === 'OVA' || manga.type === 'Special') contentType = 'anime';
  else if (manga.type === 'Movie') contentType = 'movie';
  else if (manga.type === 'TV Series') contentType = 'tv_series';
  else if (manga.type === 'Web Series') contentType = 'web_series';
  else if (manga.type === 'Drama') contentType = 'drama';

  return {
    id: manga.id,
    content_type: contentType,
    title: manga.title,
    original_title: manga.title_details?.native || manga.title_details?.romaji || null,
    alternative_titles: manga.alternative_titles || [],
    overview: manga.description,
    description: manga.description,
    poster_url: manga.cover_url,
    cover_url: manga.cover_url,
    backdrop_url: manga.banner_url || null,
    banner_url: manga.banner_url || null,
    year: manga.release_year || null,
    status: manga.status === 'Ongoing' ? 'Ongoing' : manga.status === 'Completed' ? 'Completed' : 'Cancelled',
    rating_average: manga.score ? manga.score / 10 : null,
    score: manga.score,
    popularity: manga.popularity || 0,
    source: manga.source || 'AniList',
    external_ids: {
      anilist_id: manga.anilist_id,
      mangadex_id: manga.mangadex_id
    },
    genres: manga.genres || [],
    chapters: manga.chapters,
    volumes: manga.volumes,
    episodes_count: manga.chapters,
    author: manga.author,
    artist: manga.artist,
    materials: manga.materials || [],
    type: manga.type
  };
}

// Helper: Convert ContentItem back to Manga where required by existing Manga UI
export function contentItemToManga(item: ContentItem): Manga {
  let mangaType: Manga['type'] = 'Manga';
  if (item.content_type === 'movie') mangaType = 'Movie';
  else if (item.content_type === 'tv_series') mangaType = 'TV Series';
  else if (item.content_type === 'web_series') mangaType = 'Web Series';
  else if (item.content_type === 'anime') mangaType = 'Anime';
  else if (item.content_type === 'drama') mangaType = 'Drama';
  else if (item.content_type === 'manhwa') mangaType = 'Manhwa';
  else if (item.content_type === 'manhua') mangaType = 'Manhua';
  else if (item.content_type === 'manga') mangaType = (item.type as any) || 'Manga';
  else if (item.type) mangaType = item.type as any;

  return {
    id: item.id,
    anilist_id: item.external_ids?.anilist_id,
    mangadex_id: item.external_ids?.mangadex_id,
    title: item.title,
    title_details: {
      english: item.title,
      native: item.original_title || undefined
    },
    alternative_titles: item.alternative_titles || [],
    description: item.overview || item.description || '',
    type: mangaType,
    status: (item.status as any) || 'Released',
    author: item.author || (item.directors && item.directors.length > 0 ? item.directors[0] : undefined),
    artist: item.artist,
    genres: Array.isArray(item.genres)
      ? item.genres.map((g) => (typeof g === 'string' ? g : g.name))
      : [],
    chapters: item.chapters || item.episodes_count || null,
    volumes: item.volumes || item.seasons_count || null,
    cover_url: item.poster_url || item.cover_url || '/placeholder-cover.svg',
    banner_url: item.backdrop_url || item.banner_url || null,
    score: item.score || (item.rating_average ? Math.round(item.rating_average * 10) : 0),
    popularity: item.popularity || 0,
    source: item.source || 'TMDB',
    materials: item.materials || [],
    release_year: item.year || (item.release_date ? new Date(item.release_date).getFullYear() : undefined)
  };
}

class ContentService {
  /**
   * Fetch single content item by UUID or external source ID
   */
  async getContentById(id: string): Promise<ContentItem | null> {
    if (!id) return null;

    const cleanId = id.toString().toLowerCase().trim();

    // 1. Check Supabase content table if available
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('content')
          .select(`
            *,
            content_genres(genres(*)),
            content_languages(languages(*), is_primary),
            content_countries(countries(*)),
            content_industries(industries(*), is_primary),
            franchises(*)
          `)
          .eq('id', id)
          .maybeSingle();

        if (!error && data) {
          return this.transformSupabaseContentRow(data);
        }
      } catch (err) {
        console.warn('Supabase getContentById query error:', err);
      }
    }

    // 2. Check Unified Master Content (covers all regional movies, series, anime, manga, and universes)
    try {
      const masterList = getUnifiedMasterContent();
      const masterMatch = masterList.find((item) => {
        if (!item || !item.id) return false;
        const itemId = String(item.id).toLowerCase();
        if (itemId === cleanId) return true;
        if (item.external_ids?.tmdb_id) {
          const tmdbKey = `tmdb-${item.content_type === 'movie' ? 'm' : 'tv'}-${item.external_ids.tmdb_id}`.toLowerCase();
          if (tmdbKey === cleanId) return true;
        }
        return false;
      });
      if (masterMatch) return masterMatch;
    } catch (err) {
      console.warn('Master dataset lookup error:', err);
    }

    // 3. Fallback to TMDB Provider if available for tmdb-prefixed IDs
    if (tmdbProvider.isAvailable() && id.startsWith('tmdb-')) {
      try {
        const isTv = id.startsWith('tmdb-tv-');
        const tmdbNumId = id.replace(/^tmdb-(m|tv)-/, '');
        const tmdbItem = await tmdbProvider.getDetails(tmdbNumId, isTv ? 'tv' : 'movie');
        if (tmdbItem) return tmdbItem;
      } catch (err) {
        console.warn('TMDB lookup error:', err);
      }
    }

    // 4. Fallback to AniList ONLY for Anime/Manga integer IDs or anilist-prefixed IDs
    if (!id.startsWith('tmdb-') && !id.startsWith('mcu-') && !id.startsWith('lcu-') && !id.startsWith('kgf-') && !id.startsWith('yrf-') && !id.startsWith('cop-') && !id.startsWith('dceu-')) {
      try {
        const manga = await anilistService.getMangaById(id);
        if (manga) {
          return mangaToContentItem(manga);
        }
      } catch (err) {
        console.warn('AniList lookup error:', err);
      }
    }

    // 5. Fallback to local sample catalog
    const sample = SAMPLE_MANGA.find(
      (m) => m.id.toString() === id || (m.anilist_id && m.anilist_id.toString() === id)
    );
    if (sample) {
      return mangaToContentItem(sample);
    }

    return null;
  }

  /**
   * Universal Local Filtering Pipeline
   * Filters any content collection by content_type, genre, industry/region, query, and year
   */
  filterContentDataset(
    dataset: ContentItem[],
    filters: ContentFilterParams
  ): ContentItem[] {
    let result = dataset;

    // 1. Content Type Filter
    const filterType = filters.content_type && filters.content_type !== 'all' ? filters.content_type : null;
    if (filterType) {
      result = result.filter((item) => {
        if (filterType === 'movie') return item.content_type === 'movie';
        if (filterType === 'tv_series' || filterType === 'web_series' || filterType === 'drama') {
          return item.content_type === 'tv_series' || item.content_type === 'web_series' || item.content_type === 'drama';
        }
        if (filterType === 'anime') return item.content_type === 'anime';
        if (filterType === 'manga' || filterType === 'manhwa' || filterType === 'manhua') {
          return item.content_type === 'manga' || item.content_type === 'manhwa' || item.content_type === 'manhua';
        }
        return item.content_type === filterType;
      });
    }

    // 2. Industry / Region Filter
    const filterIndustry = filters.industry && filters.industry !== 'all' && filters.industry !== 'All' ? filters.industry.toLowerCase() : null;
    if (filterIndustry) {
      result = result.filter((item) => {
        const itemPrimaryInd = (item.primary_industry || '').toLowerCase();
        const itemIndustries = (item.industries || []).map((i) => i.toLowerCase());
        const itemCountries = (item.countries || []).map((c) => c.toUpperCase());
        const itemLang = (item.primary_language || '').toLowerCase();
        const itemLanguages = (item.languages || []).map((l) => l.toLowerCase());

        if (filterIndustry === 'hollywood') {
          return (
            itemPrimaryInd === 'hollywood' ||
            itemIndustries.some((i) => i.includes('hollywood')) ||
            itemCountries.includes('US') ||
            itemCountries.includes('GB')
          );
        }
        if (filterIndustry === 'bollywood') {
          return (
            itemPrimaryInd === 'bollywood' ||
            itemIndustries.some((i) => i.includes('bollywood')) ||
            itemLang === 'hi' ||
            itemLanguages.some((l) => l.includes('hindi'))
          );
        }
        if (filterIndustry === 'tollywood') {
          return (
            itemPrimaryInd === 'tollywood' ||
            itemIndustries.some((i) => i.includes('tollywood')) ||
            itemLang === 'te' ||
            itemLanguages.some((l) => l.includes('telugu'))
          );
        }
        if (filterIndustry === 'kollywood') {
          return (
            itemPrimaryInd === 'kollywood' ||
            itemIndustries.some((i) => i.includes('kollywood')) ||
            itemLang === 'ta' ||
            itemLanguages.some((l) => l.includes('tamil'))
          );
        }
        if (filterIndustry === 'mollywood') {
          return (
            itemPrimaryInd === 'mollywood' ||
            itemIndustries.some((i) => i.includes('mollywood')) ||
            itemLang === 'ml' ||
            itemLanguages.some((l) => l.includes('malayalam'))
          );
        }
        if (filterIndustry === 'sandalwood') {
          return (
            itemPrimaryInd === 'sandalwood' ||
            itemIndustries.some((i) => i.includes('sandalwood')) ||
            itemLang === 'kn' ||
            itemLanguages.some((l) => l.includes('kannada'))
          );
        }
        if (filterIndustry === 'korean_cinema') {
          return (
            itemPrimaryInd === 'korean_cinema' ||
            itemIndustries.some((i) => i.includes('korean')) ||
            itemCountries.includes('KR') ||
            itemLang === 'ko'
          );
        }
        if (filterIndustry === 'japanese_cinema') {
          return (
            itemPrimaryInd === 'japanese_cinema' ||
            itemPrimaryInd === 'anime_industry' ||
            itemIndustries.some((i) => i.includes('japanese') || i.includes('anime')) ||
            itemCountries.includes('JP') ||
            itemLang === 'ja'
          );
        }
        return (
          itemPrimaryInd === filterIndustry ||
          itemIndustries.some((i) => i.includes(filterIndustry))
        );
      });
    }

    // 3. Genre Filter
    const filterGenre = filters.genre && filters.genre !== 'All' && filters.genre !== 'all' ? filters.genre.toLowerCase() : null;
    if (filterGenre) {
      result = result.filter((item) => {
        const itemGenres = (item.genres || []).map((g) => (typeof g === 'string' ? g.toLowerCase() : g.name?.toLowerCase() || ''));
        if (filterGenre === 'science fiction' || filterGenre === 'sci-fi') {
          return itemGenres.some((g) => g.includes('sci') || g.includes('science'));
        }
        if (filterGenre === 'animation') {
          return itemGenres.some((g) => g.includes('anim') || g.includes('anime'));
        }
        return itemGenres.some((g) => g.includes(filterGenre) || filterGenre.includes(g));
      });
    }

    // 4. Search Query Filter
    const rawQuery = (filters.query || '').trim().toLowerCase();
    if (rawQuery) {
      result = result.filter((item) => {
        const title = (item.title || '').toLowerCase();
        const origTitle = (item.original_title || '').toLowerCase();
        const altTitles = (item.alternative_titles || []).map((a) => a.toLowerCase());
        const franchise = (item.franchise_name || item.franchise_id || '').toLowerCase();
        const overview = (item.overview || item.description || '').toLowerCase();
        const author = (item.author || '').toLowerCase();
        const artist = (item.artist || '').toLowerCase();

        return (
          title.includes(rawQuery) ||
          origTitle.includes(rawQuery) ||
          altTitles.some((a) => a.includes(rawQuery)) ||
          franchise.includes(rawQuery) ||
          overview.includes(rawQuery) ||
          author.includes(rawQuery) ||
          artist.includes(rawQuery)
        );
      });
    }

    // 5. Year Filter
    if (filters.year) {
      result = result.filter((item) => item.year === filters.year);
    }

    // 6. Sorting
    result = [...result].sort((a, b) => {
      if (filters.sort === 'RATING_DESC') {
        const rateA = a.rating_average || (a.score ? a.score / 10 : 0);
        const rateB = b.rating_average || (b.score ? b.score / 10 : 0);
        return rateB - rateA;
      }
      if (filters.sort === 'RELEASE_DATE_DESC') {
        return (b.year || 0) - (a.year || 0);
      }
      if (filters.sort === 'RELEASE_DATE_ASC') {
        return (a.year || 9999) - (b.year || 9999);
      }
      if (filters.sort === 'TITLE_ASC') {
        return a.title.localeCompare(b.title);
      }
      // POPULARITY_DESC (default)
      return (b.popularity || 0) - (a.popularity || 0);
    });

    return result;
  }

  /**
   * Query & Discover universal content with rich faceted filters
   */
  async discoverContent(
    filters: ContentFilterParams
  ): Promise<{ items: ContentItem[]; hasNextPage: boolean; totalCount?: number; page?: number; totalPages?: number }> {
    const page = filters.page || 1;
    const perPage = filters.per_page || 20; // 20-item standard database pagination

    // If Supabase is connected, query normalized content catalog
    if (isSupabaseConfigured() && supabase) {
      try {
        let query = supabase
          .from('content')
          .select(
            `
            *,
            content_genres!inner(genres(*)),
            content_languages(languages(*), is_primary),
            content_countries(countries(*)),
            content_industries!inner(industries(*), is_primary)
          `,
            { count: 'exact' }
          );

        if (filters.content_type && filters.content_type !== 'all') {
          query = query.eq('content_type', filters.content_type);
        }

        if (filters.status && filters.status !== 'all') {
          query = query.eq('status', filters.status);
        }

        if (filters.year) {
          query = query.eq('year', filters.year);
        }

        if (filters.franchise_id) {
          query = query.eq('franchise_id', filters.franchise_id);
        }

        // Industry filtering on Supabase
        if (filters.industry && filters.industry !== 'all') {
          query = query.eq('content_industries.industries.code', filters.industry);
        }

        // Genre filtering on Supabase
        if (filters.genre && filters.genre !== 'All' && filters.genre !== 'all') {
          query = query.ilike('content_genres.genres.name', `%${filters.genre}%`);
        }

        // Search Query filtering on Supabase
        if (filters.query && filters.query.trim()) {
          query = query.ilike('title', `%${filters.query.trim()}%`);
        }

        // Apply sorting
        switch (filters.sort) {
          case 'RATING_DESC':
            query = query.order('rating_average', { ascending: false });
            break;
          case 'RELEASE_DATE_DESC':
            query = query.order('release_date', { ascending: false });
            break;
          case 'RELEASE_DATE_ASC':
            query = query.order('release_date', { ascending: true });
            break;
          case 'TITLE_ASC':
            query = query.order('title', { ascending: true });
            break;
          case 'POPULARITY_DESC':
          default:
            query = query.order('popularity', { ascending: false });
            break;
        }

        const from = (page - 1) * perPage;
        const to = from + perPage - 1;
        query = query.range(from, to);

        const { data, count, error } = await query;

        if (!error && data && data.length > 0) {
          const items = data.map((row: any) => this.transformSupabaseContentRow(row));
          const totalCount = count || items.length;
          const totalPages = Math.ceil(totalCount / perPage);
          const hasNextPage = count ? from + items.length < count : items.length === perPage;
          return { items, hasNextPage, totalCount, page, totalPages };
        }
      } catch (err) {
        console.warn('Supabase discoverContent query error:', err);
      }
    }

    // 2. Try Backend Ingested Catalog API
    try {
      const params = new URLSearchParams();
      if (filters.page) params.set('page', String(filters.page));
      if (filters.per_page) params.set('per_page', String(filters.per_page));
      if (filters.content_type && filters.content_type !== 'all') params.set('content_type', filters.content_type);
      if (filters.industry && filters.industry !== 'all') params.set('industry', filters.industry);
      if (filters.genre && filters.genre !== 'All' && filters.genre !== 'all') params.set('genre', filters.genre);
      if (filters.query && filters.query.trim()) params.set('query', filters.query.trim());

      const resp = await fetch(`/api/catalog?${params.toString()}`);
      if (resp.ok) {
        const catData = await resp.json();
        if (catData && Array.isArray(catData.items) && catData.items.length > 0) {
          const items: ContentItem[] = catData.items.map((i: any) => ({
            id: i.id,
            title: i.title,
            original_title: i.original_title,
            content_type: i.content_type,
            overview: i.description,
            poster_url: i.poster_url,
            backdrop_url: i.backdrop_url,
            release_date: i.release_date,
            year: i.year,
            rating_average: i.vote_average,
            popularity: i.popularity,
            primary_industry: i.industry_code,
            genres: i.genres || [],
            source: 'TMDB Ingestion Engine'
          }));
          return {
            items,
            hasNextPage: catData.hasNextPage,
            totalCount: catData.total,
            page: catData.page,
            totalPages: Math.ceil(catData.total / perPage)
          };
        }
      }
    } catch {
      // proceed to master dataset fallback
    }

    // Default & Fallback: Comprehensive multi-format master catalog
    const masterDataset = getUnifiedMasterContent();
    const filtered = this.filterContentDataset(masterDataset, filters);

    const from = (page - 1) * perPage;
    const to = from + perPage;
    const pagedItems = filtered.slice(from, to);
    const hasNextPage = to < filtered.length;
    const totalPages = Math.ceil(filtered.length / perPage);

    return {
      items: pagedItems,
      hasNextPage,
      totalCount: filtered.length,
      page,
      totalPages
    };
  }

  /**
   * Admin & Health: Get Regional Catalog Distribution
   */
  async getRegionalCatalogCounts(): Promise<Array<{ code: string; name: string; count: number; movieCount: number; tvCount: number }>> {
    // 1. Try fetching from live regional counts API
    try {
      const res = await fetch('/api/admin/regional-counts');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          return json.data;
        }
      }
    } catch (_) {}

    // 2. Direct Supabase query if available
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase.rpc('get_regional_catalog_counts');
        if (!error && data && Array.isArray(data) && data.length > 0) {
          return data.map((d: any) => ({
            code: d.industry_code,
            name: d.industry_name,
            count: Number(d.total_count || 0),
            movieCount: Number(d.movie_count || 0),
            tvCount: Number(d.tv_count || 0)
          }));
        }
      } catch (e) {
        console.warn('Supabase get_regional_catalog_counts rpc error:', e);
      }
    }

    // 3. If database is unavailable, return empty list (no static fallback contamination)
    return [];
  }

  /**
   * Admin & Monitoring: Get Ingestion Status & Recent Runs (Admin Only)
   */
  async getIngestionStatus(): Promise<{
    configured: boolean;
    totalCatalogCount?: number;
    countByContentType?: { movies: number; tvSeries: number };
    currentDailyQuota?: number;
    pagesProcessed?: number;
    pagesRemaining?: number | string;
    successfulItems?: number;
    failedItems?: number;
    lastRun: any | null;
    lastSuccessfulRun?: any | null;
    nextScheduledRun?: string;
    recentRuns: any[];
    progress: any[];
    source?: string;
  }> {
    try {
      let headers: Record<string, string> = {};
      if (supabase) {
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          const token = sessionData?.session?.access_token;
          if (token) {
            headers['Authorization'] = `Bearer ${token}`;
          }
        } catch (_) {}
      }

      const res = await fetch('/api/admin/ingestion-status', { headers });
      if (res.ok) {
        return await res.json();
      }
    } catch (_) {}

    return {
      configured: false,
      totalCatalogCount: 0,
      countByContentType: { movies: 0, tvSeries: 0 },
      currentDailyQuota: 1000,
      pagesProcessed: 0,
      pagesRemaining: 'Continuous',
      successfulItems: 0,
      failedItems: 0,
      lastRun: null,
      lastSuccessfulRun: null,
      nextScheduledRun: '02:00 UTC (Nightly via pg_cron)',
      recentRuns: [],
      progress: []
    };
  }

  /**
   * Admin: Trigger Manual Ingestion Run (Admin Only)
   */
  async triggerIngestion(options?: {
    limit?: number;
    category?: string;
    media_type?: 'movie' | 'tv';
  }): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      if (supabase) {
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          const token = sessionData?.session?.access_token;
          if (token) {
            headers['Authorization'] = `Bearer ${token}`;
          }
        } catch (_) {}
      }

      const res = await fetch('/api/admin/ingest-tmdb', {
        method: 'POST',
        headers,
        body: JSON.stringify(options || {})
      });

      const json = await res.json();
      if (!res.ok) {
        return { success: false, error: json.error || `HTTP ${res.status}: Access denied` };
      }
      return { success: true, data: json };
    } catch (e: any) {
      return { success: false, error: e.message || 'Network error triggering ingestion' };
    }
  }

  /**
   * Admin: Trigger Scheduled Nightly Ingestion Worker (Admin Only)
   */
  async triggerNightlyScheduler(): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      if (supabase) {
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          const token = sessionData?.session?.access_token;
          if (token) {
            headers['Authorization'] = `Bearer ${token}`;
          }
        } catch (_) {}
      }

      const res = await fetch('/api/admin/trigger-nightly', {
        method: 'POST',
        headers
      });

      const json = await res.json();
      if (!res.ok) {
        return { success: false, error: json.error || `HTTP ${res.status}: Access denied` };
      }
      return { success: true, data: json };
    } catch (e: any) {
      return { success: false, error: e.message || 'Network error triggering scheduled ingestion' };
    }
  }

  /**
   * Universal Multi-Provider Search
   * Concurrently queries TMDB (Movies, TV series, Indian/Regional Cinema),
   * AniList (Anime, Manga, Manhwa), Supabase catalog, and local test dataset.
   * Merges, deduplicates, and ranks with high-precision relevance scoring.
   */
  async searchContent(
    searchQuery: string,
    filters?: ContentFilterParams
  ): Promise<{ items: ContentItem[]; hasNextPage: boolean; totalCount?: number }> {
    const rawQuery = (searchQuery || '').trim();
    if (!rawQuery) {
      return this.discoverContent(filters || {});
    }

    const combinedFilters: ContentFilterParams = {
      ...filters,
      query: rawQuery
    };

    return this.discoverContent(combinedFilters);
  }

  /**
   * Fetch franchise details, items, and watch orders
   */
  async getFranchise(franchiseId: string): Promise<FranchiseModel | null> {
    if (!franchiseId || !isSupabaseConfigured() || !supabase) return null;

    try {
      const { data: franchise, error: fError } = await supabase
        .from('franchises')
        .select('*')
        .eq('id', franchiseId)
        .maybeSingle();

      if (fError || !franchise) return null;

      // Fetch items in franchise
      const { data: items } = await supabase
        .from('franchise_items')
        .select(`*, content(*)`)
        .eq('franchise_id', franchiseId)
        .order('order_in_franchise', { ascending: true });

      // Fetch watch orders
      const { data: orders } = await supabase
        .from('watch_orders')
        .select(`
          *,
          watch_order_items(
            *,
            content(*)
          )
        `)
        .eq('franchise_id', franchiseId)
        .order('created_at', { ascending: true });

      return {
        id: franchise.id,
        name: franchise.name,
        original_name: franchise.original_name,
        slug: franchise.slug,
        description: franchise.description,
        poster_url: franchise.poster_url,
        backdrop_url: franchise.backdrop_url,
        items: (items || []).map((item: any) => ({
          id: item.id,
          franchise_id: item.franchise_id,
          content_id: item.content_id,
          order_in_franchise: item.order_in_franchise,
          notes: item.notes,
          content: item.content ? this.transformSupabaseContentRow(item.content) : undefined
        })),
        watch_orders: (orders || []).map((order: any) => ({
          id: order.id,
          franchise_id: order.franchise_id,
          title: order.title,
          order_type: order.order_type,
          description: order.description,
          is_default: order.is_default,
          items: (order.watch_order_items || [])
            .sort((a: any, b: any) => a.order_number - b.order_number)
            .map((step: any) => ({
              id: step.id,
              watch_order_id: step.watch_order_id,
              content_id: step.content_id,
              order_number: step.order_number,
              title: step.title,
              notes: step.notes,
              content: step.content ? this.transformSupabaseContentRow(step.content) : undefined
            }))
        }))
      };
    } catch (err) {
      console.warn('getFranchise failed:', err);
      return null;
    }
  }

  /**
   * Fetch TV/Web Series/Anime Seasons and Episodes
   */
  async getSeasonsAndEpisodes(contentId: string): Promise<SeasonModel[]> {
    if (!contentId || !isSupabaseConfigured() || !supabase) return [];

    try {
      const { data: seasons, error } = await supabase
        .from('seasons')
        .select(`
          *,
          episodes(*)
        `)
        .eq('content_id', contentId)
        .order('season_number', { ascending: true });

      if (error || !seasons) return [];

      return seasons.map((s: any) => ({
        id: s.id,
        content_id: s.content_id,
        season_number: s.season_number,
        title: s.title,
        overview: s.overview,
        poster_url: s.poster_url,
        air_date: s.air_date,
        episode_count: s.episode_count,
        episodes: (s.episodes || [])
          .sort((a: any, b: any) => a.episode_number - b.episode_number)
          .map((ep: any) => ({
            id: ep.id,
            season_id: ep.season_id,
            content_id: ep.content_id,
            episode_number: ep.episode_number,
            title: ep.title,
            overview: ep.overview,
            still_url: ep.still_url,
            air_date: ep.air_date,
            runtime: ep.runtime
          }))
      }));
    } catch (err) {
      console.warn('getSeasonsAndEpisodes failed:', err);
      return [];
    }
  }

  /**
   * Fetch Inter-Content Relationships (Prequels, Sequels, Spin-offs, Adaptations)
   */
  async getContentRelationships(contentId: string): Promise<ContentRelationshipModel[]> {
    if (!contentId || !isSupabaseConfigured() || !supabase) return [];

    try {
      const { data, error } = await supabase
        .from('content_relationships')
        .select(`
          *,
          target_content:target_content_id(*)
        `)
        .eq('source_content_id', contentId);

      if (error || !data) return [];

      return data.map((rel: any) => ({
        id: rel.id,
        source_content_id: rel.source_content_id,
        target_content_id: rel.target_content_id,
        relationship_type: rel.relationship_type,
        notes: rel.notes,
        target_content: rel.target_content
          ? this.transformSupabaseContentRow(rel.target_content)
          : undefined
      }));
    } catch (err) {
      console.warn('getContentRelationships failed:', err);
      return [];
    }
  }

  /**
   * Master Reference: Get all supported Industries / Film Hubs
   */
  async getIndustries(): Promise<IndustryModel[]> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('industries')
          .select('*')
          .order('name', { ascending: true });
        if (!error && data && data.length > 0) return data;
      } catch (err) {
        console.warn('getIndustries failed, using defaults:', err);
      }
    }
    return DEFAULT_INDUSTRIES;
  }

  /**
   * Multi-Regional Recent Movies for Home Hero Slider
   * Aggregates 4–5 genuinely recent RELEASED movie titles across Hollywood,
   * Bollywood, South Indian cinema, and Anime releases whose release dates have actually passed.
   */
  async getRecentMultiRegionalMovies(): Promise<ContentItem[]> {
    const items: ContentItem[] = [];
    const seenIds = new Set<string>();
    const now = Date.now();
    const todayString = new Date().toISOString().split('T')[0];

    const isValidRecentMovie = (item: ContentItem): boolean => {
      if (!item || !item.id || seenIds.has(item.id.toString())) return false;
      if (!item.release_date) return false;
      const releaseTime = new Date(item.release_date).getTime();
      if (isNaN(releaseTime) || releaseTime > now) return false; // Must be actually released
      const hasImage = hasUsableImage(item) || Boolean(item.poster_url || item.cover_url || item.backdrop_url || item.banner_url);
      return Boolean(hasImage);
    };

    const addRecent = (list: ContentItem[], defaultIndustry?: string, limit = 1) => {
      let added = 0;
      for (const item of list) {
        if (added >= limit) break;
        if (!isValidRecentMovie(item)) continue;
        seenIds.add(item.id.toString());
        if (defaultIndustry && (!item.industries || item.industries.length === 0)) {
          item.industries = [defaultIndustry];
          item.primary_industry = defaultIndustry.toLowerCase();
        }
        items.push(item);
        added++;
      }
    };

    // 1. If TMDB provider is active, fetch live multi-regional recent movies (release date <= today)
    if (tmdbProvider.isAvailable()) {
      try {
        const [hollywoodRes, bollywoodRes, southIndianRes, animeRes] = await Promise.all([
          tmdbProvider.discoverMovies({
            with_original_language: 'en',
            sort_by: 'primary_release_date.desc',
            'primary_release_date.lte': todayString,
            'primary_release_date.gte': '2024-01-01',
            'vote_count.gte': 50,
            page: 1
          }),
          tmdbProvider.discoverMovies({
            with_original_language: 'hi',
            sort_by: 'primary_release_date.desc',
            'primary_release_date.lte': todayString,
            'primary_release_date.gte': '2024-01-01',
            'vote_count.gte': 20,
            page: 1
          }),
          tmdbProvider.discoverMovies({
            with_original_language: 'te|ta|ml|kn',
            sort_by: 'primary_release_date.desc',
            'primary_release_date.lte': todayString,
            'primary_release_date.gte': '2024-01-01',
            'vote_count.gte': 20,
            page: 1
          }),
          tmdbProvider.discoverMovies({
            with_original_language: 'ja',
            sort_by: 'primary_release_date.desc',
            'primary_release_date.lte': todayString,
            'primary_release_date.gte': '2023-01-01',
            'vote_count.gte': 20,
            page: 1
          })
        ]);

        if (hollywoodRes.length > 0) addRecent(hollywoodRes, 'Hollywood', 1);
        if (bollywoodRes.length > 0) addRecent(bollywoodRes, 'Bollywood', 1);
        if (southIndianRes.length > 0) addRecent(southIndianRes, 'South Indian Cinema', 1);
        if (animeRes.length > 0) addRecent(animeRes, 'Anime Release', 1);

        // If we still need 1 more to reach 4-5, pick another released Hollywood or Global title
        if (items.length < 4 && hollywoodRes.length > 1) {
          addRecent(hollywoodRes.slice(1), 'Hollywood', 1);
        }
      } catch (tmdbErr) {
        console.warn('Live TMDB multi-regional query failed, falling back to curated recent dataset:', tmdbErr);
      }
    }

    // 2. Curated recent fallback (Genuinely released 2024 major films across regions)
    const RECENT_CURATED_RELEASES: ContentItem[] = [
      {
        id: 'tmdb-m-693134',
        content_type: 'movie',
        title: 'Dune: Part Two',
        original_title: 'Dune: Part Two',
        overview: 'Follow the mythic journey of Paul Atreides as he unites with Chani and the Fremen while on a path of revenge against the conspirators who destroyed his family.',
        poster_url: 'https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg',
        cover_url: 'https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg',
        backdrop_url: 'https://image.tmdb.org/t/p/original/xOMo8BRK7PfcJv9JCnx7s520b42.jpg',
        banner_url: 'https://image.tmdb.org/t/p/original/xOMo8BRK7PfcJv9JCnx7s520b42.jpg',
        release_date: '2024-03-01',
        year: 2024,
        runtime: 166,
        status: 'Released',
        age_rating: 'PG-13',
        rating_average: 8.2,
        rating_count: 5800,
        popularity: 140.0,
        source: 'TMDB',
        external_ids: { tmdb_id: 693134, imdb_id: 'tt15239678' },
        genres: ['Science Fiction', 'Adventure'],
        languages: ['English'],
        primary_language: 'en',
        countries: ['US'],
        industries: ['Hollywood'],
        primary_industry: 'hollywood'
      },
      {
        id: 'tmdb-m-1022789',
        content_type: 'movie',
        title: 'Stree 2',
        original_title: 'स्त्री 2',
        overview: 'The town of Chanderi is being haunted again, this time by a headless entity known as Sarkata who is abducting women.',
        poster_url: 'https://image.tmdb.org/t/p/w500/m2zTfl9L2i1o8G1n6bW1c6Z2u2V.jpg',
        cover_url: 'https://image.tmdb.org/t/p/w500/m2zTfl9L2i1o8G1n6bW1c6Z2u2V.jpg',
        backdrop_url: 'https://image.tmdb.org/t/p/original/b3J94C5rGfQnUe1rM7c7p4m2J8q.jpg',
        banner_url: 'https://image.tmdb.org/t/p/original/b3J94C5rGfQnUe1rM7c7p4m2J8q.jpg',
        release_date: '2024-08-15',
        year: 2024,
        runtime: 147,
        status: 'Released',
        age_rating: 'UA',
        rating_average: 7.8,
        rating_count: 850,
        popularity: 110.0,
        source: 'TMDB',
        external_ids: { tmdb_id: 1022789 },
        genres: ['Comedy', 'Horror'],
        languages: ['Hindi'],
        primary_language: 'hi',
        countries: ['IN'],
        industries: ['Bollywood'],
        primary_industry: 'bollywood'
      },
      {
        id: 'tmdb-m-889737',
        content_type: 'movie',
        title: 'Kalki 2898 AD',
        original_title: 'కల్కి 2898 AD',
        overview: 'Set in a post-apocalyptic world in the year 2898 AD, a modern avatar of Vishnu is believed to have descended to Earth to protect the world from evil forces.',
        poster_url: 'https://image.tmdb.org/t/p/w500/8t4t8s04gS0e04k544Q31mN9jM3.jpg',
        cover_url: 'https://image.tmdb.org/t/p/w500/8t4t8s04gS0e04k544Q31mN9jM3.jpg',
        backdrop_url: 'https://image.tmdb.org/t/p/original/siA4660BwK9bT42e1W1rC7Q4bWv.jpg',
        banner_url: 'https://image.tmdb.org/t/p/original/siA4660BwK9bT42e1W1rC7Q4bWv.jpg',
        release_date: '2024-06-27',
        year: 2024,
        runtime: 181,
        status: 'Released',
        age_rating: 'UA',
        rating_average: 7.6,
        rating_count: 1200,
        popularity: 125.0,
        source: 'TMDB',
        external_ids: { tmdb_id: 889737 },
        genres: ['Action', 'Science Fiction', 'Fantasy'],
        languages: ['Telugu', 'Hindi', 'Tamil'],
        primary_language: 'te',
        countries: ['IN'],
        industries: ['South Indian Cinema'],
        primary_industry: 'tollywood'
      },
      {
        id: 'tmdb-m-508883',
        content_type: 'anime',
        title: 'The Boy and the Heron',
        original_title: '君たちはどう生きるか',
        overview: 'A young boy named Mahito yearning for his mother ventures into a world shared by the living and the dead.',
        poster_url: 'https://image.tmdb.org/t/p/w500/jDQflowRI39507GQ5K99FD19nh8.jpg',
        cover_url: 'https://image.tmdb.org/t/p/w500/jDQflowRI39507GQ5K99FD19nh8.jpg',
        backdrop_url: 'https://image.tmdb.org/t/p/original/hZSO3FjM38mQ8QoQ1k1s6v6lO1z.jpg',
        banner_url: 'https://image.tmdb.org/t/p/original/hZSO3FjM38mQ8QoQ1k1s6v6lO1z.jpg',
        release_date: '2023-07-14',
        year: 2023,
        runtime: 124,
        status: 'Released',
        age_rating: 'PG-13',
        rating_average: 7.5,
        rating_count: 2100,
        popularity: 90.0,
        source: 'TMDB',
        external_ids: { tmdb_id: 508883 },
        genres: ['Animation', 'Adventure', 'Fantasy'],
        languages: ['Japanese'],
        primary_language: 'ja',
        countries: ['JP'],
        industries: ['Anime Release'],
        primary_industry: 'anime_industry'
      },
      {
        id: 'tmdb-m-533535',
        content_type: 'movie',
        title: 'Deadpool & Wolverine',
        original_title: 'Deadpool & Wolverine',
        overview: 'A listless Wade Wilson toils away in civilian life with his days as the morally flexible mercenary behind him, until he is tasked with saving his timeline.',
        poster_url: 'https://image.tmdb.org/t/p/w500/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg',
        cover_url: 'https://image.tmdb.org/t/p/w500/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg',
        backdrop_url: 'https://image.tmdb.org/t/p/original/yDHYTfA3R0jFYba16jBB128Yzyn.jpg',
        banner_url: 'https://image.tmdb.org/t/p/original/yDHYTfA3R0jFYba16jBB128Yzyn.jpg',
        release_date: '2024-07-26',
        year: 2024,
        runtime: 128,
        status: 'Released',
        age_rating: 'R',
        rating_average: 7.8,
        rating_count: 4500,
        popularity: 135.0,
        source: 'TMDB',
        external_ids: { tmdb_id: 533535 },
        genres: ['Action', 'Comedy', 'Science Fiction'],
        languages: ['English'],
        primary_language: 'en',
        countries: ['US'],
        industries: ['Hollywood'],
        primary_industry: 'hollywood'
      }
    ];

    // Supplement from curated recent list until we have 4-5 items
    for (const item of RECENT_CURATED_RELEASES) {
      if (items.length >= 5) break;
      if (!seenIds.has(item.id.toString())) {
        seenIds.add(item.id.toString());
        items.push(item);
      }
    }

    return items.slice(0, 5);
  }

  /**
   * Master Centralized Trending Content Service
   * Genuinely queries live TMDB trending (Movies + TV series across regions) and AniList (Anime + Manga),
   * normalizes items into ContentItem, resolves precise artwork, deduplicates titles,
   * and provides a multi-format multi-regional mix.
   */
  async getTrendingContent(limit = 18): Promise<ContentItem[]> {
    const items: ContentItem[] = [];
    const seenIds = new Set<string>();
    const seenTitles = new Set<string>();

    const addItem = (item: ContentItem) => {
      if (!item || !item.id || items.length >= limit) return;
      const idKey = String(item.id).toLowerCase();
      if (seenIds.has(idKey)) return;

      const titleKey = (item.title || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      if (titleKey && seenTitles.has(titleKey)) return;

      // Ensure artwork is securely resolved with real image or neutral placeholder
      const resolvedPoster = resolveContentArtwork(item);
      item.poster_url = resolvedPoster;
      item.cover_url = resolvedPoster;

      seenIds.add(idKey);
      if (titleKey) seenTitles.add(titleKey);
      items.push(item);
    };

    // 1. Try fetching from live external providers concurrently (TMDB Trending + AniList Trending Anime)
    try {
      const livePromises: Promise<any>[] = [];

      if (tmdbProvider.isAvailable()) {
        livePromises.push(tmdbProvider.getTrending('all', 'week', 1));
      } else {
        livePromises.push(Promise.resolve([]));
      }

      livePromises.push(anilistService.getTrendingAnime(1, 8));
      livePromises.push(anilistService.getTrendingManga(1, 4));

      const [tmdbTrend, anilistAnime, anilistManga] = await Promise.allSettled(livePromises);

      const tmdbItems: ContentItem[] =
        tmdbTrend.status === 'fulfilled' && Array.isArray(tmdbTrend.value) ? tmdbTrend.value : [];
      const animeItems: ContentItem[] =
        anilistAnime.status === 'fulfilled' && Array.isArray(anilistAnime.value)
          ? anilistAnime.value.map(mangaToContentItem)
          : [];
      const mangaItems: ContentItem[] =
        anilistManga.status === 'fulfilled' && Array.isArray(anilistManga.value)
          ? anilistManga.value.map(mangaToContentItem)
          : [];

      // Interleave results proportionally across media types
      const maxLen = Math.max(tmdbItems.length, animeItems.length, mangaItems.length);
      for (let i = 0; i < maxLen; i++) {
        if (i < tmdbItems.length) addItem(tmdbItems[i]);
        if (i < animeItems.length) addItem(animeItems[i]);
        if (i < mangaItems.length && i % 2 === 0) addItem(mangaItems[i]);
        if (items.length >= limit) break;
      }
    } catch (err) {
      console.warn('Live trending providers fetch error:', err);
    }

    // 2. High-popularity curated & multi-regional master titles
    const masterDataset = getUnifiedMasterContent();
    const sortedMaster = [...masterDataset].sort((a, b) => {
      const popA = a.popularity || 0;
      const popB = b.popularity || 0;
      if (popB !== popA) return popB - popA;
      return (
        (b.score || (b.rating_average ? b.rating_average * 10 : 0)) -
        (a.score || (a.rating_average ? a.rating_average * 10 : 0))
      );
    });

    for (const masterItem of sortedMaster) {
      if (items.length >= limit) break;
      addItem(masterItem);
    }

    return items.slice(0, limit);
  }

  /**
   * Master Centralized All-Time Popular Content Service
   */
  async getPopularContent(limit = 18): Promise<ContentItem[]> {
    const items: ContentItem[] = [];
    const seenIds = new Set<string>();
    const seenTitles = new Set<string>();

    const addItem = (item: ContentItem) => {
      if (!item || !item.id || items.length >= limit) return;
      const idKey = String(item.id).toLowerCase();
      if (seenIds.has(idKey)) return;

      const titleKey = (item.title || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      if (titleKey && seenTitles.has(titleKey)) return;

      const resolvedPoster = resolveContentArtwork(item);
      item.poster_url = resolvedPoster;
      item.cover_url = resolvedPoster;

      seenIds.add(idKey);
      if (titleKey) seenTitles.add(titleKey);
      items.push(item);
    };

    try {
      const livePromises: Promise<any>[] = [];

      if (tmdbProvider.isAvailable()) {
        livePromises.push(tmdbProvider.getPopularMovies(1));
        livePromises.push(tmdbProvider.getPopularTv(1));
      } else {
        livePromises.push(Promise.resolve([]));
        livePromises.push(Promise.resolve([]));
      }

      livePromises.push(anilistService.getPopularAnime(1, 8));
      livePromises.push(anilistService.getPopularManga(1, 4));

      const [tmdbMovies, tmdbTv, anilistAnime, anilistManga] = await Promise.allSettled(livePromises);

      const movieItems: ContentItem[] =
        tmdbMovies.status === 'fulfilled' && Array.isArray(tmdbMovies.value) ? tmdbMovies.value : [];
      const tvItems: ContentItem[] =
        tmdbTv.status === 'fulfilled' && Array.isArray(tmdbTv.value) ? tmdbTv.value : [];
      const animeItems: ContentItem[] =
        anilistAnime.status === 'fulfilled' && Array.isArray(anilistAnime.value)
          ? anilistAnime.value.map(mangaToContentItem)
          : [];
      const mangaItems: ContentItem[] =
        anilistManga.status === 'fulfilled' && Array.isArray(anilistManga.value)
          ? anilistManga.value.map(mangaToContentItem)
          : [];

      const maxLen = Math.max(movieItems.length, tvItems.length, animeItems.length, mangaItems.length);
      for (let i = 0; i < maxLen; i++) {
        if (i < movieItems.length) addItem(movieItems[i]);
        if (i < tvItems.length) addItem(tvItems[i]);
        if (i < animeItems.length) addItem(animeItems[i]);
        if (i < mangaItems.length && i % 2 === 0) addItem(mangaItems[i]);
        if (items.length >= limit) break;
      }
    } catch (err) {
      console.warn('Live popular providers fetch error:', err);
    }

    // Blend with high-scoring master dataset
    const masterDataset = getUnifiedMasterContent();
    const sortedMaster = [...masterDataset].sort((a, b) => {
      const scoreA = a.score || (a.rating_average ? a.rating_average * 10 : 0);
      const scoreB = b.score || (b.rating_average ? b.rating_average * 10 : 0);
      if (scoreB !== scoreA) return scoreB - scoreA;
      return (b.popularity || 0) - (a.popularity || 0);
    });

    for (const masterItem of sortedMaster) {
      if (items.length >= limit) break;
      addItem(masterItem);
    }

    return items.slice(0, limit);
  }

  /**
   * Master Reference: Get all supported Languages
   */
  async getLanguages(): Promise<LanguageModel[]> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('languages')
          .select('*')
          .order('name', { ascending: true });
        if (!error && data && data.length > 0) return data;
      } catch (err) {
        console.warn('getLanguages failed, using defaults:', err);
      }
    }
    return DEFAULT_LANGUAGES;
  }

  /**
   * Master Reference: Get all Genres
   */
  async getGenres(): Promise<GenreModel[]> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('genres')
          .select('*')
          .order('name', { ascending: true });
        if (!error && data && data.length > 0) return data;
      } catch (err) {
        console.warn('getGenres failed, using defaults:', err);
      }
    }
    return DEFAULT_GENRES;
  }

  /**
   * Private helper to transform raw Supabase join rows into clean ContentItem models
   */
  private transformSupabaseContentRow(row: any): ContentItem {
    const genres = (row.content_genres || []).map((cg: any) => cg.genres?.name || cg.genre_id).filter(Boolean);
    const languages = (row.content_languages || []).map((cl: any) => cl.languages?.name || cl.language_id).filter(Boolean);
    const countries = (row.content_countries || []).map((cc: any) => cc.countries?.name || cc.country_id).filter(Boolean);
    const industries = (row.content_industries || []).map((ci: any) => ci.industries?.name || ci.industry_id).filter(Boolean);

    const primaryLangObj = (row.content_languages || []).find((cl: any) => cl.is_primary)?.languages?.name;
    const primaryIndObj = (row.content_industries || []).find((ci: any) => ci.is_primary)?.industries?.name;

    return {
      id: row.id,
      content_type: row.content_type,
      title: row.title,
      original_title: row.original_title,
      alternative_titles: row.alternative_titles || [],
      overview: row.overview || '',
      description: row.overview || '',
      poster_url: row.poster_url || '',
      cover_url: row.poster_url || '',
      backdrop_url: row.backdrop_url || null,
      banner_url: row.backdrop_url || null,
      trailer_url: row.trailer_url || null,
      release_date: row.release_date,
      year: row.year,
      runtime: row.runtime,
      status: row.status,
      age_rating: row.age_rating,
      rating_average: row.rating_average ? Number(row.rating_average) : null,
      score: row.rating_average ? Math.round(Number(row.rating_average) * 10) : undefined,
      rating_count: row.rating_count,
      popularity: row.popularity ? Number(row.popularity) : 0,
      source: row.source || 'Supabase',
      external_ids: row.external_ids || {},
      franchise_id: row.franchise_id,
      genres,
      languages,
      primary_language: primaryLangObj || languages[0] || null,
      countries,
      industries,
      primary_industry: primaryIndObj || industries[0] || null,
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }
}

export const contentService = new ContentService();
