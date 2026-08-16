export type MangaType = 'Manga' | 'Manhwa' | 'Manhua' | 'Light Novel' | 'One-shot' | 'All';

export type MangaStatus = 'Ongoing' | 'Completed' | 'Hiatus' | 'Cancelled' | 'All';

export type ReadingStatus = 'Reading' | 'Pending' | 'Completed' | 'On Hold' | 'Dropped';

export type MaterialType =
  | 'Manga'
  | 'Manhwa'
  | 'Manhua'
  | 'Light Novel'
  | 'Anime'
  | 'Movie'
  | 'OVA'
  | 'Special'
  | 'One-shot'
  | 'Other';

export type MaterialStatus = 'Pending' | 'In Progress' | 'Completed';

export interface MangaMaterial {
  id: string; // Internal UUID in Supabase database or temporary unique ID
  manga_id?: string;
  type: MaterialType;
  title: string;
  number?: string;
  description?: string;
  release_date?: string;
  external_id?: string | number;
  external_url?: string;
}

export interface MangaTitleVariants {
  english?: string | null;
  romaji?: string | null;
  native?: string | null;
}

export interface Manga {
  id: string;
  anilist_id?: number;
  mangadex_id?: string;
  title: string;
  title_details?: MangaTitleVariants;
  alternative_titles?: string[];
  description: string;
  type: 'Manga' | 'Manhwa' | 'Manhua' | 'Light Novel' | 'One-shot';
  status: 'Ongoing' | 'Completed' | 'Hiatus' | 'Cancelled';
  author?: string;
  artist?: string;
  genres: string[];
  chapters?: number | null;
  volumes?: number | null;
  cover_url: string;
  banner_url?: string | null;
  score?: number;
  popularity?: number;
  source?: string;
  materials?: MangaMaterial[];
  release_year?: number;
}

export interface UserProfile {
  id: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  email?: string;
  created_at?: string;
  updated_at?: string;
}

export interface UserProgress {
  id?: string;
  user_id: string;
  manga_id: string;
  chapters_read: number;
  volumes_read: number;
  updated_at?: string;
}

export interface UserMaterialProgress {
  id?: string;
  user_id: string;
  material_id: string;
  status: MaterialStatus;
  progress: number;
  updated_at?: string;
}

export interface UserLibraryEntry {
  id?: string;
  user_id: string;
  manga_id: string;
  status: ReadingStatus;
  created_at?: string;
  updated_at?: string;
  manga?: Manga;
  progress?: UserProgress;
  is_favorite?: boolean;
}

export interface UserNote {
  id?: string;
  user_id: string;
  manga_id: string;
  content: string;
  created_at?: string;
  updated_at?: string;
}

export interface SearchFilters {
  query?: string;
  genre?: string;
  type?: MangaType;
  status?: MangaStatus;
  sort?: 'POPULARITY_DESC' | 'TRENDING_DESC' | 'SCORE_DESC' | 'UPDATED_AT_DESC' | 'TITLE_ROMAJI';
  page?: number;
  perPage?: number;
}

export interface LibraryStats {
  total: number;
  reading: number;
  pending: number;
  completed: number;
  onHold: number;
  dropped: number;
  favorites: number;
  chaptersRead: number;
  volumesRead: number;
}
