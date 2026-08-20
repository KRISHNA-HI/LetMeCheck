// ==========================================================
// TMDB Content Provider Implementation
// Implements the ContentProvider interface for TMDB API v3.
// Includes rate-limiting (40 req/10s queue), safe exponential retry,
// and compliant attribution handling.
// ==========================================================

import { ContentProvider, ProviderSearchResult, ProviderCredits, ProviderRawCollection } from './types';
import { ContentItem, ContentFilterParams } from '../../types/content';
import { normalizeTmdbItem } from './normalizer';

export class TmdbProvider implements ContentProvider {
  readonly name = 'tmdb';
  readonly attribution = 'This product uses the TMDB API but is not endorsed or certified by TMDB.';

  private readonly baseUrl = 'https://api.themoviedb.org/3';
  private readonly apiKey: string | null;
  private readonly imageBaseUrl = 'https://image.tmdb.org/t/p';

  // Rate Limiting Queue (TMDB permits ~40 requests per 10s window)
  private requestQueue: Array<() => Promise<void>> = [];
  private isProcessingQueue = false;
  private lastRequestTime = 0;
  private minIntervalMs = 250; // 4 requests per second max to stay comfortably below limits

  constructor(apiKey?: string) {
    let envKey: string | null = null;
    try {
      if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
        envKey = (import.meta as any).env.VITE_TMDB_API_KEY || (import.meta as any).env.TMDB_API_KEY || null;
      }
    } catch (_) {}
    if (!envKey && typeof process !== 'undefined' && process.env) {
      envKey = process.env.VITE_TMDB_API_KEY || process.env.TMDB_API_KEY || null;
    }
    this.apiKey = apiKey || envKey || null;
  }

  isAvailable(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  /**
   * Universal search across movies and TV shows
   */
  async search(query: string, filters?: ContentFilterParams): Promise<ProviderSearchResult> {
    if (!this.isAvailable()) {
      return { items: [], page: 1, total_pages: 0, total_results: 0, has_next_page: false };
    }

    const page = filters?.page || 1;
    let mediaType: 'movie' | 'tv' | 'multi' = 'multi';
    if (filters?.content_type === 'movie') {
      mediaType = 'movie';
    } else if (
      filters?.content_type === 'tv_series' ||
      filters?.content_type === 'web_series' ||
      filters?.content_type === 'drama'
    ) {
      mediaType = 'tv';
    }

    const endpoint = mediaType === 'multi' ? '/search/multi' : `/search/${mediaType}`;

    const params: Record<string, string> = {
      query: query.trim(),
      page: page.toString(),
      include_adult: 'false'
    };

    if (filters?.year) {
      if (mediaType === 'movie') params.year = filters.year.toString();
      if (mediaType === 'tv') params.first_air_date_year = filters.year.toString();
    }

    if (filters?.language && filters.language !== 'all') {
      params.language = filters.language;
    }

    const data = await this.fetchWithRetry<any>(endpoint, params);
    if (!data || !Array.isArray(data.results)) {
      return { items: [], page: 1, total_pages: 0, total_results: 0, has_next_page: false };
    }

    const items: ContentItem[] = [];
    for (const raw of data.results) {
      // Filter out person results from multi-search
      if (raw.media_type === 'person') continue;
      const type = raw.media_type === 'tv' ? 'tv' : raw.media_type === 'movie' ? 'movie' : mediaType === 'tv' ? 'tv' : 'movie';
      items.push(normalizeTmdbItem(raw, type, this.imageBaseUrl));
    }

    return {
      items,
      page: data.page || page,
      total_pages: data.total_pages || 1,
      total_results: data.total_results || items.length,
      has_next_page: (data.page || page) < (data.total_pages || 1)
    };
  }

  /**
   * Fetch full details with append_to_response (credits, external_ids, videos)
   */
  async getDetails(externalId: string | number, mediaType?: 'movie' | 'tv'): Promise<ContentItem | null> {
    if (!this.isAvailable()) return null;

    let targetMediaType: 'movie' | 'tv' = mediaType || 'movie';
    let cleanId = typeof externalId === 'string' ? externalId : externalId.toString();

    if (typeof externalId === 'string') {
      if (externalId.startsWith('tmdb-tv-')) {
        targetMediaType = 'tv';
        cleanId = externalId.replace(/^tmdb-tv-/, '');
      } else if (externalId.startsWith('tmdb-m-')) {
        targetMediaType = 'movie';
        cleanId = externalId.replace(/^tmdb-m-/, '');
      }
    }

    const endpoint = `/${targetMediaType}/${cleanId}`;
    const params = {
      append_to_response: 'credits,external_ids,videos,keywords'
    };

    const raw = await this.fetchWithRetry<any>(endpoint, params);
    if (!raw) return null;

    return normalizeTmdbItem(raw, targetMediaType, this.imageBaseUrl);
  }

  /**
   * Fetch Credits (Cast, Director, Writers)
   */
  async getCredits(externalId: string | number, mediaType: 'movie' | 'tv' = 'movie'): Promise<ProviderCredits | null> {
    if (!this.isAvailable()) return null;

    const cleanId = typeof externalId === 'string' ? externalId.replace(/^tmdb-[m|tv]-/, '') : externalId;
    const endpoint = `/${mediaType}/${cleanId}/credits`;
    const data = await this.fetchWithRetry<any>(endpoint);
    if (!data) return null;

    const directors = (data.crew || [])
      .filter((c: any) => c.job === 'Director')
      .map((c: any) => c.name);

    const writers = (data.crew || [])
      .filter((c: any) => ['Screenplay', 'Writer', 'Story'].includes(c.job))
      .map((c: any) => c.name);

    const cast = (data.cast || []).slice(0, 15).map((c: any) => ({
      name: c.name,
      character: c.character,
      profile_url: c.profile_path ? `${this.imageBaseUrl}/w185${c.profile_path}` : undefined,
      order: c.order
    }));

    return { directors, writers, cast };
  }

  /**
   * Fetch Collection / Franchise items
   */
  async getCollection(collectionId: string | number): Promise<ProviderRawCollection | null> {
    if (!this.isAvailable()) return null;

    const cleanId = typeof collectionId === 'string' ? collectionId.replace(/^tmdb-col-/, '') : collectionId;
    const endpoint = `/collection/${cleanId}`;
    const data = await this.fetchWithRetry<any>(endpoint);
    if (!data) return null;

    return {
      id: data.id,
      name: data.name,
      overview: data.overview,
      poster_path: data.poster_path ? `${this.imageBaseUrl}/w500${data.poster_path}` : null,
      backdrop_path: data.backdrop_path ? `${this.imageBaseUrl}/original${data.backdrop_path}` : null,
      parts: (data.parts || []).map((p: any) => normalizeTmdbItem(p, 'movie', this.imageBaseUrl))
    };
  }

  /**
   * Discover movies by original language, release date bounds, and sorting
   */
  async discoverMovies(params: {
    with_original_language?: string;
    sort_by?: string;
    page?: number;
    primary_release_year?: number;
    'primary_release_date.lte'?: string;
    'primary_release_date.gte'?: string;
    'vote_count.gte'?: number | string;
    with_genres?: string;
  }): Promise<ContentItem[]> {
    if (!this.isAvailable()) return [];

    const queryParams: Record<string, string> = {
      sort_by: params.sort_by || 'popularity.desc',
      page: (params.page || 1).toString(),
      include_adult: 'false',
      include_video: 'false'
    };

    if (params.with_original_language) {
      queryParams.with_original_language = params.with_original_language;
    }
    if (params.primary_release_year) {
      queryParams.primary_release_year = params.primary_release_year.toString();
    }
    if (params['primary_release_date.lte']) {
      queryParams['primary_release_date.lte'] = params['primary_release_date.lte'];
    }
    if (params['primary_release_date.gte']) {
      queryParams['primary_release_date.gte'] = params['primary_release_date.gte'];
    }
    if (params['vote_count.gte']) {
      queryParams['vote_count.gte'] = params['vote_count.gte'].toString();
    }
    if (params.with_genres) {
      queryParams.with_genres = params.with_genres;
    }

    const data = await this.fetchWithRetry<any>('/discover/movie', queryParams);
    if (!data || !Array.isArray(data.results)) return [];

    return data.results.map((raw: any) => normalizeTmdbItem(raw, 'movie', this.imageBaseUrl));
  }

  /**
   * Fetch Trending items across media (all, movies, TV) for day or week window
   */
  async getTrending(mediaType: 'all' | 'movie' | 'tv' = 'all', timeWindow: 'day' | 'week' = 'week', page = 1): Promise<ContentItem[]> {
    if (!this.isAvailable()) return [];

    const endpoint = `/trending/${mediaType}/${timeWindow}`;
    const params: Record<string, string> = {
      page: page.toString()
    };

    const data = await this.fetchWithRetry<any>(endpoint, params);
    if (!data || !Array.isArray(data.results)) return [];

    const items: ContentItem[] = [];
    for (const raw of data.results) {
      if (raw.media_type === 'person') continue;
      const type = raw.media_type === 'tv' ? 'tv' : raw.media_type === 'movie' ? 'movie' : mediaType === 'tv' ? 'tv' : 'movie';
      items.push(normalizeTmdbItem(raw, type, this.imageBaseUrl));
    }
    return items;
  }

  /**
   * Fetch Popular movies
   */
  async getPopularMovies(page = 1): Promise<ContentItem[]> {
    if (!this.isAvailable()) return [];
    const data = await this.fetchWithRetry<any>('/movie/popular', { page: page.toString() });
    if (!data || !Array.isArray(data.results)) return [];
    return data.results.map((raw: any) => normalizeTmdbItem(raw, 'movie', this.imageBaseUrl));
  }

  /**
   * Fetch Popular TV series
   */
  async getPopularTv(page = 1): Promise<ContentItem[]> {
    if (!this.isAvailable()) return [];
    const data = await this.fetchWithRetry<any>('/tv/popular', { page: page.toString() });
    if (!data || !Array.isArray(data.results)) return [];
    return data.results.map((raw: any) => normalizeTmdbItem(raw, 'tv', this.imageBaseUrl));
  }

  /**
   * Internal throttled fetcher with exponential backoff retry (up to 3 attempts)
   */
  private async fetchWithRetry<T>(endpoint: string, queryParams: Record<string, string> = {}, retries = 3): Promise<T | null> {
    return new Promise<T | null>((resolve) => {
      this.requestQueue.push(async () => {
        let attempt = 0;
        let delay = 300;

        while (attempt < retries) {
          attempt++;
          try {
            // Enforce minimum interval between network dispatches
            const now = Date.now();
            const elapsed = now - this.lastRequestTime;
            if (elapsed < this.minIntervalMs) {
              await new Promise((r) => setTimeout(r, this.minIntervalMs - elapsed));
            }
            this.lastRequestTime = Date.now();

            const url = new URL(`${this.baseUrl}${endpoint}`);
            url.searchParams.set('api_key', this.apiKey || '');
            for (const [k, v] of Object.entries(queryParams)) {
              url.searchParams.set(k, v);
            }

            const response = await fetch(url.toString(), {
              headers: { Accept: 'application/json' }
            });

            if (response.status === 429) {
              // Rate limited - wait for retry header or exponential delay
              const retryAfter = Number(response.headers.get('Retry-After')) || 2;
              await new Promise((r) => setTimeout(r, retryAfter * 1000));
              continue;
            }

            if (response.status === 404) {
              resolve(null);
              return;
            }

            if (!response.ok) {
              throw new Error(`TMDB HTTP ${response.status}: ${response.statusText}`);
            }

            const json = await response.json();
            resolve(json as T);
            return;
          } catch (err) {
            console.warn(`TMDB request error (attempt ${attempt}/${retries}):`, err);
            if (attempt >= retries) {
              resolve(null);
              return;
            }
            await new Promise((r) => setTimeout(r, delay));
            delay *= 2;
          }
        }
        resolve(null);
      });

      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.isProcessingQueue) return;
    this.isProcessingQueue = true;

    while (this.requestQueue.length > 0) {
      const task = this.requestQueue.shift();
      if (task) {
        await task();
      }
    }

    this.isProcessingQueue = false;
  }
}

export const tmdbProvider = new TmdbProvider();
