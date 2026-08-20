import React, { useEffect, useState } from 'react';
import { Heart, Sparkles, ArrowRight, BookOpen } from 'lucide-react';
import { Manga } from '../types';
import { useAuth } from '../hooks/useAuth';
import { useLibrary } from '../hooks/useLibrary';
import { MangaGrid } from '../components/manga/MangaGrid';
import { mangaApi } from '../services/mangaApi';

interface FavoritesProps {
  navigate: (route: string) => void;
  onSelectManga: (manga: Manga) => void;
}

export const Favorites: React.FC<FavoritesProps> = ({ navigate, onSelectManga }) => {
  const { user, loading: authLoading } = useAuth();
  const { favorites, library, stats, requireAuth, loading: libraryLoading } = useLibrary();
  const [favoriteMangaList, setFavoriteMangaList] = useState<Manga[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    if (!user) {
      setFavoriteMangaList([]);
      return;
    }

    const loadFavorites = async () => {
      setLoading(true);
      try {
        const loaded: Manga[] = [];

        // 1. Gather all mangas already present in user library entries
        library.forEach((entry) => {
          if (
            entry.manga &&
            (entry.is_favorite ||
              favorites.includes(entry.manga_id.toString()) ||
              (entry.manga.anilist_id && favorites.includes(entry.manga.anilist_id.toString())))
          ) {
            if (!loaded.some((m) => m.id.toString() === entry.manga!.id.toString())) {
              loaded.push(entry.manga);
            }
          }
        });

        // 2. For any favorite ID not found in library, fetch from mangaApi
        const missingIds = favorites.filter(
          (id) => !loaded.some((m) => m.id.toString() === id.toString() || m.anilist_id?.toString() === id.toString())
        );

        if (missingIds.length > 0) {
          const fetched = await Promise.all(
            missingIds.slice(0, 15).map((id) => mangaApi.getMangaById(id))
          );
          fetched.forEach((m) => {
            if (m && !loaded.some((item) => item.id.toString() === m.id.toString())) {
              loaded.push(m);
            }
          });
        }

        if (isMounted) {
          setFavoriteMangaList(loaded);
        }
      } catch (err) {
        console.warn('Failed to load favorite details:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadFavorites();
    return () => {
      isMounted = false;
    };
  }, [user, favorites, library]);

  if (authLoading || (user && libraryLoading)) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-center max-w-lg mx-auto">
        <div className="w-8 h-8 rounded-full border-2 border-pink-400 border-t-transparent animate-spin mb-4" />
        <p className="text-xs text-zinc-400">Loading your favorites...</p>
      </div>
    );
  }

  // If user is not logged in, show auth gate
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center p-8 sm:p-16 text-center max-w-lg mx-auto">
        <div className="w-14 h-14 rounded-2xl bg-pink-500/15 text-pink-400 flex items-center justify-center mb-4 border border-pink-500/30 shadow-lg shadow-pink-500/10">
          <Heart className="w-7 h-7" />
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-zinc-100 mb-2">Favorites is a Personal Feature</h2>
        <p className="text-xs sm:text-sm text-zinc-400 mb-6 leading-relaxed">
          Create a free account to bookmark your top movies, TV series, anime, and manga, organize favorites, and sync your collection across all devices.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
          <button
            onClick={() => navigate('login')}
            className="flex-1 py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-bold text-xs transition-colors border border-zinc-700 cursor-pointer"
          >
            Sign In
          </button>
          <button
            onClick={() => navigate('register')}
            className="flex-1 py-2.5 px-4 rounded-xl bg-sky-500 hover:bg-sky-400 text-zinc-950 font-bold text-xs transition-colors shadow-lg shadow-sky-500/20 cursor-pointer"
          >
            Create Account
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-28 md:pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-100 flex items-center gap-2.5">
            <Heart className="w-7 h-7 text-pink-500 fill-pink-500/30" />
            <span>Favorited Titles</span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Your handpicked masterpiece collection — quick access to your top series
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono bg-zinc-900 px-3 py-1.5 rounded-xl border border-zinc-800 text-pink-400 font-semibold">
            {stats.favorites} Titles Saved
          </span>
        </div>
      </div>

      {/* Grid */}
      {favoriteMangaList.length === 0 && !loading ? (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-zinc-900/40 rounded-2xl border border-zinc-800 my-4">
          <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 mb-3">
            <Heart className="w-6 h-6 text-pink-500" />
          </div>
          <h4 className="text-base font-bold text-zinc-200 mb-1">No Favorites Yet</h4>
          <p className="text-xs text-zinc-400 max-w-sm mb-4">
            Click the heart icon on any manga card or details page to add it to your hall of fame!
          </p>
          <button
            onClick={() => navigate('discover')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-zinc-950 font-bold text-xs transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Discover Great Manga</span>
          </button>
        </div>
      ) : (
        <MangaGrid
          items={favoriteMangaList}
          loading={loading}
          skeletonCount={6}
          onSelectManga={onSelectManga}
          showProgress={true}
        />
      )}
    </div>
  );
};
