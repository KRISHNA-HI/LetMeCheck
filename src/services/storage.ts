import {
  UserLibraryEntry,
  UserProgress,
  UserMaterialProgress,
  UserNote,
  UserProfile,
  ReadingStatus,
  MaterialStatus,
  Manga
} from '../types';
import { SyncQueueItem } from './sync';

const STORAGE_KEYS = {
  USER: 'letmecheck_user_v1',
  LIBRARY: 'letmecheck_library_v1',
  PROGRESS: 'letmecheck_progress_v1',
  MATERIAL_PROGRESS: 'letmecheck_mat_progress_v1',
  FAVORITES: 'letmecheck_favorites_v1',
  NOTES: 'letmecheck_notes_v1',
  SYNC_QUEUE: 'letmecheck_sync_queue_v1',
  SEARCH_CACHE: 'letmecheck_search_cache_v1',
  RECENT_SEARCHES: 'letmecheck_recent_searches_v1'
};

function safeGetItem<T>(key: string, defaultValue: T): T {
  try {
    if (typeof localStorage === 'undefined') return defaultValue;
    const item = localStorage.getItem(key);
    return item ? (JSON.parse(item) as T) : defaultValue;
  } catch (err) {
    console.warn(`Error reading localStorage key "${key}":`, err);
    return defaultValue;
  }
}

function safeSetItem<T>(key: string, value: T): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`Error writing localStorage key "${key}":`, err);
  }
}

function safeRemoveItem(key: string): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(key);
  } catch (err) {
    console.warn(`Error removing localStorage key "${key}":`, err);
  }
}

