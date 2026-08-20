// ==========================================================
// Universal Entertainment & Content Types (LetMeCheck Core)
// Covers Movies, TV/Web Series, Anime, Japanese/Korean Dramas,
// Regional Indian Cinemas (Bollywood, Tollywood, Kollywood, etc.), and Manga.
// ==========================================================

export type ContentType =
  | 'movie'
  | 'tv_series'
  | 'web_series'
  | 'anime'
  | 'drama'
  | 'manga'
  | 'manhwa'
  | 'manhua'
  | 'light_novel'
  | 'novel';

export type ContentStatus =
  | 'Planned'
  | 'In Production'
  | 'Ongoing'
  | 'Completed'
  | 'Released'
  | 'Cancelled'
  | 'Hiatus';

export type UniversalWatchStatus =
  | 'Watching'
  | 'Reading'
  | 'Plan to Watch'
  | 'Plan to Read'
  | 'Completed'
  | 'On Hold'
  | 'Dropped';

export type WatchOrderType =
  | 'release_order'
  | 'chronological'
  | 'recommended'
  | 'timeline'
  | 'custom';

export type ContentRelationshipType =
  | 'prequel'
  | 'sequel'
  | 'spin_off'
  | 'adaptation'
  | 'remake'
  | 'side_story'
  | 'alternative_version'
  | 'shared_universe'
  | 'parent_story';

// Reference Master Models
export interface ContentTypeModel {
  id: string;
  code: ContentType;
  name: string;
  description?: string;
  is_visual: boolean;
  is_literary: boolean;
}

export interface CountryModel {
  id: string;
  code: string; // ISO 3166-1 alpha-2 (e.g. 'IN', 'US', 'JP', 'KR')
  name: string;
  flag_emoji?: string;
}

export interface LanguageModel {
  id: string;
  code: string; // ISO 639-1 (e.g. 'en', 'hi', 'te', 'ta', 'ml', 'ja', 'ko')
  name: string;
  native_name?: string;
}

export interface IndustryModel {
  id: string;
  code: string; // 'hollywood', 'bollywood', 'tollywood', 'kollywood', 'mollywood', 'sandalwood', etc.
  name: string;
  region?: string;
  country_code?: string;
  primary_language_code?: string;
  description?: string;
}

export interface GenreModel {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

export interface ContentExternalIds {
  imdb_id?: string;
  tmdb_id?: number | string;
  anilist_id?: number;
  mal_id?: number;
  wikidata_id?: string;
  custom_id?: string;
  [key: string]: any;
}

// Core Normalized Entertainment Content Item
export interface ContentItem {
  id: string; // UUID or external source ID
  content_type: ContentType;
  title: string;
  original_title?: string | null;
  alternative_titles?: string[];
  overview: string;
  poster_url: string;
  backdrop_url?: string | null;
  trailer_url?: string | null;
  release_date?: string | null;
  year?: number | null;
  runtime?: number | null; // runtime in minutes (per episode or movie)
  status: ContentStatus;
  age_rating?: string | null; // e.g. "U/A 16+", "PG-13", "R", "TV-MA"
  rating_average?: number | null; // 0.0 - 10.0 or 0 - 100
  rating_count?: number | null;
  popularity?: number | null;
  source?: string;
  external_ids?: ContentExternalIds;

  // Normalized Relations
  genres?: string[] | GenreModel[];
  languages?: string[] | LanguageModel[];
  primary_language?: string | null;
  countries?: string[] | CountryModel[];
  industries?: string[] | IndustryModel[];
  primary_industry?: string | null;

  // Franchise & Watch Order Relations
  franchise_id?: string | null;
  franchise_name?: string | null;
  order_in_franchise?: number | null;

  // TV / Anime / Series Hierarchy
  seasons_count?: number | null;
  episodes_count?: number | null;
  seasons?: SeasonModel[];
  directors?: string[];
  creators?: string[];

  // Literary / Manga legacy compatibility
  chapters?: number | null;
  volumes?: number | null;
  author?: string;
  artist?: string;
  materials?: any[];

  // Aliases for unified UI components
  cover_url?: string;
  banner_url?: string | null;
  description?: string;
  score?: number;
  type?: string;

