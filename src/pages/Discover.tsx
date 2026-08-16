import React, { useEffect, useState } from 'react';
import {
  Compass,
  Filter,
  Search,
  SlidersHorizontal,
  RefreshCw,
  Layers,
  ArrowUpDown
} from 'lucide-react';
import { Manga, MangaType, MangaStatus, SearchFilters } from '../types';
import { mangaApi } from '../services/mangaApi';
import { MangaGrid } from '../components/manga/MangaGrid';
import { GENRE_LIST } from '../data/sampleManga';
import { useDebounce } from '../hooks/useDebounce';

interface DiscoverProps {
  onSelectManga: (manga: Manga) => void;
}

const TYPE_OPTIONS: MangaType[] = ['All', 'Manga', 'Manhwa', 'Manhua', 'Light Novel'];
const STATUS_OPTIONS: MangaStatus[] = ['All', 'Ongoing', 'Completed', 'Hiatus', 'Cancelled'];

const SORT_OPTIONS: { label: string; value: SearchFilters['sort'] }[] = [
  { label: 'Most Popular', value: 'POPULARITY_DESC' },
  { label: 'Trending', value: 'TRENDING_DESC' },
  { label: 'Highest Rated', value: 'SCORE_DESC' },
  { label: 'Recently Updated', value: 'UPDATED_AT_DESC' }
];

export const Discover: React.FC<DiscoverProps> = ({ onSelectManga }) => {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 500);

  const [selectedGenre, setSelectedGenre] = useState<string>('All');
  const [selectedType, setSelectedType] = useState<MangaType>('All');
  const [selectedStatus, setSelectedStatus] = useState<MangaStatus>('All');
  const [selectedSort, setSelectedSort] = useState<SearchFilters['sort']>('POPULARITY_DESC');

  const [items, setItems] = useState<Manga[]>([]);
  const [page, setPage] = useState<number>(1);
  const [hasNextPage, setHasNextPage] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);

  const fetchDiscover = async (reset = false) => {
    const currentPage = reset ? 1 : page;
    if (reset) {
      setLoading(true);
      setPage(1);
    } else {
      setLoadingMore(true);
    }

    try {
      const filters: SearchFilters = {
        query: debouncedQuery,
        genre: selectedGenre,
        type: selectedType,
        status: selectedStatus,
        sort: selectedSort,
        page: currentPage,
        perPage: 24
      };

      const result = await mangaApi.discoverManga(filters);

      if (reset) {
        setItems(result.items);
      } else {
        setItems((prev) => [...prev, ...result.items]);
      }
      setHasNextPage(result.hasNextPage);
    } catch (err) {
      console.warn('Discover fetch error:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchDiscover(true);
  }, [debouncedQuery, selectedGenre, selectedType, selectedStatus, selectedSort]);

  const handleLoadMore = async () => {
    if (!hasNextPage || loadingMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    setLoadingMore(true);
    try {
      const result = await mangaApi.discoverManga({
        query: debouncedQuery,
        genre: selectedGenre,
        type: selectedType,
        status: selectedStatus,
        sort: selectedSort,
        page: nextPage,
        perPage: 24
      });
      setItems((prev) => [...prev, ...result.items]);
      setHasNextPage(result.hasNextPage);
    } catch (e) {
      console.warn('Failed to load more discover:', e);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleResetFilters = () => {
    setQuery('');
    setSelectedGenre('All');
    setSelectedType('All');
    setSelectedStatus('All');
    setSelectedSort('POPULARITY_DESC');
  };

  const hasActiveFilters =
    query ||
    selectedGenre !== 'All' ||
    selectedType !== 'All' ||
    selectedStatus !== 'All' ||
    selectedSort !== 'POPULARITY_DESC';

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-zinc-100 flex items-center gap-2">
            <Compass className="w-6 h-6 text-sky-400" />
            <span>Discover Manga & Works</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Browse across thousands of manga, manhwa, manhua, and light novels
          </p>
        </div>

        {hasActiveFilters && (
          <button
            onClick={handleResetFilters}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-semibold text-zinc-300 transition-colors self-start sm:self-auto cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Filters</span>
          </button>
        )}
      </div>

      {/* Filter Control Bar */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 flex flex-col gap-4">
        {/* Search & Sort Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2 relative">
            <input
              type="text"
              placeholder="Search by title, author, Japanese/Korean name..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-zinc-950/70 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-xs sm:text-sm text-zinc-200 placeholder-zinc-500 focus:outline-hidden focus:border-sky-500 transition-colors"
            />
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5 pointer-events-none" />
          </div>

          {/* Sort Dropdown */}
          <div className="relative">
            <select
              value={selectedSort}
              onChange={(e) => setSelectedSort(e.target.value as any)}
              className="w-full bg-zinc-950/70 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-zinc-200 focus:outline-hidden focus:border-sky-500 cursor-pointer transition-colors appearance-none"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-zinc-900 text-zinc-200">
                  Sort: {opt.label}
                </option>
              ))}
            </select>
            <ArrowUpDown className="w-4 h-4 text-zinc-400 absolute right-3.5 top-2.5 pointer-events-none" />
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-col gap-2.5 pt-2 border-t border-zinc-800">
          {/* Types */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className="text-zinc-400 font-bold uppercase tracking-wider text-[10px] shrink-0 mr-1">
              Type:
            </span>
            {TYPE_OPTIONS.map((t) => (
              <button
                key={t}
                onClick={() => setSelectedType(t)}
                className={`px-2.5 py-1 rounded-md font-semibold text-xs transition-colors whitespace-nowrap cursor-pointer ${
                  selectedType === t
                    ? 'bg-sky-500 text-zinc-950 font-bold'
                    : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-zinc-800'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Statuses */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className="text-zinc-400 font-bold uppercase tracking-wider text-[10px] shrink-0 mr-1">
              Status:
            </span>
            {STATUS_OPTIONS.map((s) => (
              <button
                key={s}
                onClick={() => setSelectedStatus(s)}
                className={`px-2.5 py-1 rounded-md font-semibold text-xs transition-colors whitespace-nowrap cursor-pointer ${
                  selectedStatus === s
                    ? 'bg-emerald-500 text-zinc-950 font-bold'
                    : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-zinc-800'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Genres */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className="text-zinc-400 font-bold uppercase tracking-wider text-[10px] shrink-0 mr-1">
              Genre:
            </span>
            <button
              onClick={() => setSelectedGenre('All')}
              className={`px-2.5 py-1 rounded-md font-semibold text-xs transition-colors whitespace-nowrap cursor-pointer ${
                selectedGenre === 'All'
                  ? 'bg-zinc-100 text-zinc-950 font-bold'
                  : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-zinc-800'
              }`}
            >
              All
            </button>
            {GENRE_LIST.map((g) => (
              <button
                key={g}
                onClick={() => setSelectedGenre(g)}
                className={`px-2.5 py-1 rounded-md font-semibold text-xs transition-colors whitespace-nowrap cursor-pointer ${
                  selectedGenre === g
                    ? 'bg-zinc-100 text-zinc-950 font-bold'
                    : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-zinc-800'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Manga Grid */}
      <MangaGrid
        items={items}
        loading={loading}
        skeletonCount={18}
        onSelectManga={onSelectManga}
        emptyMessage="No titles match your active filters. Try resetting the filters."
      />

      {/* Load More Button */}
      {hasNextPage && !loading && (
        <div className="flex justify-center mt-6">
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
  );
};
