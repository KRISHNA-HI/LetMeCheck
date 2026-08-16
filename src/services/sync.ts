import { localStorageService } from './storage';
import { supabaseService, isSupabaseConfigured } from './supabase';
import { Manga, ReadingStatus, MaterialStatus, UserProgress, UserMaterialProgress, UserNote, UserLibraryEntry } from '../types';

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'offline' | 'error';

export interface SyncQueueItem {
  id: string;
  type:
    | 'UPSERT_LIBRARY'
    | 'REMOVE_LIBRARY'
    | 'SAVE_PROGRESS'
    | 'SAVE_MATERIAL_PROGRESS'
    | 'TOGGLE_FAVORITE'
    | 'SAVE_NOTE'
    | 'DELETE_NOTE';
  payload: any;
  timestamp: number;
  retryCount: number;
}

type SyncListener = (status: SyncStatus, pendingCount: number) => void;

class SyncEngine {
  private isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private currentStatus: SyncStatus = 'idle';
  private listeners: Set<SyncListener> = new Set();
  private isProcessing: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.notify();
        this.processQueue();
      });

      window.addEventListener('offline', () => {
        this.isOnline = false;
        this.currentStatus = 'offline';
        this.notify();
      });
    }
  }

  public subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    listener(this.getStatus(), this.getPendingCount());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const status = this.getStatus();
    const count = this.getPendingCount();
    this.listeners.forEach((fn) => fn(status, count));
  }

  public getStatus(): SyncStatus {
    if (!this.isOnline) return 'offline';
    return this.currentStatus;
  }

  public getPendingCount(): number {
    return localStorageService.getSyncQueue().length;
  }

  public enqueue(
    type: SyncQueueItem['type'],
    payload: any
  ) {
    const item: SyncQueueItem = {
      id: `sync_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      type,
      payload,
      timestamp: Date.now(),
      retryCount: 0
    };

    localStorageService.addToSyncQueue(item);
    this.notify();

    // Trigger sync if online
    if (this.isOnline && isSupabaseConfigured()) {
      this.processQueue();
    }
  }

  public async processQueue(): Promise<void> {
    if (this.isProcessing || !this.isOnline || !isSupabaseConfigured()) {
      return;
    }

    const queue = localStorageService.getSyncQueue();
    if (queue.length === 0) {
      this.currentStatus = 'synced';
      this.notify();
      return;
    }

    this.isProcessing = true;
    this.currentStatus = 'syncing';
    this.notify();

    const user = await supabaseService.getCurrentUser();
    if (!user) {
      this.isProcessing = false;
      this.currentStatus = 'idle';
      this.notify();
      return;
    }

    const remainingQueue: SyncQueueItem[] = [];

    for (const item of queue) {
      try {
        await this.processItem(user.id, item);
      } catch (err) {
        console.warn(`Sync failed for action ${item.type}:`, err);
        item.retryCount += 1;
        if (item.retryCount < 5) {
          remainingQueue.push(item);
        }
      }
    }

    localStorageService.setSyncQueue(remainingQueue);
    this.isProcessing = false;
    this.currentStatus = remainingQueue.length > 0 ? 'error' : 'synced';
    this.notify();
  }

  private async processItem(userId: string, item: SyncQueueItem): Promise<void> {
    switch (item.type) {
      case 'UPSERT_LIBRARY': {
        const { manga, status } = item.payload;
        const result = await supabaseService.upsertLibraryEntry(userId, manga, status);
        if (!result.success) {
          console.error('Sync: Failed to upsert library entry:', result.error);
        }
        break;
      }
      case 'REMOVE_LIBRARY': {
        const { mangaId } = item.payload;
        const result = await supabaseService.removeLibraryEntry(userId, mangaId);
        if (!result.success) {
          console.error('Sync: Failed to remove library entry:', result.error);
        }
        break;
      }
      case 'SAVE_PROGRESS': {
        const { mangaId, chaptersRead, volumesRead } = item.payload;
        const result = await supabaseService.saveProgress(userId, mangaId, chaptersRead, volumesRead);
        if (!result.success) {
          console.error('Sync: Failed to save progress:', result.error);
        }
        break;
      }
      case 'SAVE_MATERIAL_PROGRESS': {
        const { materialId, status, progress } = item.payload;
        const result = await supabaseService.saveMaterialProgress(userId, materialId, status, progress);
        if (!result.success) {
          console.error('Sync: Failed to save material progress:', result.error);
        }
        break;
      }
      case 'TOGGLE_FAVORITE': {
        const { manga, isFavorite } = item.payload;
        // Check current favorite state in Supabase and sync
        const favs = await supabaseService.getFavorites(userId);
        const alreadyFav = favs.includes(manga.id.toString()) || (manga.anilist_id && favs.includes(manga.anilist_id.toString()));
        if (isFavorite !== alreadyFav) {
          const result = await supabaseService.toggleFavorite(userId, manga);
          if (!result.success) {
            console.error('Sync: Failed to toggle favorite:', result.error);
          }
        }
        break;
      }
      case 'SAVE_NOTE': {
        const { mangaId, content } = item.payload;
        const result = await supabaseService.saveNote(userId, mangaId, content);
        if (!result.success) {
          console.error('Sync: Failed to save note:', result.error);
        }
        break;
      }
      case 'DELETE_NOTE': {
        const { mangaId } = item.payload;
        const result = await supabaseService.deleteNote(userId, mangaId);
        if (!result.success) {
          console.error('Sync: Failed to delete note:', result.error);
        }
        break;
      }
      default:
        break;
    }
  }
}

export const syncEngine = new SyncEngine();
