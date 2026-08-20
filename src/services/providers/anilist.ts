// ==========================================================
// AniList Provider Adapter (Anime & Manga Ingestion)
// Adapts the existing AniList GraphQL API into the unified
// ContentProvider interface.
// ==========================================================

import { ContentProvider, ProviderSearchResult } from './types';
import { ContentItem, ContentFilterParams } from '../../types/content';
import { anilistService } from '../anilist';
import { mangaToContentItem } from '../contentService';

export class AniListProvider implements ContentProvider {
  readonly name = 'anilist';
  readonly attribution = 'Anime and Manga metadata powered by AniList.co API';

  isAvailable(): boolean {
    return true; // AniList is publicly available without mandatory API keys
  }

  async search(query: string, filters?: ContentFilterParams): Promise<ProviderSearchResult> {
    const page = filters?.page || 1;
    const perPage = filters?.per_page || 18;

    let res: { items: any[]; hasNextPage: boolean };
    if (filters?.content_type === 'anime') {
      res = await anilistService.searchAnime(query, page, perPage);
    } else if (
      filters?.content_type === 'manga' ||
      filters?.content_type === 'manhwa' ||
      filters?.content_type === 'manhua'
    ) {
      res = await anilistService.searchManga(query, page, perPage);
    } else {
      res = await anilistService.searchAll(query, page, perPage);
    }

    const items = res.items.map(mangaToContentItem);
    return {
      items,
      page,
      total_pages: res.hasNextPage ? page + 1 : page,
      total_results: items.length,
      has_next_page: res.hasNextPage
    };
  }

  async getDetails(externalId: string | number): Promise<ContentItem | null> {
    const manga = await anilistService.getMangaById(externalId.toString());
    if (!manga) return null;
    return mangaToContentItem(manga);
  }
}

export const anilistProvider = new AniListProvider();
