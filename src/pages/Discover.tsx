import React, { useEffect, useState, useCallback } from 'react';
import {
  Compass,
  Search,
  RefreshCw,
  Layers,
  Sparkles,
  Film,
  Tv,
  BookOpen,
  Globe2,
  Tag,
  ArrowRight,
  TrendingUp,
  ChevronRight
} from 'lucide-react';
import { Manga, ContentType, Universe, WatchOrder } from '../types';
import { contentService, contentItemToManga } from '../services/contentService';
import { universeService } from '../services/universeService';
import { MangaGrid } from '../components/manga/MangaGrid';
import { UniverseTextCard } from '../components/universe/UniverseTextCard';
import { UniverseDetailModal } from '../components/universe/UniverseDetailModal';
import { useDebounce } from '../hooks/useDebounce';

interface DiscoverProps {
  onSelectManga: (manga: Manga) => void;
}

type ContentCategoryTab = 'all' | 'movie' | 'tv_series' | 'anime' | 'manga' | 'universe';

const CONTENT_TYPE_TABS: { id: ContentCategoryTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'all', label: 'All Content', icon: Compass },
  { id: 'movie', label: 'Movies', icon: Film },
  { id: 'tv_series', label: 'TV & Web Series', icon: Tv },
  { id: 'anime', label: 'Anime', icon: Sparkles },
  { id: 'manga', label: 'Manga & Comics', icon: BookOpen },
  { id: 'universe', label: 'Universes & Franchises', icon: Layers }
];

const POPULAR_GENRES = [
  'Action',
  'Science Fiction',
  'Thriller',
  'Drama',
  'Horror',
  'Animation',
  'Fantasy',
  'Comedy',
  'Crime',
  'Adventure',
  'Romance',
  'Mystery'
];

const REGIONAL_INDUSTRIES = [
  { id: 'all', label: 'Global' },
  { id: 'hollywood', label: 'Hollywood (US)' },
  { id: 'bollywood', label: 'Bollywood (Hindi)' },
  { id: 'tollywood', label: 'Tollywood (Telugu)' },
  { id: 'kollywood', label: 'Kollywood (Tamil)' },
  { id: 'mollywood', label: 'Mollywood (Malayalam)' },
  { id: 'sandalwood', label: 'Sandalwood (Kannada)' },
  { id: 'korean_cinema', label: 'Korean Cinema & K-Drama' },
  { id: 'japanese_cinema', label: 'Japanese & Anime' }
];

// Persisted Discover filter state across route transitions
interface DiscoverPersistedState {
  searchInput: string;
  activeTab: ContentCategoryTab;
  selectedGenre: string;
  selectedIndustry: string;
  searchMode: 'title' | 'franchise' | 'character';
  items: Manga[];
  page: number;
  hasNextPage: boolean;
}

let discoverStateCache: DiscoverPersistedState = {
  searchInput: '',
  activeTab: 'all',
  selectedGenre: 'All',
  selectedIndustry: 'all',
  searchMode: 'title',
  items: [],
  page: 1,
  hasNextPage: false
};

