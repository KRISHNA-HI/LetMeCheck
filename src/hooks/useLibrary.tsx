import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback
} from 'react';
import {
  Manga,
  UserLibraryEntry,
  UserProgress,
  UserMaterialProgress,
  UserNote,
  ReadingStatus,
  MaterialStatus,
  LibraryStats
} from '../types';
import { supabaseService } from '../services/supabase';
import { localStorageService } from '../services/storage';
import { syncEngine, SyncStatus } from '../services/sync';
import { useAuth } from './useAuth';
import { AuthPromptModal } from '../components/common/AuthPromptModal';

interface LibraryContextType {
  library: UserLibraryEntry[];
  favorites: string[];
  allProgress: Record<string, UserProgress>;
  allMaterialProgress: Record<string, UserMaterialProgress>;
  notes: Record<string, UserNote>;
  loading: boolean;
  stats: LibraryStats;
  syncStatus: SyncStatus;
  pendingSyncCount: number;
  getEntryForManga: (manga: Manga | string | number) => UserLibraryEntry | undefined;
  getProgressForManga: (manga: Manga | string | number) => UserProgress | undefined;
  getMaterialProgress: (materialId: string) => UserMaterialProgress | undefined;
  getNoteForManga: (manga: Manga | string | number) => UserNote | undefined;
  isMangaFavorite: (manga: Manga | string | number) => boolean;
  updateStatus: (manga: Manga, status: ReadingStatus) => Promise<boolean>;
  removeFromLibrary: (mangaId: string | number) => Promise<boolean>;
  updateChapterProgress: (manga: Manga, chapters: number, volumes?: number) => Promise<boolean>;
  updateMaterialStatus: (materialId: string, status: MaterialStatus, progress?: number) => Promise<boolean>;
  toggleFavorite: (manga: Manga) => Promise<boolean>;
  saveMangaNote: (mangaId: string | number, content: string) => Promise<boolean>;
  deleteMangaNote: (mangaId: string | number) => Promise<boolean>;
  refreshLibrary: () => Promise<void>;
  requireAuth: (actionDescription?: string) => boolean;
}

const LibraryContext = createContext<LibraryContextType | undefined>(undefined);

