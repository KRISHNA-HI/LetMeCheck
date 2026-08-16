import { Manga, SearchFilters } from '../types';
import { anilistService } from './anilist';

export interface MangaApiProvider {
  getTrendingManga(page?: number, perPage?: number): Promise<Manga[]>;
  getPopularManga(page?: number, perPage?: number): Promise<Manga[]>;
  getRecentlyUpdated(page?: number, perPage?: number): Promise<Manga[]>;
  searchManga(query: string, page?: number, perPage?: number): Promise<{ items: Manga[]; hasNextPage: boolean }>;
  getMangaById(id: string | number): Promise<Manga | null>;
  discoverManga(filters: SearchFilters): Promise<{ items: Manga[]; hasNextPage: boolean }>;
  getDefaultNarutoManga(): Promise<Manga>;
}

// Current provider: AniList (Free GraphQL API, zero keys required)
// MangaDex or others can be swapped or aggregated here in the future
class MangaApiService implements MangaApiProvider {
  private primaryProvider: MangaApiProvider = anilistService;

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
    return this.primaryProvider.searchManga(query, page, perPage);
  }

  async getMangaById(id: string | number): Promise<Manga | null> {
    return this.primaryProvider.getMangaById(id);
  }

  async discoverManga(filters: SearchFilters): Promise<{ items: Manga[]; hasNextPage: boolean }> {
    return this.primaryProvider.discoverManga(filters);
  }

  async getDefaultNarutoManga(): Promise<Manga> {
    return this.primaryProvider.getDefaultNarutoManga();
  }
}

export const mangaApi = new MangaApiService();