export const localStorageService = {
  // ---------------------------------------------
  // USER SESSION
  // ---------------------------------------------
  getLocalUser(): UserProfile | null {
    return safeGetItem<UserProfile | null>(STORAGE_KEYS.USER, null);
  },

  setLocalUser(user: UserProfile | null): void {
    if (user) {
      safeSetItem(STORAGE_KEYS.USER, user);
    } else {
      safeRemoveItem(STORAGE_KEYS.USER);
    }
  },

  // ---------------------------------------------
  // LIBRARY
  // ---------------------------------------------
  getLibrary(): UserLibraryEntry[] {
    return safeGetItem<UserLibraryEntry[]>(STORAGE_KEYS.LIBRARY, []);
  },

  setLibrary(list: UserLibraryEntry[]): void {
    safeSetItem(STORAGE_KEYS.LIBRARY, list);
  },

  saveLibraryEntry(entry: UserLibraryEntry): UserLibraryEntry[] {
    const list = this.getLibrary();
    const idx = list.findIndex((e) => e.manga_id.toString() === entry.manga_id.toString());
    const now = new Date().toISOString();
    const updated = {
      ...entry,
      updated_at: now
    };
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...updated };
    } else {
      list.push({ ...updated, created_at: now });
    }
    safeSetItem(STORAGE_KEYS.LIBRARY, list);
    return list;
  },

  removeLibraryEntry(mangaId: string | number): UserLibraryEntry[] {
    const list = this.getLibrary().filter((e) => e.manga_id.toString() !== mangaId.toString());
    safeSetItem(STORAGE_KEYS.LIBRARY, list);
    return list;
  },

  // ---------------------------------------------
  // READING PROGRESS
  // ---------------------------------------------
  getProgress(mangaId: string | number): UserProgress | null {
    const list = this.getAllProgress();
    return list.find((p) => p.manga_id.toString() === mangaId.toString()) || null;
  },

  getAllProgress(): UserProgress[] {
    return safeGetItem<UserProgress[]>(STORAGE_KEYS.PROGRESS, []);
  },

  setAllProgress(list: UserProgress[]): void {
    safeSetItem(STORAGE_KEYS.PROGRESS, list);
  },

  saveProgress(progress: UserProgress): void {
    const list = this.getAllProgress();
    const idx = list.findIndex((p) => p.manga_id.toString() === progress.manga_id.toString());
    const updated = { ...progress, updated_at: new Date().toISOString() };
    if (idx >= 0) {
      list[idx] = updated;
    } else {
      list.push(updated);
    }
    safeSetItem(STORAGE_KEYS.PROGRESS, list);
  },

  // ---------------------------------------------
  // MATERIAL PROGRESS
  // ---------------------------------------------
  getMaterialProgress(materialId: string): UserMaterialProgress | null {
    const list = this.getAllMaterialProgress();
    return list.find((p) => p.material_id === materialId) || null;
  },

  getAllMaterialProgress(): UserMaterialProgress[] {
    return safeGetItem<UserMaterialProgress[]>(STORAGE_KEYS.MATERIAL_PROGRESS, []);
  },

  setAllMaterialProgress(list: UserMaterialProgress[]): void {
    safeSetItem(STORAGE_KEYS.MATERIAL_PROGRESS, list);
  },

  saveMaterialProgress(progress: UserMaterialProgress): void {
    const list = this.getAllMaterialProgress();
    const idx = list.findIndex((p) => p.material_id === progress.material_id);
    const updated = { ...progress, updated_at: new Date().toISOString() };
    if (idx >= 0) {
      list[idx] = updated;
    } else {
      list.push(updated);
    }
    safeSetItem(STORAGE_KEYS.MATERIAL_PROGRESS, list);
  },

  // ---------------------------------------------
  // FAVORITES
  // ---------------------------------------------
  getFavorites(): string[] {
    return safeGetItem<string[]>(STORAGE_KEYS.FAVORITES, []);
  },

  setFavorites(list: string[]): void {
    safeSetItem(STORAGE_KEYS.FAVORITES, list);
  },

  toggleFavorite(mangaId: string | number): boolean {
    const list = this.getFavorites();
    const idStr = mangaId.toString();
    const exists = list.includes(idStr);
    const updated = exists ? list.filter((id) => id !== idStr) : [...list, idStr];
    safeSetItem(STORAGE_KEYS.FAVORITES, updated);
    return !exists;
  },

  isFavorite(mangaId: string | number): boolean {
    return this.getFavorites().includes(mangaId.toString());
  },

  // ---------------------------------------------
  // NOTES
  // ---------------------------------------------
  getNotes(mangaId: string | number): UserNote | null {
    const list = safeGetItem<UserNote[]>(STORAGE_KEYS.NOTES, []);
    return list.find((n) => n.manga_id.toString() === mangaId.toString()) || null;
  },

  getAllNotes(): UserNote[] {
    return safeGetItem<UserNote[]>(STORAGE_KEYS.NOTES, []);
  },

  setAllNotes(list: UserNote[]): void {
    safeSetItem(STORAGE_KEYS.NOTES, list);
  },

  saveNote(note: UserNote): void {
    const list = this.getAllNotes();
    const idx = list.findIndex((n) => n.manga_id.toString() === note.manga_id.toString());
    const now = new Date().toISOString();
    if (idx >= 0) {
      list[idx] = { ...note, updated_at: now };
    } else {
      list.push({ ...note, created_at: now, updated_at: now });
    }
    safeSetItem(STORAGE_KEYS.NOTES, list);
  },

  deleteNote(mangaId: string | number): void {
    const list = this.getAllNotes();
    const updated = list.filter((n) => n.manga_id.toString() !== mangaId.toString());
    safeSetItem(STORAGE_KEYS.NOTES, updated);
  },

  // ---------------------------------------------
  // SYNC QUEUE
  // ---------------------------------------------
  getSyncQueue(): SyncQueueItem[] {
    return safeGetItem<SyncQueueItem[]>(STORAGE_KEYS.SYNC_QUEUE, []);
  },

  setSyncQueue(queue: SyncQueueItem[]): void {
    safeSetItem(STORAGE_KEYS.SYNC_QUEUE, queue);
  },

  addToSyncQueue(item: SyncQueueItem): void {
    const queue = this.getSyncQueue();
    // Simple deduplication for matching mangaId / materialId
    const filtered = queue.filter(
      (q) => !(q.type === item.type && JSON.stringify(q.payload) === JSON.stringify(item.payload))
    );
    filtered.push(item);
    this.setSyncQueue(filtered);
  },

  clearSyncQueue(): void {
    safeRemoveItem(STORAGE_KEYS.SYNC_QUEUE);
  },

  // ---------------------------------------------
  // RECENT SEARCHES
  // ---------------------------------------------
  getRecentSearches(): string[] {
    return safeGetItem<string[]>(STORAGE_KEYS.RECENT_SEARCHES, []);
  },

  addRecentSearch(query: string): string[] {
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 2) return this.getRecentSearches();
    const list = this.getRecentSearches().filter(
      (q) => q.toLowerCase() !== trimmed.toLowerCase()
    );
    list.unshift(trimmed);
    const capped = list.slice(0, 8);
    safeSetItem(STORAGE_KEYS.RECENT_SEARCHES, capped);
    return capped;
  },

  clearRecentSearches(): void {
    safeRemoveItem(STORAGE_KEYS.RECENT_SEARCHES);
  },

  // Clear all local personal data (e.g. on logout)
  clearUserData(): void {
    safeRemoveItem(STORAGE_KEYS.USER);
    safeRemoveItem(STORAGE_KEYS.LIBRARY);
    safeRemoveItem(STORAGE_KEYS.PROGRESS);
    safeRemoveItem(STORAGE_KEYS.MATERIAL_PROGRESS);
    safeRemoveItem(STORAGE_KEYS.FAVORITES);
    safeRemoveItem(STORAGE_KEYS.NOTES);
    safeRemoveItem(STORAGE_KEYS.SYNC_QUEUE);
    safeRemoveItem(STORAGE_KEYS.RECENT_SEARCHES);
  }
};