export const LibraryProvider: React.FC<{ children: ReactNode; navigate?: (route: string) => void }> = ({
  children,
  navigate
}) => {
  const { user } = useAuth();
  const [library, setLibrary] = useState<UserLibraryEntry[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [allProgress, setAllProgress] = useState<Record<string, UserProgress>>({});
  const [allMaterialProgress, setAllMaterialProgress] = useState<Record<string, UserMaterialProgress>>({});
  const [notes, setNotes] = useState<Record<string, UserNote>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);

  // Auth Prompt Modal State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authActionTitle, setAuthActionTitle] = useState('track your reading');

  // Listen to sync engine
  useEffect(() => {
    const unsubscribe = syncEngine.subscribe((status, count) => {
      setSyncStatus(status);
      setPendingSyncCount(count);
    });
    return unsubscribe;
  }, []);

  const requireAuth = (actionDescription = 'track your reading'): boolean => {
    if (!user) {
      setAuthActionTitle(actionDescription);
      setIsAuthModalOpen(true);
      return false;
    }
    return true;
  };

  const refreshLibrary = useCallback(async () => {
    setLoading(true);
    try {
      if (user) {
        const [libData, favData] = await Promise.all([
          supabaseService.getLibrary(user.id),
          supabaseService.getFavorites(user.id)
        ]);
        setLibrary(libData);
        setFavorites(favData);

        const progList = localStorageService.getAllProgress();
        const progMap: Record<string, UserProgress> = {};
        progList.forEach((p) => {
          progMap[p.manga_id.toString()] = p;
        });
        setAllProgress(progMap);

        const matList = localStorageService.getAllMaterialProgress();
        const matMap: Record<string, UserMaterialProgress> = {};
        matList.forEach((m) => {
          matMap[m.material_id] = m;
        });
        setAllMaterialProgress(matMap);
      } else {
        // Strict: Logged-out users have empty library and favorites
        setLibrary([]);
        setFavorites([]);
        setAllProgress({});
        setAllMaterialProgress({});
        setNotes({});
      }
    } catch (e) {
      console.warn('Failed to load library:', e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refreshLibrary();
  }, [refreshLibrary]);

  const getEntryForManga = (mangaIdOrObj: string | number | Manga) => {
    if (!user) return undefined;
    const id = typeof mangaIdOrObj === 'object' && mangaIdOrObj !== null ? mangaIdOrObj.id : mangaIdOrObj;
    const anilistId = typeof mangaIdOrObj === 'object' && mangaIdOrObj !== null ? mangaIdOrObj.anilist_id : (typeof mangaIdOrObj === 'number' ? mangaIdOrObj : undefined);

    return library.find((e) => {
      if (id && e.manga_id.toString() === id.toString()) return true;
      if (anilistId && e.manga?.anilist_id === anilistId) return true;
      if (id && e.manga?.id && e.manga.id.toString() === id.toString()) return true;
      return false;
    });
  };

  const getProgressForManga = (mangaIdOrObj: string | number | Manga) => {
    if (!user) return undefined;
    const id = typeof mangaIdOrObj === 'object' && mangaIdOrObj !== null ? mangaIdOrObj.id : mangaIdOrObj;
    const anilistId = typeof mangaIdOrObj === 'object' && mangaIdOrObj !== null ? mangaIdOrObj.anilist_id : (typeof mangaIdOrObj === 'number' ? mangaIdOrObj : undefined);

    if (id && allProgress[id.toString()]) return allProgress[id.toString()];
    if (anilistId && allProgress[anilistId.toString()]) return allProgress[anilistId.toString()];
    return undefined;
  };

  const getMaterialProgress = (materialId: string) => {
    if (!user) return undefined;
    return allMaterialProgress[materialId];
  };

  const getNoteForManga = (mangaIdOrObj: string | number | Manga) => {
    if (!user) return undefined;
    const id = typeof mangaIdOrObj === 'object' && mangaIdOrObj !== null ? mangaIdOrObj.id : mangaIdOrObj;
    const idStr = id ? id.toString() : '';
    if (idStr && notes[idStr]) return notes[idStr];
    if (idStr) {
      const local = localStorageService.getNotes(idStr);
      if (local) {
        setNotes((prev) => ({ ...prev, [idStr]: local }));
        return local;
      }
    }
    return undefined;
  };

  const isMangaFavorite = (mangaIdOrObj: string | number | Manga) => {
    if (!user) return false;
    const id = typeof mangaIdOrObj === 'object' && mangaIdOrObj !== null ? mangaIdOrObj.id : mangaIdOrObj;
    const anilistId = typeof mangaIdOrObj === 'object' && mangaIdOrObj !== null ? mangaIdOrObj.anilist_id : (typeof mangaIdOrObj === 'number' ? mangaIdOrObj : undefined);

    if (id && favorites.includes(id.toString())) return true;
    if (anilistId && favorites.includes(anilistId.toString())) return true;
    return false;
  };

  const updateStatus = async (manga: Manga, status: ReadingStatus): Promise<boolean> => {
    if (!requireAuth('save manga to your library')) {
      return false;
    }

    const userId = user!.id;
    const result = await supabaseService.upsertLibraryEntry(userId, manga, status);

    if (!result.success) {
      console.error('Failed to update library status:', result.error);
      return false;
    }

    const entry = result.entry;
    setLibrary((prev) => {
      const idx = prev.findIndex(
        (e) =>
          e.manga_id.toString() === manga.id.toString() ||
          (e.manga?.anilist_id && e.manga.anilist_id === manga.anilist_id)
      );
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], status, manga };
        return next;
      }
      return [entry, ...prev];
    });

    syncEngine.enqueue('UPSERT_LIBRARY', { manga, status });
    return true;
  };

  const removeFromLibrary = async (mangaId: string | number): Promise<boolean> => {
    if (!requireAuth('modify your library')) {
      return false;
    }

    const userId = user!.id;
    const result = await supabaseService.removeLibraryEntry(userId, mangaId);

    if (!result.success) {
      console.error('Failed to remove from library:', result.error);
      return false;
    }

    setLibrary((prev) =>
      prev.filter(
        (e) =>
          e.manga_id.toString() !== mangaId.toString() &&
          e.manga?.anilist_id?.toString() !== mangaId.toString()
      )
    );

    syncEngine.enqueue('REMOVE_LIBRARY', { mangaId });
    return true;
  };

  const updateChapterProgress = async (
    manga: Manga,
    chapters: number,
    volumes?: number
  ): Promise<boolean> => {
    if (!requireAuth('track your chapter progress')) {
      return false;
    }

    const userId = user!.id;
    const mangaIdStr = manga.id.toString();
    const existingProg = allProgress[mangaIdStr];
    const vols = volumes !== undefined ? volumes : existingProg?.volumes_read || 0;
    const chaps = Math.max(0, chapters);

    const result = await supabaseService.saveProgress(userId, manga.id, chaps, vols);

    if (!result.success) {
      console.error('Failed to save progress:', result.error);
      return false;
    }

    setAllProgress((prev) => ({ ...prev, [mangaIdStr]: result.progress }));

    // Progression logic
    const currentEntry = getEntryForManga(manga.id);
    let newStatus: ReadingStatus | null = null;

    if (!currentEntry) {
      newStatus = chaps > 0 ? 'Reading' : 'Pending';
    } else {
      const currentStatus = currentEntry.status;
      if (currentStatus !== 'On Hold' && currentStatus !== 'Dropped') {
        if (manga.chapters && chaps >= manga.chapters && manga.chapters > 0) {
          if (currentStatus !== 'Completed') newStatus = 'Completed';
        } else if (chaps > 0 && currentStatus === 'Pending') {
          newStatus = 'Reading';
        }
      }
    }

    if (newStatus) {
      await updateStatus(manga, newStatus);
    }

    syncEngine.enqueue('SAVE_PROGRESS', {
      mangaId: manga.id,
      chaptersRead: chaps,
      volumesRead: vols
    });

    return true;
  };

  const updateMaterialStatus = async (
    materialId: string,
    status: MaterialStatus,
    progress = 0
  ): Promise<boolean> => {
    if (!requireAuth('track adaptation & material progress')) {
      return false;
    }

    const userId = user!.id;
    const result = await supabaseService.saveMaterialProgress(userId, materialId, status, progress);

    if (!result.success) {
      console.error('Failed to save material progress:', result.error);
      return false;
    }

    setAllMaterialProgress((prev) => ({ ...prev, [materialId]: result.data }));

    syncEngine.enqueue('SAVE_MATERIAL_PROGRESS', { materialId, status, progress });
    return true;
  };

  const toggleFavorite = async (manga: Manga): Promise<boolean> => {
    if (!requireAuth('save titles to your favorites')) {
      return false;
    }

    const userId = user!.id;
    const result = await supabaseService.toggleFavorite(userId, manga);

    if (!result.success) {
      console.error('Failed to toggle favorite:', result.error);
      return false;
    }

    const isFav = result.isFavorite;
    const idStr = manga.id.toString();
    const anilistIdStr = manga.anilist_id?.toString();

    setFavorites((prev) => {
      if (isFav) {
        return [...prev, idStr, ...(anilistIdStr ? [anilistIdStr] : [])];
      } else {
        return prev.filter((id) => id !== idStr && id !== anilistIdStr);
      }
    });

    syncEngine.enqueue('TOGGLE_FAVORITE', { manga, isFavorite: isFav });
    return isFav;
  };

  const saveMangaNote = async (mangaId: string | number, content: string): Promise<boolean> => {
    if (!requireAuth('save personal notes')) {
      return false;
    }

    const userId = user!.id;
    const result = await supabaseService.saveNote(userId, mangaId, content);

    if (!result.success) {
      console.error('Failed to save note:', result.error);
      return false;
    }

    setNotes((prev) => ({ ...prev, [mangaId.toString()]: result.note }));

    syncEngine.enqueue('SAVE_NOTE', { mangaId, content });
    return true;
  };

  const deleteMangaNote = async (mangaId: string | number): Promise<boolean> => {
    if (!requireAuth('delete personal notes')) {
      return false;
    }

    const userId = user!.id;
    const result = await supabaseService.deleteNote(userId, mangaId);

    if (!result.success) {
      console.error('Failed to delete note:', result.error);
      return false;
    }

    setNotes((prev) => {
      const next = { ...prev };
      delete next[mangaId.toString()];
      return next;
    });

    syncEngine.enqueue('DELETE_NOTE', { mangaId });
    return true;
  };

  // Compute stats
  let chaptersReadCount = 0;
  let volumesReadCount = 0;
  Object.values(allProgress).forEach((p: any) => {
    chaptersReadCount += p?.chapters_read || 0;
    volumesReadCount += p?.volumes_read || 0;
  });

  const stats: LibraryStats = {
    total: library.length,
    reading: library.filter((e) => e.status === 'Reading').length,
    pending: library.filter((e) => e.status === 'Pending').length,
    completed: library.filter((e) => e.status === 'Completed').length,
    onHold: library.filter((e) => e.status === 'On Hold').length,
    dropped: library.filter((e) => e.status === 'Dropped').length,
    favorites: library.filter((e) => e.is_favorite || favorites.includes(e.manga_id.toString())).length || favorites.length,
    chaptersRead: chaptersReadCount,
    volumesRead: volumesReadCount
  };

  const handleModalLogin = () => {
    setIsAuthModalOpen(false);
    if (navigate) {
      navigate('login');
    } else {
      window.location.hash = '#/login';
    }
  };

  const handleModalRegister = () => {
    setIsAuthModalOpen(false);
    if (navigate) {
      navigate('register');
    } else {
      window.location.hash = '#/register';
    }
  };

  return (
    <LibraryContext.Provider
      value={{
        library,
        favorites,
        allProgress,
        allMaterialProgress,
        notes,
        loading,
        stats,
        syncStatus,
        pendingSyncCount,
        getEntryForManga,
        getProgressForManga,
        getMaterialProgress,
        getNoteForManga,
        isMangaFavorite,
        updateStatus,
        removeFromLibrary,
        updateChapterProgress,
        updateMaterialStatus,
        toggleFavorite,
        saveMangaNote,
        deleteMangaNote,
        refreshLibrary,
        requireAuth
      }}
    >
      {children}

      {/* Global Auth Prompt Modal */}
      <AuthPromptModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLogin={handleModalLogin}
        onRegister={handleModalRegister}
        actionTitle={authActionTitle}
      />
    </LibraryContext.Provider>
  );
};

export function useLibrary() {
  const context = useContext(LibraryContext);
  if (!context) {
    throw new Error('useLibrary must be used within a LibraryProvider');
  }
  return context;
}
