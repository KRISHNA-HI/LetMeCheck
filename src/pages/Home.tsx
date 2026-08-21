import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  TrendingUp,
  Clock,
  Sparkles,
  Bookmark,
  Heart,
  ArrowRight,
  Play,
  Film,
  Calendar,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { Manga } from '../types';
import { mangaApi } from '../services/mangaApi';
import { contentService, contentItemToManga } from '../services/contentService';
import { useAuth } from '../hooks/useAuth';
import { useLibrary } from '../hooks/useLibrary';
import { MangaGrid } from '../components/manga/MangaGrid';
import { HeroSlider, HeroSlideItem } from '../components/manga/HeroSlider';
import { ProgressBar } from '../components/common/ProgressBar';
import { ImageWithFallback } from '../components/common/ImageWithFallback';
import { SAMPLE_NARUTO, SAMPLE_MANGA } from '../data/sampleManga';
import { getDisplayTitle, isReadingMedia, hasUsableImage, getReliableCoverUrl } from '../utils/formatters';

interface HomeProps {
  navigate: (route: string) => void;
  onSelectManga: (manga: Manga) => void;
}

export const Home: React.FC<HomeProps> = ({ navigate, onSelectManga }) => {
  const { user, loading: authLoading } = useAuth();
  const {
    library,
    favorites,
    stats,
    getProgressForManga,
    isMangaFavorite,
    toggleFavorite,
    loading: libraryLoading
  } = useLibrary();

  // Featured Carousel State (Naruto + Curated/Live Recent Multi-Regional Movies)
  const [defaultNaruto, setDefaultNaruto] = useState<Manga>(SAMPLE_NARUTO);
  const [multiRegionalMovies, setMultiRegionalMovies] = useState<Manga[]>([]);

  // TMDB-Only Live Sections
  const [trending, setTrending] = useState<Manga[]>([]);
  const [loadingTrending, setLoadingTrending] = useState<boolean>(true);
  const [trendingFailed, setTrendingFailed] = useState<boolean>(false);

  const [newReleases, setNewReleases] = useState<Manga[]>([]);
  const [loadingNewReleases, setLoadingNewReleases] = useState<boolean>(true);
  const [newReleasesFailed, setNewReleasesFailed] = useState<boolean>(false);

  // General Entertainment & Anime/Manga Lists
  const [popular, setPopular] = useState<Manga[]>([]);
  const [recentlyUpdated, setRecentlyUpdated] = useState<Manga[]>([]);
  const [loadingDiscovery, setLoadingDiscovery] = useState<boolean>(true);

  // Favorite manga objects for personalized section (ordered by newest favorite first)
  const [favoriteMangaList, setFavoriteMangaList] = useState<Manga[]>([]);
  const [loadingFavorites, setLoadingFavorites] = useState<boolean>(false);

  // 1. Fetch TMDB Trending (Movies + TV series only)
  const fetchTrendingData = useCallback(async () => {
    setLoadingTrending(true);
    setTrendingFailed(false);
    try {
      const trendingItems = await contentService.getTrendingMoviesAndTv(12);
      const converted = trendingItems.map(contentItemToManga).filter(hasUsableImage);
      setTrending(converted);
      if (converted.length === 0) {
        setTrendingFailed(true);
      }
    } catch (err) {
      console.warn('Failed to load TMDB trending:', err);
      setTrending([]);
      setTrendingFailed(true);
    } finally {
      setLoadingTrending(false);
    }
  }, []);

  // 2. Fetch TMDB New Releases (Movies + TV series only)
  const fetchNewReleasesData = useCallback(async () => {
    setLoadingNewReleases(true);
    setNewReleasesFailed(false);
    try {
      const newReleaseItems = await contentService.getNewReleasesMoviesAndTv(12);
      const converted = newReleaseItems.map(contentItemToManga).filter(hasUsableImage);
      setNewReleases(converted);
      if (converted.length === 0) {
        setNewReleasesFailed(true);
      }
    } catch (err) {
      console.warn('Failed to load TMDB new releases:', err);
      setNewReleases([]);
      setNewReleasesFailed(true);
    } finally {
      setLoadingNewReleases(false);
    }
  }, []);

  // 3. Fetch Featured Carousel & Other Catalogs
  const fetchFeaturedAndCatalogs = useCallback(async () => {
    setLoadingDiscovery(true);
    try {
      const [narutoData, popularContentItems, recentData, multiMovies] = await Promise.all([
        mangaApi.getDefaultNarutoManga(),
        contentService.getPopularContent(10),
        mangaApi.getRecentlyUpdated(1, 10),
        contentService.getRecentMultiRegionalMovies()
      ]);

      if (narutoData && hasUsableImage(narutoData)) setDefaultNaruto(narutoData);
      setPopular(popularContentItems.map(contentItemToManga).filter(hasUsableImage));
      setRecentlyUpdated((recentData || []).filter(hasUsableImage));

      if (multiMovies && multiMovies.length > 0) {
        const converted = multiMovies.map(contentItemToManga).filter(hasUsableImage);
        setMultiRegionalMovies(converted);
      }
    } catch (err) {
      console.warn('Failed to load featured/catalog data:', err);
      setPopular(SAMPLE_MANGA.filter(hasUsableImage));
      setRecentlyUpdated(SAMPLE_MANGA.filter(hasUsableImage));
    } finally {
      setLoadingDiscovery(false);
    }
  }, []);

  useEffect(() => {
    fetchTrendingData();
    fetchNewReleasesData();
    fetchFeaturedAndCatalogs();
  }, [fetchTrendingData, fetchNewReleasesData, fetchFeaturedAndCatalogs]);

  // 4. Resolve user's favorite manga objects (ordered by recency of addition)
  useEffect(() => {
    let isMounted = true;

    if (!user || favorites.length === 0) {
      setFavoriteMangaList([]);
      setLoadingFavorites(false);
      return;
    }

    setLoadingFavorites(true);
    const loadFavorites = async () => {
      try {
        const loadedMap = new Map<string, Manga>();

        // Gather from library first
        library.forEach((entry) => {
          if (
            entry.manga &&
            hasUsableImage(entry.manga) &&
            (entry.is_favorite ||
              favorites.includes(entry.manga_id.toString()) ||
              (entry.manga.anilist_id && favorites.includes(entry.manga.anilist_id.toString())))
          ) {
            loadedMap.set(entry.manga.id.toString(), entry.manga);
            if (entry.manga.anilist_id) {
              loadedMap.set(entry.manga.anilist_id.toString(), entry.manga);
            }
          }
        });

        // Identify missing favorite IDs
        const missingIds = favorites.filter((id) => !loadedMap.has(id.toString()));

        if (missingIds.length > 0) {
          const fetched = await Promise.all(
            missingIds.slice(0, 10).map((id) => mangaApi.getMangaById(id))
          );
          fetched.forEach((m) => {
            if (m && hasUsableImage(m)) {
              loadedMap.set(m.id.toString(), m);
              if (m.anilist_id) {
                loadedMap.set(m.anilist_id.toString(), m);
              }
            }
          });
        }

        // Build list strictly in the order of `favorites` array (most recent first)
        const orderedFavorites: Manga[] = [];
        const seenIds = new Set<string>();

        for (const favId of favorites) {
          const manga = loadedMap.get(favId.toString());
          if (manga && !seenIds.has(manga.id.toString())) {
            seenIds.add(manga.id.toString());
            orderedFavorites.push(manga);
          }
        }

        if (isMounted) {
          setFavoriteMangaList(orderedFavorites);
        }
      } catch (err) {
        console.warn('Failed to resolve favorites for Home:', err);
      } finally {
        if (isMounted) setLoadingFavorites(false);
      }
    };

    loadFavorites();
    return () => {
      isMounted = false;
    };
  }, [user, favorites, library]);

  // 3. Compute sorted Currently Reading / Watching items (most recently added/active first)
  // Only status 'Reading' or 'Watching' are allowed to affect the Home hero.
  const currentlyReading = useMemo(() => {
    if (!user) return [];
    return library
      .filter((e) => (e.status === 'Reading' || (e.status as string) === 'Watching') && e.manga && hasUsableImage(e.manga))
      .sort((a, b) => {
        const progA = getProgressForManga(a.manga_id);
        const progB = getProgressForManga(b.manga_id);
        const timeA = new Date(progA?.updated_at || a.updated_at || a.created_at || 0).getTime();
        const timeB = new Date(progB?.updated_at || b.updated_at || b.created_at || 0).getTime();
        return timeB - timeA;
      });
  }, [user, library, getProgressForManga]);

  // 4. Compute other Library titles (Plan to Read, Completed, etc. for separate section)
  const otherLibraryMangas = useMemo(() => {
    if (!user) return [];
    return library
      .filter((e) => e.status !== 'Reading' && (e.status as string) !== 'Watching' && e.manga && hasUsableImage(e.manga))
      .map((e) => e.manga!);
  }, [user, library]);

  // 5. Check if hero sources are evaluating to prevent flashing default Naruto
  const isHeroResolving =
    authLoading ||
    (user ? libraryLoading : false) ||
    (user && favorites.length > 0 && favoriteMangaList.length === 0 && loadingFavorites);

  // 6. STRICT HERO SELECTION PRIORITY RULES:
  // PRIORITY 1: User's favorites (newest favorite first)
  // PRIORITY 2: User's Reading / Watching library items (newest first, only if no favorites)
  // PRIORITY 3: Default Home (Naruto + 4-5 recent released movies)
  const heroSlides = useMemo<HeroSlideItem[]>(() => {
    // PRIORITY 1 — FAVORITES
    if (user && favoriteMangaList.length > 0) {
      return favoriteMangaList.map((m, idx) => ({
        manga: m,
        badge: idx === 0 ? 'From Your Favorites' : 'Favorite',
        isReading: false
      }));
    }

    // PRIORITY 2 — LIBRARY (Only Reading / Watching)
    if (user && currentlyReading.length > 0) {
      return currentlyReading.map((entry, idx) => {
        const manga = entry.manga!;
        const isReadingMediaItem = isReadingMedia(manga.type);
        const badgeLabel = idx === 0
          ? (isReadingMediaItem ? 'Continue Reading' : 'Continue Watching')
          : (isReadingMediaItem ? 'Reading' : 'Watching');
        return {
          manga,
          badge: badgeLabel,
          isReading: true
        };
      });
    }

    // PRIORITY 3 — DEFAULT HOME (Naruto + 4-5 genuinely recent released movies)
    const slides: HeroSlideItem[] = [];
    const seenIds = new Set<string>();

    if (defaultNaruto) {
      slides.push({
        manga: defaultNaruto,
        badge: 'Featured',
        isReading: false
      });
      seenIds.add(defaultNaruto.id.toString());
      if (defaultNaruto.anilist_id) seenIds.add(defaultNaruto.anilist_id.toString());
    }

    multiRegionalMovies.forEach((m) => {
      if (!m || !m.id || seenIds.has(m.id.toString())) return;
      if (m.anilist_id && seenIds.has(m.anilist_id.toString())) return;
      seenIds.add(m.id.toString());

      let regionBadge = 'Recent Movie';
      const genres = m.genres || [];
      const author = m.author || '';

      if (m.type === 'Anime' || genres.includes('Animation') || genres.includes('Anime')) {
        regionBadge = 'Anime Premiere';
      } else if (author.includes('Bollywood') || author.includes('Hindi')) {
        regionBadge = 'Bollywood Release';
      } else if (
        author.includes('South Indian') ||
        author.includes('Telugu') ||
        author.includes('Tamil') ||
        author.includes('Malayalam') ||
        author.includes('Kannada')
      ) {
        regionBadge = 'South Indian Cinema';
      } else if (author.includes('Hollywood')) {
        regionBadge = 'Hollywood Release';
      } else if (m.release_year && m.release_year >= 2023) {
        regionBadge = 'Recent Premiere';
      }

      slides.push({
        manga: m,
        badge: regionBadge,
        isReading: false
      });
    });

    return slides;
  }, [user, favoriteMangaList, currentlyReading, defaultNaruto, multiRegionalMovies]);

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-28 md:pb-20">
      {/* 1. Hero Featured / Multi-Regional Swipeable Section */}
      {isHeroResolving ? (
        <section className="relative rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl z-20 overflow-hidden animate-pulse">
          <div className="p-6 sm:p-8 md:p-10 flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-8">
            {/* Cover Skeleton */}
            <div className="w-36 sm:w-48 md:w-52 aspect-[2/3] shrink-0 rounded-xl bg-zinc-800 border border-zinc-700/60 shadow-2xl" />

            {/* Content Skeleton */}
            <div className="flex flex-col items-center md:items-start text-center md:text-left gap-3 flex-1 min-w-0 w-full">
              {/* Badges Skeleton */}
              <div className="flex items-center gap-2">
                <div className="h-5 w-28 rounded-full bg-zinc-800" />
                <div className="h-5 w-16 rounded-full bg-zinc-800" />
                <div className="h-5 w-20 rounded-full bg-zinc-800" />
              </div>

              {/* Title Skeleton */}
              <div className="h-8 sm:h-9 w-3/4 max-w-md rounded-lg bg-zinc-800" />

              {/* Genres Skeleton */}
              <div className="flex gap-1.5">
                <div className="h-4 w-14 rounded bg-zinc-800" />
                <div className="h-4 w-16 rounded bg-zinc-800" />
                <div className="h-4 w-12 rounded bg-zinc-800" />
              </div>

              {/* Description Skeleton */}
              <div className="space-y-1.5 w-full max-w-xl">
                <div className="h-3 w-full rounded bg-zinc-800" />
                <div className="h-3 w-5/6 rounded bg-zinc-800" />
                <div className="h-3 w-2/3 rounded bg-zinc-800" />
              </div>

              {/* Action Buttons Skeleton */}
              <div className="flex items-center gap-2.5 mt-2">
                <div className="h-8 w-28 rounded-lg bg-zinc-800" />
                <div className="h-8 w-32 rounded-lg bg-zinc-800" />
                <div className="h-8 w-8 rounded-lg bg-zinc-800" />
              </div>
            </div>
          </div>
        </section>
      ) : heroSlides.length > 0 ? (
        <HeroSlider
          slides={heroSlides}
          onSelectManga={onSelectManga}
          getProgressForManga={getProgressForManga}
          toggleFavorite={toggleFavorite}
          isMangaFavorite={isMangaFavorite}
        />
      ) : null}

      {/* 2. Activity Statistics Bar (Only for authenticated users with activity) */}
      {user && (stats.total > 0 || stats.favorites > 0) && (
        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          <div className="bg-zinc-900/50 border border-zinc-800/60 rounded-xl p-3 flex flex-col">
            <span className="text-[11px] text-zinc-400 font-medium">Total Titles</span>
            <span className="text-lg font-black text-zinc-100 mt-0.5">{stats.total}</span>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800/60 rounded-xl p-3 flex flex-col">
            <span className="text-[11px] text-sky-400 font-medium">In Progress</span>
            <span className="text-lg font-black text-sky-400 mt-0.5">{stats.reading}</span>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800/60 rounded-xl p-3 flex flex-col">
            <span className="text-[11px] text-amber-400 font-medium">Want to Watch / Read</span>
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
            <span className="text-[11px] text-zinc-400 font-medium">Progress Logged</span>
            <span className="text-lg font-black text-zinc-100 mt-0.5">{stats.chaptersRead}</span>
          </div>
        </section>
      )}

      {/* 3. Continue Watching / Reading Section (Only displayed if user has active titles) */}
      {currentlyReading.length > 0 && (
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Play className="w-4 h-4 text-sky-400" />
              <h2 className="text-base font-bold text-zinc-100 tracking-tight">Continue Watching & Reading</h2>
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
              const reliableCover = getReliableCoverUrl(manga);

              return (
                <div
                  key={entry.manga_id}
                  onClick={() => onSelectManga(manga)}
                  className="flex items-center gap-3 p-2.5 rounded-xl bg-zinc-900/70 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900 transition-all cursor-pointer group"
                >
                  <div className="w-12 aspect-[2/3] shrink-0 rounded overflow-hidden border border-zinc-800">
                    <ImageWithFallback
                      src={reliableCover}
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
                        unitLabel={isReadingMedia(manga.type) ? 'Ch.' : 'Ep.'}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 4. From Your Favorites Section (Only displayed if authenticated user has favorites) */}
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

      {/* 5. In Your Library Section (Only displayed if authenticated user has other organized titles) */}
      {user && otherLibraryMangas.length > 0 && (
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-amber-400" />
              <h2 className="text-base font-bold text-zinc-100 tracking-tight">In Your Library</h2>
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

      {/* 6. Trending Now (Movies & TV Series from TMDB) */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-sky-400" />
            <h2 className="text-base font-bold text-zinc-100 tracking-tight">Trending Now (Movies & TV)</h2>
          </div>
          <button
            onClick={() => navigate('discover')}
            className="text-xs text-sky-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
          >
            Explore Movies & TV <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {trendingFailed && !loadingTrending ? (
          <div className="flex flex-col items-center justify-center p-8 text-center bg-zinc-900/40 rounded-2xl border border-zinc-800 my-2">
            <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-sky-400 mb-2">
              <Film className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-zinc-200 mb-1">Live TMDB Trending Unavailable</h4>
            <p className="text-xs text-zinc-400 max-w-md mb-3">
              Unable to fetch current trending Movies & TV series from TMDB. Please check your internet connection or TMDB API configuration.
            </p>
            <button
              onClick={fetchTrendingData}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Retry TMDB Trending
            </button>
          </div>
        ) : (
          <MangaGrid
            items={trending}
            loading={loadingTrending}
            skeletonCount={6}
            onSelectManga={onSelectManga}
            emptyMessage="No live trending movies or TV series available from TMDB at this time."
          />
        )}
      </section>

      {/* 7. New Releases (Movies & TV Series from TMDB) */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <h2 className="text-base font-bold text-zinc-100 tracking-tight">New Releases (Movies & TV)</h2>
          </div>
          <button
            onClick={() => navigate('discover')}
            className="text-xs text-emerald-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
          >
            View All Releases <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {newReleasesFailed && !loadingNewReleases ? (
          <div className="flex flex-col items-center justify-center p-8 text-center bg-zinc-900/40 rounded-2xl border border-zinc-800 my-2">
            <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-emerald-400 mb-2">
              <Calendar className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-zinc-200 mb-1">Live TMDB New Releases Unavailable</h4>
            <p className="text-xs text-zinc-400 max-w-md mb-3">
              Unable to fetch new releases from TMDB. Please check your internet connection or TMDB API configuration.
            </p>
            <button
              onClick={fetchNewReleasesData}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Retry New Releases
            </button>
          </div>
        ) : (
          <MangaGrid
            items={newReleases}
            loading={loadingNewReleases}
            skeletonCount={6}
            onSelectManga={onSelectManga}
            emptyMessage="No recent releases found from TMDB."
          />
        )}
      </section>

      {/* 8. Popular Anime & Manga */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <h2 className="text-base font-bold text-zinc-100 tracking-tight">Popular Anime & Manga</h2>
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

      {/* 9. Recently Updated Anime & Manga */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <h2 className="text-base font-bold text-zinc-100 tracking-tight">Recently Updated (Anime & Manga)</h2>
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
