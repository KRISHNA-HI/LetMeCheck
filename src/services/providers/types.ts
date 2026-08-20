// ==========================================================
// Provider Abstraction Layer & Interfaces
// Decouples provider-specific schemas (TMDB, AniList, etc.)
// from the unified LetMeCheck ContentItem architecture.
// ==========================================================

import { ContentItem, ContentType, ContentFilterParams } from '../../types/content';

export interface ProviderSearchResult {
  items: ContentItem[];
  page: number;
  total_pages: number;
  total_results: number;
  has_next_page: boolean;
}

export interface ProviderCredits {
  directors: string[];
  cast: {
    name: string;
    character?: string;
    profile_url?: string;
    order?: number;
  }[];
  writers: string[];
}

export interface ProviderRawCollection {
  id: number | string;
  name: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  overview?: string | null;
  parts?: any[];
}

/**
 * Universal Content Provider Interface
 */
export interface ContentProvider {
  /**
   * Unique name of the provider (e.g., 'tmdb', 'anilist')
   */
  readonly name: string;

  /**
   * Attribution text/badge required by the provider license
   */
  readonly attribution: string;

  /**
   * Check if provider is configured with required credentials / ready
   */
  isAvailable(): boolean;

  /**
   * Search for entertainment content across movies, series, etc.
   */
  search(query: string, filters?: ContentFilterParams): Promise<ProviderSearchResult>;

  /**
   * Fetch full detailed metadata by provider-specific external ID and content type
   */
  getDetails(externalId: string | number, mediaType?: 'movie' | 'tv'): Promise<ContentItem | null>;

  /**
   * Fetch credits (cast & crew)
   */
  getCredits?(externalId: string | number, mediaType?: 'movie' | 'tv'): Promise<ProviderCredits | null>;

  /**
   * Fetch related franchise / collection if available
   */
  getCollection?(collectionId: string | number): Promise<ProviderRawCollection | null>;
}