  created_at?: string;
  updated_at?: string;
}

// Franchise & Universe Architecture
export type UniverseCategory =
  | 'cinematic_universe'
  | 'franchise'
  | 'series'
  | 'anime_universe'
  | 'multimedia_universe';

export interface UniverseTitleRelationship {
  contentId?: string;
  content_id?: string;
  title?: string;
  poster_url?: string | null;
  backdrop_url?: string | null;
  relationshipType?: 'canon' | 'spin_off' | 'prequel' | 'sequel' | 'multiverse' | string;
  continuityId?: string;
  continuity_id?: string;
  releaseDate?: string;
  release_year?: number;
  chronologicalPosition?: number;
  position?: number;
  order_number?: number;
  includedInReleaseOrder?: boolean;
  includedInChronologicalOrder?: boolean;
  status?: 'released' | 'upcoming' | 'cancelled';
  explanation?: string | null;
  context?: string | null;
  notes?: string | null;
  content_type?: string;
  content?: ContentItem;
}

export interface UniverseContinuity {
  id: string;
  name: string;
  description?: string;
  titles?: UniverseTitleRelationship[];
  watchOrders?: WatchOrder[];
}

export interface WatchOrderEntry extends UniverseTitleRelationship {
  id?: string;
  order_in_franchise?: number;
  franchise_id?: string;
  watch_order_id?: string;
}

export interface WatchOrder {
  id: string;
  universe_id?: string;
  franchise_id?: string;
  name?: string;
  title?: string;
  description?: string | null;
  order_type: WatchOrderType;
  ordered_entries?: WatchOrderEntry[];
  items?: WatchOrderEntry[];
  is_default?: boolean;
}

export interface Universe {
  id: string;
  name: string;
  original_name?: string | null;
  slug?: string;
  description: string;
  poster_url?: string;
  poster?: string;
  backdrop_url?: string | null;
  backdrop?: string | null;
  category?: UniverseCategory | string;
  type?: UniverseCategory | string;
  region?: string;
  genres?: string[];
  titles?: UniverseTitleRelationship[];
  continuities?: UniverseContinuity[];
  watchOrders?: WatchOrder[];
  available_orders?: WatchOrder[];
  lastUpdated?: string;
  updated_at?: string;
  created_at?: string;
  total_titles?: number;
  items_count?: number;
  items?: WatchOrderEntry[];
  watch_orders?: WatchOrder[];
  related_content?: ContentItem[];
}

// Backward-compatible aliases
export type FranchiseModel = Universe;
export type FranchiseItemModel = WatchOrderEntry;
export type WatchOrderModel = WatchOrder;
export type WatchOrderItemModel = WatchOrderEntry;

// Inter-Content Relationships
export interface ContentRelationshipModel {
  id: string;
  source_content_id: string;
  target_content_id: string;
  relationship_type: ContentRelationshipType;
  notes?: string | null;
  target_content?: ContentItem;
}

// TV / Web Series / Anime Seasons & Episodes
export interface SeasonModel {
  id: string;
  content_id: string;
  season_number: number;
  title: string;
  overview?: string | null;
  poster_url?: string | null;
  air_date?: string | null;
  episode_count: number;
  episodes?: EpisodeModel[];
  created_at?: string;
}

export interface EpisodeModel {
  id: string;
  season_id: string;
  content_id: string;
  episode_number: number;
  title: string;
  overview?: string | null;
  still_url?: string | null;
  air_date?: string | null;
  runtime?: number | null; // in minutes
  created_at?: string;
}

// Universal User Library & Progress State
export interface UserContentLibraryEntry {
  id?: string;
  user_id: string;
  content_id: string;
  status: UniversalWatchStatus;
  content?: ContentItem;
  progress?: UserContentWatchProgress;
  is_favorite?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface UserContentWatchProgress {
  id?: string;
  user_id: string;
  content_id: string;
  season_number?: number;
  episode_number?: number;
  progress_seconds?: number;
  total_seconds?: number;
  chapters_read?: number;
  volumes_read?: number;
  is_completed: boolean;
  last_watched_at?: string;
  updated_at?: string;
}

// Universal Content Query / Filter Parameters
export interface ContentFilterParams {
  query?: string;
  content_type?: ContentType | 'all';
  industry?: string | 'all'; // 'hollywood', 'bollywood', 'tollywood', 'kollywood', etc.
  language?: string | 'all'; // 'en', 'hi', 'te', 'ta', 'ja', 'ko', etc.
  country?: string | 'all';
  genre?: string | 'all';
  year?: number;
  franchise_id?: string;
  status?: ContentStatus | 'all';
  sort?:
    | 'POPULARITY_DESC'
    | 'RATING_DESC'
    | 'RELEASE_DATE_DESC'
    | 'RELEASE_DATE_ASC'
    | 'TITLE_ASC';
  page?: number;
  per_page?: number;
}
