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
  const { user, loading: authLoading } = useAuth();
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
  const [authActionTitle, setAuthActionTitle] = useState('sync your LetMeCheck library');

  // Listen to sync engine
  useEffect(() => {
    const unsubscribe = syncEngine.subscribe((status, count) => {
      setSyncStatus(status);
      setPendingSyncCount(count);
    });
    return unsubscribe;
  }, []);

  const requireAuth = (actionDescription = 'sync your LetMeCheck library'): boolean => {
    if (!user) {
      setAuthActionTitle(actionDescription);
      setIsAuthModalOpen(true);
      return false;
    }
    return true;
  };

  const refreshLibrary = useCallback(async () => {
    if (!user) {
      setLibrary([]);
      setFavorites([]);
      setAllProgress({});
      setAllMaterialProgress({});
      setNotes({});
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const userId = user.id;
      const [libData, favData, progList, matList, notesList] = await Promise.all([
        supabaseService.getLibrary(userId),
        supabaseService.getFavorites(userId),
        supabaseService.getAllProgress(userId),
        supabaseService.getAllMaterialProgress(userId),
        supabaseService.getAllNotes(userId)
      ]);

      setLibrary(libData);
      setFavorites(favData);

      const progMap: Record<string, UserProgress> = {};
      progList.forEach((p) => {
        if (p.manga_id) {
          progMap[p.manga_id.toString()] = p;
        }
      });
      setAllProgress(progMap);

      const matMap: Record<string, UserMaterialProgress> = {};
      matList.forEach((m) => {
        if (m.material_id) {
          matMap[m.material_id] = m;
        }
      });
      setAllMaterialProgress(matMap);

      const notesMap: Record<string, UserNote> = {};
      notesList.forEach((n) => {
        if (n.manga_id) {
          notesMap[n.manga_id.toString()] = n;
        }
      });
      setNotes(notesMap);
    } catch (e) {
      console.warn('Failed to load user library data:', e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
      refreshLibrary();
    }
  }, [authLoading, refreshLibrary]);

  const getEntryForManga = (mangaIdOrObj: string | number | Manga) => {
    if (!user) return undefined;
    const isObj = typeof mangaIdOrObj === 'object' && mangaIdOrObj !== null;
    const id = isObj ? (mangaIdOrObj as Manga).id : mangaIdOrObj;
    const anilistId = isObj
      ? (mangaIdOrObj as Manga).anilist_id
      : typeof mangaIdOrObj === 'number'
      ? mangaIdOrObj
      : !isNaN(Number(mangaIdOrObj))
      ? Number(mangaIdOrObj)
      : undefined;

    const idStr = id !== undefined && id !== null ? id.toString() : '';
    const anilistStr = anilistId !== undefined ? anilistId.toString() : '';

    return library.find((e) => {
      if (idStr && e.manga_id.toString() === idStr) return true;
      if (anilistStr && e.manga?.anilist_id && e.manga.anilist_id.toString() === anilistStr) return true;
      if (idStr && e.manga?.id && e.manga.id.toString() === idStr) return true;
      if (anilistStr && e.manga_id.toString() === anilistStr) return true;
      return false;
    });
  };

  const getProgressForManga = (mangaIdOrObj: string | number | Manga) => {
    if (!user) return undefined;
    const isObj = typeof mangaIdOrObj === 'object' && mangaIdOrObj !== null;
    const id = isObj ? (mangaIdOrObj as Manga).id : mangaIdOrObj;
    const anilistId = isObj
      ? (mangaIdOrObj as Manga).anilist_id
      : typeof mangaIdOrObj === 'number'
      ? mangaIdOrObj
      : !isNaN(Number(mangaIdOrObj))
      ? Number(mangaIdOrObj)
      : undefined;

    const idStr = id !== undefined && id !== null ? id.toString() : '';
    const anilistStr = anilistId !== undefined ? anilistId.toString() : '';

    if (idStr && allProgress[idStr]) return allProgress[idStr];
    if (anilistStr && allProgress[anilistStr]) return allProgress[anilistStr];

    // Check if manga is in library and mapped by its database ID
    const entry = getEntryForManga(mangaIdOrObj);
    if (entry && entry.manga_id && allProgress[entry.manga_id.toString()]) {
      return allProgress[entry.manga_id.toString()];
    }

    return undefined;
  };

  const getMaterialProgress = (materialId: string) => {
    if (!user) return undefined;
    return allMaterialProgress[materialId];
  };

  const getNoteForManga = (mangaIdOrObj: string | number | Manga) => {
    if (!user) return undefined;
    const isObj = typeof mangaIdOrObj === 'object' && mangaIdOrObj !== null;
    const id = isObj ? (mangaIdOrObj as Manga).id : mangaIdOrObj;
    const anilistId = isObj
      ? (mangaIdOrObj as Manga).anilist_id
      : typeof mangaIdOrObj === 'number'
      ? mangaIdOrObj
      : !isNaN(Number(mangaIdOrObj))
      ? Number(mangaIdOrObj)
      : undefined;

    const idStr = id !== undefined && id !== null ? id.toString() : '';
    const anilistStr = anilistId !== undefined ? anilistId.toString() : '';

    if (idStr && notes[idStr]) return notes[idStr];
    if (anilistStr && notes[anilistStr]) return notes[anilistStr];

    const entry = getEntryForManga(mangaIdOrObj);
    if (entry && entry.manga_id && notes[entry.manga_id.toString()]) {
      return notes[entry.manga_id.toString()];
    }

    return undefined;
  };

  const isMangaFavorite = (mangaIdOrObj: string | number | Manga) => {
    if (!user) return false;
    const isObj = typeof mangaIdOrObj === 'object' && mangaIdOrObj !== null;
    const id = isObj ? (mangaIdOrObj as Manga).id : mangaIdOrObj;
    const anilistId = isObj
      ? (mangaIdOrObj as Manga).anilist_id
      : typeof mangaIdOrObj === 'number'
      ? mangaIdOrObj
      : !isNaN(Number(mangaIdOrObj))
      ? Number(mangaIdOrObj)
      : undefined;

    const idStr = id !== undefined && id !== null ? id.toString() : '';
    const anilistStr = anilistId !== undefined ? anilistId.toString() : '';

    if (idStr && favorites.includes(idStr)) return true;
    if (anilistStr && favorites.includes(anilistStr)) return true;

    const entry = getEntryForManga(mangaIdOrObj);
    if (entry && entry.manga_id && favorites.includes(entry.manga_id.toString())) {
      return true;
    }

    return false;
  };

  const updateStatus = async (manga: Manga, status: ReadingStatus): Promise<boolean> => {
    if (!requireAuth('save titles to your library')) {
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
          (e.manga?.anilist_id && manga.anilist_id && e.manga.anilist_id === manga.anilist_id) ||
          (e.manga?.id && manga.id && e.manga.id.toString() === manga.id.toString())
      );
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], status, manga: entry.manga || manga, updated_at: new Date().toISOString() };
        return next;
      }
      return [entry, ...prev];
    });

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
          e.manga?.id?.toString() !== mangaId.toString() &&
          e.manga?.anilist_id?.toString() !== mangaId.toString()
      )
    );

    return true;
  };

  const updateChapterProgress = async (
    manga: Manga,
    chapters: number,
    volumes?: number
  ): Promise<boolean> => {
    if (!requireAuth('track your watch and reading progress')) {
      return false;
    }

    const userId = user!.id;
    const mangaIdStr = manga.id.toString();
    const existingProg = getProgressForManga(manga);
    const vols = volumes !== undefined ? volumes : existingProg?.volumes_read || 0;
    const chaps = Math.max(0, chapters);

    const result = await supabaseService.saveProgress(userId, manga.id, chaps, vols);

    if (!result.success) {
      console.error('Failed to save progress:', result.error);
      return false;
    }

    const progRecord = result.progress;
    setAllProgress((prev) => {
      const next = { ...prev, [mangaIdStr]: progRecord };
      if (manga.anilist_id) {
        next[manga.anilist_id.toString()] = progRecord;
      }
      return next;
    });

    // Progression logic
    const currentEntry = getEntryForManga(manga);
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

    return true;
  };

  const updateMaterialStatus = async (
    materialId: string,
    status: MaterialStatus,
    progress = 0
  ): Promise<boolean> => {
    if (!requireAuth('track adaptation, movie & material progress')) {
      return false;
    }

    const userId = user!.id;
    const result = await supabaseService.saveMaterialProgress(userId, materialId, status, progress);

    if (!result.success) {
      console.error('Failed to save material progress:', result.error);
      return false;
    }

    setAllMaterialProgress((prev) => ({ ...prev, [materialId]: result.data }));
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
        return Array.from(new Set([idStr, ...(anilistIdStr ? [anilistIdStr] : []), ...prev]));
      } else {
        return prev.filter((id) => id !== idStr && id !== anilistIdStr);
      }
    });

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

    const idStr = mangaId.toString();
    setNotes((prev) => ({ ...prev, [idStr]: result.note }));
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

    const idStr = mangaId.toString();
    setNotes((prev) => {
      const next = { ...prev };
      delete next[idStr];
      return next;
    });

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
    favorites: favorites.length,
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
        loading: loading || authLoading,
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
