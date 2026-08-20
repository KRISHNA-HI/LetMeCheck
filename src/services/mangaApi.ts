import { Manga, SearchFilters } from '../types';
import { anilistService } from './anilist';
import { contentService, contentItemToManga } from './contentService';

export interface MangaApiProvider {
  getTrendingManga(page?: number, perPage?: number): Promise<Manga[]>;
  getPopularManga(page?: number, perPage?: number): Promise<Manga[]>;
  getRecentlyUpdated(page?: number, perPage?: number): Promise<Manga[]>;
  searchManga(query: string, page?: number, perPage?: number): Promise<{ items: Manga[]; hasNextPage: boolean }>;
  getMangaById(id: string | number): Promise<Manga | null>;
  getMangaDetail?(
    id: string | number
  ): Promise<{ data: Manga | null; errorType: 'NOT_FOUND' | 'TEMPORARY_ERROR' | null; errorMessage?: string }>;
  discoverManga(filters: SearchFilters): Promise<{ items: Manga[]; hasNextPage: boolean }>;
  getDefaultNarutoManga(): Promise<Manga>;
}

// Universal Content Provider aggregation: ContentService (TMDB + AniList + DB)
class MangaApiService implements MangaApiProvider {
  private primaryProvider = anilistService;

  async getTrendingManga(page = 1, perPage = 12): Promise<Manga[]> {
    return this.primaryProvider.getTrendingManga(page, perPage);
  }

  async getPopularManga(page = 1, perPage = 12): Promise<Manga[]> {
    return this.primaryProvider.getPopularManga(page, perPage);
  }

  async getRecentlyUpdated(page = 1, perPage = 12): Promise<Manga[]> {
    return this.primaryProvider.getRecentlyUpdated(page, perPage);
  }

  async searchManga(query: string, page = 1, perPage = 20): Promise<{ items: Manga[]; hasNextPage: boolean }> {
    try {
      const res = await contentService.searchContent(query, { page, per_page: perPage });
      if (res.items && res.items.length > 0) {
        return {
          items: res.items.map(contentItemToManga),
          hasNextPage: res.hasNextPage
        };
      }
    } catch (err) {
      console.warn('ContentService search failed, fallback to AniList:', err);
    }
    return this.primaryProvider.searchManga(query, page, perPage);
  }

  async getMangaById(id: string | number): Promise<Manga | null> {
    try {
      const item = await contentService.getContentById(id.toString());
      if (item) {
        return contentItemToManga(item);
      }
    } catch (err) {
      console.warn('ContentService getById failed:', err);
    }
    return this.primaryProvider.getMangaById(id);
  }

  async getMangaDetail(
    id: string | number
  ): Promise<{ data: Manga | null; errorType: 'NOT_FOUND' | 'TEMPORARY_ERROR' | null; errorMessage?: string }> {
    try {
      const item = await contentService.getContentById(id.toString());
      if (item) {
        return { data: contentItemToManga(item), errorType: null };
      }
    } catch (err) {
      console.warn('ContentService getMangaDetail failed:', err);
    }
    return this.primaryProvider.getMangaByIdDetailed(id);
  }

  async discoverManga(filters: SearchFilters): Promise<{ items: Manga[]; hasNextPage: boolean }> {
    return this.primaryProvider.discoverManga(filters);
  }

  async getDefaultNarutoManga(): Promise<Manga> {
    return this.primaryProvider.getDefaultNarutoManga();
  }
}

export const mangaApi = new MangaApiService();
