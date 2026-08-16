import React, { useEffect, useState, useMemo } from 'react';
import {
  TrendingUp,
  Clock,
  Sparkles,
  BookOpen,
  Bookmark,
  Heart,
  ArrowRight,
  Search as SearchIcon
} from 'lucide-react';
import { Manga } from '../types';
import { mangaApi } from '../services/mangaApi';
import { localStorageService } from '../services/storage';
import { useAuth } from '../hooks/useAuth';
import { useLibrary } from '../hooks/useLibrary';
import { MangaGrid } from '../components/manga/MangaGrid';
import { StatusSelector } from '../components/manga/StatusSelector';
import { ProgressBar } from '../components/common/ProgressBar';
import { ImageWithFallback } from '../components/common/ImageWithFallback';
import { SAMPLE_NARUTO, SAMPLE_MANGA } from '../data/sampleManga';
import { getDisplayTitle } from '../utils/formatters';

interface HomeProps {
  navigate: (route: string) => void;
  onSelectManga: (manga: Manga) => void;
}

export const Home: React.FC<HomeProps> = ({ navigate, onSelectManga }) => {
  const { user } = useAuth();
  const { library, favorites, stats, getProgressForManga, isMangaFavorite, toggleFavorite } = useLibrary();

  // AniList dynamic discovery lists
  const [defaultNaruto, setDefaultNaruto] = useState<Manga>(SAMPLE_NARUTO);
  const [trending, setTrending] = useState<Manga[]>([]);
  const [popular, setPopular] = useState<Manga[]>([]);
  const [recentlyUpdated, setRecentlyUpdated] = useState<Manga[]>([]);
  const [loadingDiscovery, setLoadingDiscovery] = useState<boolean>(true);

  // Search-based personalization
  const [latestSearchQuery, setLatestSearchQuery] = useState<string>('');
  const [recentSearchManga, setRecentSearchManga] = useState<Manga[]>([]);

  // Favorite manga objects for personalized section
  const [favoriteMangaList, setFavoriteMangaList] = useState<Manga[]>([]);

  // 1. Fetch default Naruto data and discovery lists from AniList
  useEffect(() => {
    let isMounted = true;

    const fetchDiscoveryData = async () => {
      setLoadingDiscovery(true);
      try {
        const [narutoData, trendData, popData, recentData] = await Promise.all([
          mangaApi.getDefaultNarutoManga(),
          mangaApi.getTrendingManga(1, 10),
          mangaApi.getPopularManga(1, 10),
          mangaApi.getRecentlyUpdated(1, 10)
        ]);

        if (isMounted) {
          if (narutoData) setDefaultNaruto(narutoData);
          setTrending(trendData);
          setPopular(popData);
          setRecentlyUpdated(recentData);
        }
      } catch (err) {
        console.warn('Failed to load discovery data, fallback applied:', err);
        if (isMounted) {
          setTrending(SAMPLE_MANGA);
          setPopular(SAMPLE_MANGA);
          setRecentlyUpdated(SAMPLE_MANGA);
        }
      } finally {
        if (isMounted) setLoadingDiscovery(false);
      }
    };

    fetchDiscoveryData();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Load recent searches and search-based recommendations
  useEffect(() => {
    let isMounted = true;
    const searches = localStorageService.getRecentSearches();

    if (searches.length > 0) {
      const topQuery = searches[0];
      setLatestSearchQuery(topQuery);

      mangaApi
        .searchManga(topQuery, 1, 6)
        .then((res) => {
          if (isMounted && res.items && res.items.length > 0) {
            setRecentSearchManga(res.items);
          }
        })
        .catch((err) => {
          console.warn('Failed to fetch search recommendations for Home:', err);
        });
    } else {
      setLatestSearchQuery('');
      setRecentSearchManga([]);
    }

    return () => {
      isMounted = false;
    };
  }, []);

  // 3. Resolve user's favorite manga objects for "From Your Favorites"
  useEffect(() => {
    let isMounted = true;

    if (!user || favorites.length === 0) {
      setFavoriteMangaList([]);
      return;
    }

    const loadFavorites = async () => {
      try {
        const loaded: Manga[] = [];

        // Gather from library first
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

        // Fetch any missing favorite IDs
        const missingIds = favorites.filter(
          (id) => !loaded.some((m) => m.id.toString() === id.toString() || m.anilist_id?.toString() === id.toString())
        );

        if (missingIds.length > 0) {
          const fetched = await Promise.all(
            missingIds.slice(0, 8).map((id) => mangaApi.getMangaById(id))
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
        console.warn('Failed to resolve favorites for Home:', err);
      }
    };

    loadFavorites();
    return () => {
      isMounted = false;
    };
  }, [user, favorites, library]);

  // 4. Compute sorted Currently Reading items (most recently active first)
  const currentlyReading = useMemo(() => {
    if (!user) return [];
    return library
      .filter((e) => e.status === 'Reading' && e.manga)
      .sort((a, b) => {
        const progA = getProgressForManga(a.manga_id);
        const progB = getProgressForManga(b.manga_id);
        const timeA = new Date(progA?.updated_at || a.updated_at || a.created_at || 0).getTime();
        const timeB = new Date(progB?.updated_at || b.updated_at || b.created_at || 0).getTime();
        return timeB - timeA;
      });
  }, [user, library, getProgressForManga]);

  // 5. Compute other Library titles (Plan to Read, Completed, etc.)
  const otherLibraryMangas = useMemo(() => {
    if (!user) return [];
    return library
      .filter((e) => e.status !== 'Reading' && e.manga)
      .map((e) => e.manga!);
  }, [user, library]);

  // 6. Dynamic Hero Resolution using Priority Rules:
  // Priority: 1. Currently Reading -> 2. Recently Searched -> 3. Favorites -> 4. Library -> 5. Default Naruto
  const { heroManga, heroBadge, isReadingHero } = useMemo(() => {
    if (currentlyReading.length > 0 && currentlyReading[0].manga) {
      return {
        heroManga: currentlyReading[0].manga,
        heroBadge: 'Continue Reading',
        isReadingHero: true
      };
    }

    if (recentSearchManga.length > 0 && recentSearchManga[0]) {
      return {
        heroManga: recentSearchManga[0],
        heroBadge: latestSearchQuery ? `Based on Search: ${latestSearchQuery}` : 'Recently Searched',
        isReadingHero: false
      };
    }

    if (user && favoriteMangaList.length > 0 && favoriteMangaList[0]) {
      return {
        heroManga: favoriteMangaList[0],
        heroBadge: 'From Your Favorites',
        isReadingHero: false
      };
    }

    if (user && otherLibraryMangas.length > 0 && otherLibraryMangas[0]) {
      return {
        heroManga: otherLibraryMangas[0],
        heroBadge: 'In Your Library',
        isReadingHero: false
      };
    }

    return {
      heroManga: defaultNaruto,
      heroBadge: 'Featured',
      isReadingHero: false
    };
  }, [currentlyReading, recentSearchManga, latestSearchQuery, user, favoriteMangaList, otherLibraryMangas, defaultNaruto]);

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20">
      {/* 1. Hero Featured / Personalized Section */}
      {heroManga && (
        <section className="relative rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl z-10 overflow-hidden">
          {/* Background Banner with Gradient Overlay */}
          <div className="absolute inset-0 z-0 overflow-hidden rounded-2xl">
            {heroManga.banner_url ? (
              <img
                src={heroManga.banner_url}
                alt={getDisplayTitle(heroManga)}
                loading="eager"
                decoding="async"
                className="w-full h-full object-cover opacity-25 filter blur-xs"
              />
            ) : (
              <img
                src={heroManga.cover_url}
                alt={getDisplayTitle(heroManga)}
                loading="eager"
                decoding="async"
                className="w-full h-full object-cover opacity-20 filter blur-md"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
          </div>

          {/* Hero Content */}
          <div className="relative z-10 p-6 sm:p-8 md:p-10 flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-8">
            {/* Cover Card */}
            <div
              onClick={() => onSelectManga(heroManga)}
              className="w-36 sm:w-48 md:w-52 aspect-[2/3] shrink-0 rounded-xl overflow-hidden border border-zinc-700/80 shadow-2xl cursor-pointer hover:scale-102 transition-transform"
            >
              <ImageWithFallback
                src={heroManga.cover_url}
                alt={getDisplayTitle(heroManga)}
                aspectRatio="aspect-[2/3]"
                priority={true}
              />
            </div>

            {/* Meta and Description */}
            <div className="flex flex-col items-center md:items-start text-center md:text-left gap-2.5 flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap justify-center md:justify-start">
                <span
                  className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                    isReadingHero
                      ? 'bg-sky-500/25 text-sky-300 border border-sky-500/40'
                      : heroBadge.includes('Favorites')
                      ? 'bg-rose-500/25 text-rose-300 border border-rose-500/40'
                      : heroBadge.includes('Search')
                      ? 'bg-indigo-500/25 text-indigo-300 border border-indigo-500/40'
                      : heroBadge.includes('Library')
                      ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40'
                      : 'bg-sky-500/20 text-sky-400'
                  }`}
                >
                  {heroBadge}
                </span>

                <span className="text-[10px] px-2 py-0.5 bg-zinc-800 text-zinc-300 rounded-full font-bold uppercase tracking-wider">
                  {heroManga.type}
                </span>

                <span className="text-[10px] px-2 py-0.5 bg-emerald-500/15 text-emerald-400 rounded-full font-bold uppercase tracking-wider">
                  {heroManga.status}
                </span>

                {heroManga.score && heroManga.score > 0 ? (
                  <span className="text-[10px] px-2 py-0.5 bg-amber-500/15 text-amber-300 rounded-full font-bold uppercase tracking-wider">
                    ★ {heroManga.score}%
                  </span>
                ) : null}
              </div>

              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-zinc-100 tracking-tight leading-tight line-clamp-2">
                {getDisplayTitle(heroManga)}
              </h1>

              {/* Genres */}
              <div className="flex flex-wrap gap-1 justify-center md:justify-start">
                {heroManga.genres?.slice(0, 5).map((g) => (
                  <span
                    key={g}
                    className="text-[10px] px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800 font-medium"
                  >
                    {g}
                  </span>
                ))}
              </div>

              <p className="text-xs text-zinc-400 line-clamp-2 md:line-clamp-3 max-w-2xl leading-relaxed">
                {heroManga.description}
              </p>

              {/* Progress if currently reading hero */}
              {isReadingHero && (
                <div className="w-full max-w-md my-1 p-2.5 rounded-xl bg-black/40 border border-zinc-800/80">
                  <ProgressBar
                    current={getProgressForManga(heroManga.id)?.chapters_read || 0}
                    total={heroManga.chapters}
                    size="sm"
                    showLabels={true}
                    unitLabel="Ch."
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5 mt-2">
                <button
                  type="button"
                  onClick={() => onSelectManga(heroManga)}
                  className="bg-white text-black text-xs font-bold px-5 py-2 rounded-lg hover:bg-sky-400 transition-colors shadow-sm cursor-pointer"
                >
                  View Details
                </button>

                <StatusSelector manga={heroManga} size="md" />

                <button
                  type="button"
                  onClick={() => toggleFavorite(heroManga)}
                  className={`p-2 rounded-lg border transition-all cursor-pointer ${
                    isMangaFavorite(heroManga.id)
                      ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                      : 'bg-zinc-800/80 text-zinc-300 border-zinc-700 hover:bg-zinc-800'
                  }`}
                  aria-label="Toggle Favorite"
                >
                  <Heart className={`w-4 h-4 ${isMangaFavorite(heroManga.id) ? 'fill-current' : ''}`} />
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 2. Reading Statistics Bar (Only for authenticated users with activity) */}
      {user && (stats.total > 0 || stats.favorites > 0) && (
        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          <div className="bg-zinc-900/50 border border-zinc-800/60 rounded-xl p-3 flex flex-col">
            <span className="text-[11px] text-zinc-400 font-medium">Total Titles</span>
            <span className="text-lg font-black text-zinc-100 mt-0.5">{stats.total}</span>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800/60 rounded-xl p-3 flex flex-col">
            <span className="text-[11px] text-sky-400 font-medium">Reading</span>
            <span className="text-lg font-black text-sky-400 mt-0.5">{stats.reading}</span>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800/60 rounded-xl p-3 flex flex-col">
            <span className="text-[11px] text-amber-400 font-medium">Plan to Read</span>
            <span className="text-lg font-black text-amber-300 mt-0.5">{stats.pending}</span>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800/60 rounded-xl p-3 flex flex-col">
            <span className="text-[11px] text-emerald-400 font-medium">Completed</span>
            <span className="text-lg font-black text-emerald-300 mt-0.5">{stats.completed}</span>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800/60 rounded-xl p-3 flex flex-col">
            <span className="text-[11px] text-pink-400 font-medium">Favorites</span>
            <span className="text-lg font-black text-pink-400 mt-0.5">{stats.favorites}</span>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800/60 rounded-xl p-3 flex flex-col">
            <span className="text-[11px] text-zinc-400 font-medium">Chapters Read</span>
            <span className="text-lg font-black text-zinc-100 mt-0.5">{stats.chaptersRead}</span>
          </div>
        </section>
      )}

      {/* 3. Continue Reading Section (Only displayed if user is currently reading titles) */}
      {currentlyReading.length > 0 && (
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-sky-400" />
              <h2 className="text-base font-bold text-zinc-100 tracking-tight">Continue Reading</h2>
            </div>
            <button
              onClick={() => navigate('library')}
              className="text-xs text-sky-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
            >
              View Library <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {currentlyReading.slice(0, 6).map((entry) => {
              const manga = entry.manga!;
              const prog = getProgressForManga(manga.id);
              const chaptersRead = prog?.chapters_read || 0;

              return (
                <div
                  key={entry.manga_id}
                  onClick={() => onSelectManga(manga)}
                  className="flex items-center gap-3 p-2.5 rounded-xl bg-zinc-900/70 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900 transition-all cursor-pointer group"
                >
                  <div className="w-12 aspect-[2/3] shrink-0 rounded overflow-hidden border border-zinc-800">
                    <ImageWithFallback
                      src={manga.cover_url}
                      alt={getDisplayTitle(manga)}
                      aspectRatio="aspect-[2/3]"
                    />
                  </div>

                  <div className="flex flex-col flex-1 min-w-0 gap-1">
                    <span className="text-[10px] text-sky-400 font-bold uppercase tracking-wider">
                      {manga.type}
                    </span>
                    <h4 className="text-xs font-bold text-zinc-100 line-clamp-1 group-hover:text-sky-300 transition-colors">
                      {getDisplayTitle(manga)}
                    </h4>

                    <div className="w-full mt-0.5">
                      <ProgressBar
                        current={chaptersRead}
                        total={manga.chapters}
                        size="sm"
                        showLabels={true}
                        unitLabel="Ch."
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 4. Based on Recent Searches Section (Only displayed if user searched recently) */}
      {recentSearchManga.length > 0 && latestSearchQuery && (
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SearchIcon className="w-4 h-4 text-indigo-400" />
              <h2 className="text-base font-bold text-zinc-100 tracking-tight">
                Based on your search: <span className="text-indigo-400">"{latestSearchQuery}"</span>
              </h2>
            </div>
            <button
              onClick={() => navigate('search')}
              className="text-xs text-indigo-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
            >
              Search More <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <MangaGrid
            items={recentSearchManga}
            loading={false}
            skeletonCount={6}
            onSelectManga={onSelectManga}
          />
        </section>
      )}

      {/* 5. From Your Favorites Section (Only displayed if authenticated user has favorites) */}
      {user && favoriteMangaList.length > 0 && (
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-pink-400" />
              <h2 className="text-base font-bold text-zinc-100 tracking-tight">From Your Favorites</h2>
            </div>
            <button
              onClick={() => navigate('favorites')}
              className="text-xs text-pink-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
            >
              View All Favorites <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <MangaGrid
            items={favoriteMangaList.slice(0, 6)}
            loading={false}
            skeletonCount={6}
            onSelectManga={onSelectManga}
          />
        </section>
      )}

      {/* 6. In Your Library Section (Only displayed if authenticated user has other organized titles) */}
      {user && otherLibraryMangas.length > 0 && (
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-amber-400" />
              <h2 className="text-base font-bold text-zinc-100 tracking-tight">In Your Reading List</h2>
            </div>
            <button
              onClick={() => navigate('library')}
              className="text-xs text-amber-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
            >
              Manage Library <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <MangaGrid
            items={otherLibraryMangas.slice(0, 6)}
            loading={false}
            skeletonCount={6}
            onSelectManga={onSelectManga}
          />
        </section>
      )}

      {/* 7. Trending Manga Section */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-sky-400" />
            <h2 className="text-base font-bold text-zinc-100 tracking-tight">Trending Now</h2>
          </div>
          <button
            onClick={() => navigate('discover')}
            className="text-xs text-sky-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
          >
            View All <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <MangaGrid
          items={trending}
          loading={loadingDiscovery}
          skeletonCount={6}
          onSelectManga={onSelectManga}
        />
      </section>

      {/* 8. Popular Manga Section */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <h2 className="text-base font-bold text-zinc-100 tracking-tight">All-Time Popular</h2>
          </div>
          <button
            onClick={() => navigate('discover')}
            className="text-xs text-sky-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
          >
            View All <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <MangaGrid
          items={popular}
          loading={loadingDiscovery}
          skeletonCount={6}
          onSelectManga={onSelectManga}
        />
      </section>

      {/* 9. Recently Updated Section */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <h2 className="text-base font-bold text-zinc-100 tracking-tight">Recently Updated</h2>
          </div>
          <button
            onClick={() => navigate('discover')}
            className="text-xs text-sky-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
          >
            View All <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <MangaGrid
          items={recentlyUpdated}
          loading={loadingDiscovery}
          skeletonCount={6}
          onSelectManga={onSelectManga}
        />
      </section>
    </div>
  );
};
