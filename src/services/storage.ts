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

const BASE_KEYS = {
  USER: 'letmecheck_user_v1',
  SEARCH_CACHE: 'letmecheck_search_cache_v1',
  RECENT_SEARCHES: 'letmecheck_recent_searches_v1'
};

function getUserScopedKey(userId: string | undefined | null, key: string): string {
  if (userId && userId.trim()) {
    return `letmecheck_u_${userId.trim()}_${key}_v2`;
  }
  return `letmecheck_${key}_v1`;
}

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
    return safeGetItem<UserProfile | null>(BASE_KEYS.USER, null);
  },

  setLocalUser(user: UserProfile | null): void {
    if (user) {
      safeSetItem(BASE_KEYS.USER, user);
    } else {
      safeRemoveItem(BASE_KEYS.USER);
    }
  },

  getCurrentUserId(): string | null {
    const user = this.getLocalUser();
    return user?.id || null;
  },

  // ---------------------------------------------
  // USER-SCOPED LIBRARY
  // ---------------------------------------------
  getLibrary(userId?: string | null): UserLibraryEntry[] {
    const uid = userId || this.getCurrentUserId();
    const key = getUserScopedKey(uid, 'library');
    return safeGetItem<UserLibraryEntry[]>(key, []);
  },

  setLibrary(list: UserLibraryEntry[], userId?: string | null): void {
    const uid = userId || this.getCurrentUserId();
    const key = getUserScopedKey(uid, 'library');
    safeSetItem(key, list);
  },

  saveLibraryEntry(entry: UserLibraryEntry, userId?: string | null): UserLibraryEntry[] {
    const uid = userId || entry.user_id || this.getCurrentUserId();
    const list = this.getLibrary(uid);
    const idx = list.findIndex(
      (e) =>
        e.manga_id.toString() === entry.manga_id.toString() ||
        (e.manga?.anilist_id && entry.manga?.anilist_id && e.manga.anilist_id === entry.manga.anilist_id) ||
        (e.manga?.id && entry.manga?.id && e.manga.id.toString() === entry.manga.id.toString())
    );
    const now = new Date().toISOString();
    const updated = {
      ...entry,
      updated_at: now
    };
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...updated };
    } else {
      list.unshift({ ...updated, created_at: now });
    }
    this.setLibrary(list, uid);
    return list;
  },

  removeLibraryEntry(mangaId: string | number, userId?: string | null): UserLibraryEntry[] {
    const uid = userId || this.getCurrentUserId();
    const list = this.getLibrary(uid).filter(
      (e) =>
        e.manga_id.toString() !== mangaId.toString() &&
        e.manga?.id?.toString() !== mangaId.toString() &&
        e.manga?.anilist_id?.toString() !== mangaId.toString()
    );
    this.setLibrary(list, uid);
    return list;
  },

  // ---------------------------------------------
  // USER-SCOPED READING PROGRESS
  // ---------------------------------------------
  getProgress(mangaId: string | number, userId?: string | null): UserProgress | null {
    const uid = userId || this.getCurrentUserId();
    const list = this.getAllProgress(uid);
    const idStr = mangaId.toString();
    return (
      list.find(
        (p) => p.manga_id.toString() === idStr || (typeof mangaId === 'number' && p.manga_id === mangaId.toString())
      ) || null
    );
  },

  getAllProgress(userId?: string | null): UserProgress[] {
    const uid = userId || this.getCurrentUserId();
    const key = getUserScopedKey(uid, 'progress');
    return safeGetItem<UserProgress[]>(key, []);
  },

  setAllProgress(list: UserProgress[], userId?: string | null): void {
    const uid = userId || this.getCurrentUserId();
    const key = getUserScopedKey(uid, 'progress');
    safeSetItem(key, list);
  },

  saveProgress(progress: UserProgress, userId?: string | null): void {
    const uid = userId || progress.user_id || this.getCurrentUserId();
    const list = this.getAllProgress(uid);
    const idStr = progress.manga_id.toString();
    const idx = list.findIndex((p) => p.manga_id.toString() === idStr);
    const updated = { ...progress, user_id: uid || progress.user_id, updated_at: new Date().toISOString() };
    if (idx >= 0) {
      list[idx] = updated;
    } else {
      list.push(updated);
    }
    this.setAllProgress(list, uid);
  },

  // ---------------------------------------------
  // USER-SCOPED MATERIAL PROGRESS
  // ---------------------------------------------
  getMaterialProgress(materialId: string, userId?: string | null): UserMaterialProgress | null {
    const uid = userId || this.getCurrentUserId();
    const list = this.getAllMaterialProgress(uid);
    return list.find((p) => p.material_id === materialId) || null;
  },

  getAllMaterialProgress(userId?: string | null): UserMaterialProgress[] {
    const uid = userId || this.getCurrentUserId();
    const key = getUserScopedKey(uid, 'mat_progress');
    return safeGetItem<UserMaterialProgress[]>(key, []);
  },

  setAllMaterialProgress(list: UserMaterialProgress[], userId?: string | null): void {
    const uid = userId || this.getCurrentUserId();
    const key = getUserScopedKey(uid, 'mat_progress');
    safeSetItem(key, list);
  },

  saveMaterialProgress(progress: UserMaterialProgress, userId?: string | null): void {
    const uid = userId || progress.user_id || this.getCurrentUserId();
    const list = this.getAllMaterialProgress(uid);
    const idx = list.findIndex((p) => p.material_id === progress.material_id);
    const updated = { ...progress, user_id: uid || progress.user_id, updated_at: new Date().toISOString() };
    if (idx >= 0) {
      list[idx] = updated;
    } else {
      list.push(updated);
    }
    this.setAllMaterialProgress(list, uid);
  },

  // ---------------------------------------------
  // USER-SCOPED FAVORITES (Timestamp-Tracked)
  // ---------------------------------------------
  getFavoriteEntries(userId?: string | null): Array<{ manga_id: string; created_at: string; manga?: Manga }> {
    const uid = userId || this.getCurrentUserId();
    const key = getUserScopedKey(uid, 'favorite_entries');
    const entries = safeGetItem<Array<{ manga_id: string; created_at: string; manga?: Manga }>>(key, []);
    return [...entries].sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
  },

  setFavoriteEntries(
    entries: Array<{ manga_id: string; created_at: string; manga?: Manga }>,
    userId?: string | null
  ): void {
    const uid = userId || this.getCurrentUserId();
    const key = getUserScopedKey(uid, 'favorite_entries');
    const sorted = [...entries].sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    safeSetItem(key, sorted);

    // Keep legacy string[] key in sync with newest-first order
    const legacyKey = getUserScopedKey(uid, 'favorites');
    safeSetItem(legacyKey, sorted.map((e) => e.manga_id));
  },

  getFavorites(userId?: string | null): string[] {
    const uid = userId || this.getCurrentUserId();
    const entries = this.getFavoriteEntries(uid);
    if (entries.length > 0) {
      return entries.map((e) => e.manga_id);
    }
    const legacyKey = getUserScopedKey(uid, 'favorites');
    return safeGetItem<string[]>(legacyKey, []);
  },

  setFavorites(list: string[], userId?: string | null): void {
    const uid = userId || this.getCurrentUserId();
    const currentEntries = this.getFavoriteEntries(uid);
    const now = new Date().toISOString();

    const newEntries: Array<{ manga_id: string; created_at: string; manga?: Manga }> = [];
    const seen = new Set<string>();

    list.forEach((id, index) => {
      const idStr = id.toString();
      if (seen.has(idStr)) return;
      seen.add(idStr);

      const existing = currentEntries.find((e) => e.manga_id.toString() === idStr);
      if (existing) {
        newEntries.push(existing);
      } else {
        // preserve list ordering by descending fake offsets if newly mass-set
        const simulatedTime = new Date(Date.now() - index * 1000).toISOString();
        newEntries.push({ manga_id: idStr, created_at: simulatedTime });
      }
    });

    this.setFavoriteEntries(newEntries, uid);
  },

  toggleFavorite(mangaOrId: Manga | string | number, userId?: string | null): boolean {
    const uid = userId || this.getCurrentUserId();
    const idStr = typeof mangaOrId === 'object' && mangaOrId !== null ? mangaOrId.id.toString() : mangaOrId.toString();
    const anilistIdStr = typeof mangaOrId === 'object' && mangaOrId !== null && mangaOrId.anilist_id ? mangaOrId.anilist_id.toString() : null;
    const mangaObj = typeof mangaOrId === 'object' && mangaOrId !== null ? (mangaOrId as Manga) : undefined;

    const entries = this.getFavoriteEntries(uid);
    const existingIndex = entries.findIndex(
      (e) => e.manga_id.toString() === idStr || (Boolean(anilistIdStr) && e.manga_id.toString() === anilistIdStr)
    );

    const isCurrentlyFav = existingIndex >= 0;

    if (isCurrentlyFav) {
      // Remove favorite
      const updated = entries.filter(
        (e) => e.manga_id.toString() !== idStr && (!anilistIdStr || e.manga_id.toString() !== anilistIdStr)
      );
      this.setFavoriteEntries(updated, uid);
      return false;
    } else {
      // Add favorite at top with current timestamp
      const newEntry = {
        manga_id: idStr,
        created_at: new Date().toISOString(),
        manga: mangaObj
      };
      this.setFavoriteEntries([newEntry, ...entries], uid);
      return true;
    }
  },

  isFavorite(mangaId: string | number, userId?: string | null): boolean {
    const uid = userId || this.getCurrentUserId();
    return this.getFavorites(uid).includes(mangaId.toString());
  },

  // ---------------------------------------------
  // USER-SCOPED NOTES
  // ---------------------------------------------
  getNotes(mangaId: string | number, userId?: string | null): UserNote | null {
    const uid = userId || this.getCurrentUserId();
    const list = this.getAllNotes(uid);
    const idStr = mangaId.toString();
    return list.find((n) => n.manga_id.toString() === idStr) || null;
  },

  getAllNotes(userId?: string | null): UserNote[] {
    const uid = userId || this.getCurrentUserId();
    const key = getUserScopedKey(uid, 'notes');
    return safeGetItem<UserNote[]>(key, []);
  },

  setAllNotes(list: UserNote[], userId?: string | null): void {
    const uid = userId || this.getCurrentUserId();
    const key = getUserScopedKey(uid, 'notes');
    safeSetItem(key, list);
  },

  saveNote(note: UserNote, userId?: string | null): void {
    const uid = userId || note.user_id || this.getCurrentUserId();
    const list = this.getAllNotes(uid);
    const idx = list.findIndex((n) => n.manga_id.toString() === note.manga_id.toString());
    const now = new Date().toISOString();
    const updated = { ...note, user_id: uid || note.user_id, updated_at: now };
    if (idx >= 0) {
      list[idx] = updated;
    } else {
      list.push({ ...updated, created_at: now });
    }
    this.setAllNotes(list, uid);
  },

  deleteNote(mangaId: string | number, userId?: string | null): void {
    const uid = userId || this.getCurrentUserId();
    const list = this.getAllNotes(uid);
    const updated = list.filter((n) => n.manga_id.toString() !== mangaId.toString());
    this.setAllNotes(updated, uid);
  },

  // ---------------------------------------------
  // SYNC QUEUE (User-scoped)
  // ---------------------------------------------
  getSyncQueue(userId?: string | null): SyncQueueItem[] {
    const uid = userId || this.getCurrentUserId();
    const key = getUserScopedKey(uid, 'sync_queue');
    return safeGetItem<SyncQueueItem[]>(key, []);
  },

  setSyncQueue(queue: SyncQueueItem[], userId?: string | null): void {
    const uid = userId || this.getCurrentUserId();
    const key = getUserScopedKey(uid, 'sync_queue');
    safeSetItem(key, queue);
  },

  addToSyncQueue(item: SyncQueueItem, userId?: string | null): void {
    const uid = userId || this.getCurrentUserId();
    const queue = this.getSyncQueue(uid);
    const filtered = queue.filter(
      (q) => !(q.type === item.type && JSON.stringify(q.payload) === JSON.stringify(item.payload))
    );
    filtered.push(item);
    this.setSyncQueue(filtered, uid);
  },

  clearSyncQueue(userId?: string | null): void {
    const uid = userId || this.getCurrentUserId();
    const key = getUserScopedKey(uid, 'sync_queue');
    safeRemoveItem(key);
  },

  // ---------------------------------------------
  // RECENT SEARCHES (Global device preference)
  // ---------------------------------------------
  getRecentSearches(): string[] {
    return safeGetItem<string[]>(BASE_KEYS.RECENT_SEARCHES, []);
  },

  addRecentSearch(query: string): string[] {
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 2) return this.getRecentSearches();
    const list = this.getRecentSearches().filter((q) => q.toLowerCase() !== trimmed.toLowerCase());
    list.unshift(trimmed);
    const capped = list.slice(0, 8);
    safeSetItem(BASE_KEYS.RECENT_SEARCHES, capped);
    return capped;
  },

  clearRecentSearches(): void {
    safeRemoveItem(BASE_KEYS.RECENT_SEARCHES);
  },

  // Clear current active session (leaves user data safely in per-user partitions)
  clearUserData(): void {
    safeRemoveItem(BASE_KEYS.USER);
  },

  // Completely purge all local storage and session data belonging to a deleted user
  purgeUserLocalData(userId?: string | null): void {
    const uid = userId || this.getCurrentUserId();
    if (uid) {
      safeRemoveItem(getUserScopedKey(uid, 'library'));
      safeRemoveItem(getUserScopedKey(uid, 'progress'));
      safeRemoveItem(getUserScopedKey(uid, 'mat_progress'));
      safeRemoveItem(getUserScopedKey(uid, 'favorites'));
      safeRemoveItem(getUserScopedKey(uid, 'notes'));
      safeRemoveItem(getUserScopedKey(uid, 'sync_queue'));

      // Remove any dynamic local keys matching this user id
      try {
        if (typeof localStorage !== 'undefined') {
          const userPrefix = `letmecheck_u_${uid.trim()}_`;
          const keysToDelete: string[] = [];
          for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && k.startsWith(userPrefix)) {
              keysToDelete.push(k);
            }
          }
          keysToDelete.forEach((k) => safeRemoveItem(k));
        }
      } catch (err) {
        console.warn('Error purging user-scoped keys from localStorage:', err);
      }
    }

    // Clear user session profile
    safeRemoveItem(BASE_KEYS.USER);

    // Clear persisted search history and search query cache
    safeRemoveItem(BASE_KEYS.RECENT_SEARCHES);
    safeRemoveItem(BASE_KEYS.SEARCH_CACHE);

    // Clear session storage if available
    try {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.clear();
      }
    } catch (e) {
      console.warn('Error clearing sessionStorage:', e);
    }
  }
};