export const Discover: React.FC<DiscoverProps> = ({ onSelectManga }) => {
  const [searchInput, setSearchInput] = useState(discoverStateCache.searchInput);
  const debouncedSearch = useDebounce(searchInput, 400);

  const [activeTab, setActiveTab] = useState<ContentCategoryTab>(discoverStateCache.activeTab);
  const [selectedGenre, setSelectedGenre] = useState<string>(discoverStateCache.selectedGenre);
  const [selectedIndustry, setSelectedIndustry] = useState<string>(discoverStateCache.selectedIndustry);
  const [searchMode, setSearchMode] = useState<'title' | 'franchise' | 'character'>(discoverStateCache.searchMode);

  // Universe state
  const [featuredUniverses, setFeaturedUniverses] = useState<Universe[]>([]);
  const [filteredUniverses, setFilteredUniverses] = useState<Universe[]>([]);
  const [allUniversesCount, setAllUniversesCount] = useState<number>(0);
  const [selectedUniverse, setSelectedUniverse] = useState<Universe | null>(null);
  const [selectedWatchOrder, setSelectedWatchOrder] = useState<WatchOrder | null>(null);

  // Content state
  const [items, setItems] = useState<Manga[]>(discoverStateCache.items);
  const [loading, setLoading] = useState<boolean>(discoverStateCache.items.length === 0);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [page, setPage] = useState<number>(discoverStateCache.page);
  const [hasNextPage, setHasNextPage] = useState<boolean>(discoverStateCache.hasNextPage);

  // Genuinely trending content state for Section D
  const [trendingItems, setTrendingItems] = useState<Manga[]>([]);
  const [loadingTrending, setLoadingTrending] = useState<boolean>(true);

  // Fetch trending content for the Hub view
  useEffect(() => {
    let isMounted = true;
    setLoadingTrending(true);
    contentService
      .getTrendingContent(18)
      .then((res) => {
        if (isMounted) {
          setTrendingItems(res.map(contentItemToManga));
        }
      })
      .catch((err) => {
        console.warn('Failed to load trending content for Discover:', err);
      })
      .finally(() => {
        if (isMounted) {
          setLoadingTrending(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Sync back to cache on state changes
  useEffect(() => {
    discoverStateCache = {
      searchInput,
      activeTab,
      selectedGenre,
      selectedIndustry,
      searchMode,
      items,
      page,
      hasNextPage
    };
  }, [searchInput, activeTab, selectedGenre, selectedIndustry, searchMode, items, page, hasNextPage]);

  // Load universes on initial render
  useEffect(() => {
    let isMounted = true;
    Promise.all([
      universeService.getFeaturedUniverses(),
      universeService.getAllUniverses()
    ]).then(([featured, all]) => {
      if (isMounted) {
        setFeaturedUniverses(featured);
        setFilteredUniverses(all);
        setAllUniversesCount(all.length);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Determine if in search/filter results mode vs default multi-section discover mode
  const isFilteredMode = Boolean(
    debouncedSearch.trim() ||
    selectedGenre !== 'All' ||
    selectedIndustry !== 'all' ||
    (activeTab !== 'all' && activeTab !== 'universe')
  );

  const loadContent = useCallback(
    async (reset = false) => {
      const currentPage = reset ? 1 : page;
      if (reset) {
        setLoading(true);
        setPage(1);
      } else {
        setLoadingMore(true);
      }

      try {
        if (activeTab === 'universe') {
          // Universe search/filter
          const matched = await universeService.searchUniverses(debouncedSearch);
          setFilteredUniverses(matched);
          setLoading(false);
          setLoadingMore(false);
          return;
        }

        let contentTypeParam: ContentType | undefined = undefined;
        if (activeTab === 'movie') contentTypeParam = 'movie';
        else if (activeTab === 'tv_series') contentTypeParam = 'tv_series';
        else if (activeTab === 'anime') contentTypeParam = 'anime';
        else if (activeTab === 'manga') contentTypeParam = 'manga';

        const result = await contentService.discoverContent({
          query: debouncedSearch,
          content_type: contentTypeParam,
          genre: selectedGenre !== 'All' ? selectedGenre : undefined,
          industry: selectedIndustry !== 'all' ? selectedIndustry : undefined,
          page: currentPage,
          per_page: 20,
          sort: 'POPULARITY_DESC'
        });

        const mangaItems = result.items.map(contentItemToManga);

        if (reset) {
          setItems(mangaItems);
        } else {
          setItems((prev) => [...prev, ...mangaItems]);
        }
        setHasNextPage(result.hasNextPage);
      } catch (err) {
        console.warn('Discover load error:', err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [debouncedSearch, activeTab, selectedGenre, selectedIndustry, page]
  );

  useEffect(() => {
    loadContent(true);
  }, [debouncedSearch, activeTab, selectedGenre, selectedIndustry]);

  const handleLoadMore = async () => {
    if (!hasNextPage || loadingMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    setLoadingMore(true);

    try {
      let contentTypeParam: ContentType | undefined = undefined;
      if (activeTab === 'movie') contentTypeParam = 'movie';
      else if (activeTab === 'tv_series') contentTypeParam = 'tv_series';
      else if (activeTab === 'anime') contentTypeParam = 'anime';
      else if (activeTab === 'manga') contentTypeParam = 'manga';

      const result = await contentService.discoverContent({
        query: debouncedSearch,
        content_type: contentTypeParam,
        genre: selectedGenre !== 'All' ? selectedGenre : undefined,
        industry: selectedIndustry !== 'all' ? selectedIndustry : undefined,
        page: nextPage,
        per_page: 20,
        sort: 'POPULARITY_DESC'
      });

      const newMangaItems = result.items.map(contentItemToManga);
      setItems((prev) => [...prev, ...newMangaItems]);
      setHasNextPage(result.hasNextPage);
    } catch (err) {
      console.warn('Load more error:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleResetFilters = () => {
    discoverStateCache = {
      searchInput: '',
      activeTab: 'all',
      selectedGenre: 'All',
      selectedIndustry: 'all',
      searchMode: 'title',
      items: [],
      page: 1,
      hasNextPage: false
    };
    setSearchInput('');
    setActiveTab('all');
    setSelectedGenre('All');
    setSelectedIndustry('all');
    setSearchMode('title');
    setPage(1);
  };

  const handleOpenUniverseModal = (universe: Universe, watchOrder?: WatchOrder) => {
    setSelectedUniverse(universe);
    setSelectedWatchOrder(watchOrder || null);
  };

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-28 md:pb-20">
      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-100 flex items-center gap-2.5 tracking-tight">
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-500/30">
              <Compass className="w-5 h-5" />
            </div>
            <span>Discover</span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Explore movies, series, anime, manga and connected universes.
          </p>
        </div>

        {isFilteredMode && (
          <button
            onClick={handleResetFilters}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-semibold text-zinc-300 transition-colors self-start md:self-auto cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset All Filters</span>
          </button>
        )}
      </div>

      {/* 2. Universal Search & Filter Hub */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 sm:p-5 flex flex-col gap-4 shadow-lg">
        {/* Main Search Input */}
        <div className="relative">
          <input
            type="text"
            placeholder={
              searchMode === 'franchise'
                ? 'Search universes & franchises (e.g., MCU, Star Wars, LCU, Conjuring, YRF Spy)...'
                : searchMode === 'character'
                ? 'Search by character or creator (e.g., Batman, Goku, Nolan, Lokesh Kanagaraj)...'
                : 'Search titles, movies, series, anime, manga, or franchises...'
            }
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl pl-10 pr-24 py-2.5 text-xs sm:text-sm text-zinc-200 placeholder-zinc-500 focus:outline-hidden focus:border-sky-500 transition-colors shadow-inner"
          />
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3 pointer-events-none" />

          {searchInput && (
            <button
              onClick={() => setSearchInput('')}
              className="absolute right-3 top-2.5 px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-[11px] text-zinc-300 font-medium cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        {/* Content Type Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          {CONTENT_TYPE_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-sky-500 text-zinc-950 shadow-md shadow-sky-500/20'
                    : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80 border border-zinc-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Secondary Region & Genre Fast Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-zinc-800/80 text-xs">
          {/* Region / Industry Filter */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 shrink-0 flex items-center gap-1">
              <Globe2 className="w-3 h-3 text-sky-400" />
              <span>Region:</span>
            </span>
            <select
              value={selectedIndustry}
              onChange={(e) => setSelectedIndustry(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1 text-xs text-zinc-300 focus:outline-hidden focus:border-sky-500 cursor-pointer"
            >
              {REGIONAL_INDUSTRIES.map((reg) => (
                <option key={reg.id} value={reg.id}>
                  {reg.label}
                </option>
              ))}
            </select>
          </div>

          {/* Genre Filter */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 shrink-0 flex items-center gap-1">
              <Tag className="w-3 h-3 text-amber-400" />
              <span>Genre:</span>
            </span>
            <select
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1 text-xs text-zinc-300 focus:outline-hidden focus:border-sky-500 cursor-pointer"
            >
              <option value="All">All Genres</option>
              {POPULAR_GENRES.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 3. CONDITIONAL VIEWS: Default Hub vs Active Filter Results */}
      {!isFilteredMode && activeTab === 'all' ? (
        <div className="flex flex-col gap-10">
          {/* SECTION A: Featured Universes & Franchises (3-Column Text Grid) */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base sm:text-lg font-black text-zinc-100 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-sky-400" />
                  <span>Featured Universes & Franchises</span>
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Connected universes with rich timelines, sagas, and watch guides
                </p>
              </div>
              <button
                onClick={() => setActiveTab('universe')}
                className="text-xs font-bold text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>View All →</span>
              </button>
            </div>

            {/* True 3-Column Compact Grid for mobile and desktop */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {featuredUniverses.slice(0, 6).map((universe) => (
                <UniverseTextCard
                  key={universe.id}
                  universe={universe}
                  onSelect={handleOpenUniverseModal}
                />
              ))}
            </div>
          </div>

          {/* SECTION B: Browse by Genre */}
          <div className="flex flex-col gap-3">
            <h2 className="text-base sm:text-lg font-black text-zinc-100 flex items-center gap-2">
              <Tag className="w-4 h-4 text-amber-400" />
              <span>Browse by Genre</span>
            </h2>
            <div className="flex flex-wrap gap-2">
              {POPULAR_GENRES.map((genre) => (
                <button
                  key={genre}
                  onClick={() => setSelectedGenre(genre)}
                  className="px-3.5 py-1.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-xs font-semibold text-zinc-300 hover:text-white transition-all cursor-pointer shadow-xs"
                >
                  {genre}
                </button>
              ))}
            </div>
          </div>

          {/* SECTION C: Browse by Region / Industry */}
          <div className="flex flex-col gap-3">
            <h2 className="text-base sm:text-lg font-black text-zinc-100 flex items-center gap-2">
              <Globe2 className="w-4 h-4 text-sky-400" />
              <span>Browse by Region & Industry</span>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {REGIONAL_INDUSTRIES.filter((r) => r.id !== 'all').map((ind) => (
                <button
                  key={ind.id}
                  onClick={() => setSelectedIndustry(ind.id)}
                  className="p-3 rounded-xl bg-zinc-900/70 border border-zinc-800 hover:border-sky-500/50 hover:bg-zinc-850 text-left transition-all cursor-pointer group"
                >
                  <div className="text-xs font-bold text-zinc-200 group-hover:text-sky-400 transition-colors truncate">
                    {ind.label}
                  </div>
                  <div className="text-[10px] text-zinc-400 mt-0.5">Explore catalog →</div>
                </button>
              ))}
            </div>
          </div>

          {/* SECTION D: Trending & Popular Content */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base sm:text-lg font-black text-zinc-100 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-rose-400" />
                  <span>Trending & Popular Across Media</span>
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Popular movies, web series, anime, and manga
                </p>
              </div>
            </div>

            <MangaGrid
              items={trendingItems}
              loading={loadingTrending}
              skeletonCount={12}
              onSelectManga={onSelectManga}
              emptyMessage="No trending titles available right now."
            />
          </div>
        </div>
      ) : activeTab === 'universe' ? (
        /* Universe-only View */
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-black text-zinc-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-sky-400" />
              <span>All Universes & Franchises ({filteredUniverses.length})</span>
            </h2>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {filteredUniverses.map((universe) => (
              <UniverseTextCard
                key={universe.id}
                universe={universe}
                onSelect={handleOpenUniverseModal}
              />
            ))}
          </div>

          {filteredUniverses.length === 0 && (
            <div className="p-8 text-center bg-zinc-900/50 rounded-2xl border border-zinc-800 text-zinc-400 text-xs">
              No universes found matching "{debouncedSearch}".
            </div>
          )}
        </div>
      ) : (
        /* Filtered / Search Results View */
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm sm:text-base font-bold text-zinc-200 flex flex-wrap items-center gap-2">
              <span>Results</span>
              {debouncedSearch && <span className="text-sky-400">for "{debouncedSearch}"</span>}
              {activeTab !== 'all' && (
                <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-sky-300 font-mono capitalize">
                  {activeTab.replace('_', ' ')}
                </span>
              )}
              {selectedGenre !== 'All' && (
                <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono">
                  {selectedGenre}
                </span>
              )}
              {selectedIndustry !== 'all' && (
                <span className="text-xs px-2 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/20 font-mono">
                  {REGIONAL_INDUSTRIES.find((r) => r.id === selectedIndustry)?.label || selectedIndustry}
                </span>
              )}
            </h2>
            <span className="text-xs text-zinc-400 font-mono">
              {items.length} titles loaded
            </span>
          </div>

          <MangaGrid
            items={items}
            loading={loading}
            skeletonCount={18}
            onSelectManga={onSelectManga}
            emptyMessage="No titles match your active query and filters. Try adjusting your search."
          />

          {/* Load More Button */}
          {hasNextPage && !loading && (
            <div className="flex justify-center mt-4">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-bold text-zinc-200 hover:text-white transition-all shadow-md cursor-pointer"
              >
                {loadingMore ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Loading more titles...</span>
                  </>
                ) : (
                  <span>Load More Titles</span>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Universe Detail Modal */}
      {selectedUniverse && (
        <UniverseDetailModal
          universe={selectedUniverse}
          initialWatchOrder={selectedWatchOrder}
          onClose={() => {
            setSelectedUniverse(null);
            setSelectedWatchOrder(null);
          }}
          onSelectTitle={onSelectManga}
        />
      )}
    </div>
  );
};
