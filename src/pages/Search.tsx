import React, { useState, useEffect } from 'react';
import { Search as SearchIcon, X, Sparkles, Clock, Film, Tv, Play, BookOpen, Layers } from 'lucide-react';
import { Manga } from '../types';
import { ContentType } from '../types/content';
import { contentService, contentItemToManga } from '../services/contentService';
import { localStorageService } from '../services/storage';
import { MangaGrid } from '../components/manga/MangaGrid';
import { useDebounce } from '../hooks/useDebounce';
import { SAMPLE_MANGA } from '../data/sampleManga';
import { hasUsableImage } from '../utils/formatters';

interface SearchProps {
  initialQuery?: string;
  onSelectManga: (manga: Manga) => void;
}

type FilterOption = 'all' | 'movie' | 'tv_series' | 'anime' | 'manga';

const CONTENT_TYPE_TABS: { id: FilterOption; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'all', label: 'All Media', icon: Layers },
  { id: 'movie', label: 'Movies', icon: Film },
  { id: 'tv_series', label: 'TV Shows', icon: Tv },
  { id: 'anime', label: 'Anime', icon: Play },
  { id: 'manga', label: 'Manga / Manhwa', icon: BookOpen }
];

export const Search: React.FC<SearchProps> = ({ initialQuery = '', onSelectManga }) => {
  const [searchTerm, setSearchTerm] = useState<string>(initialQuery);
  const [selectedType, setSelectedType] = useState<FilterOption>('all');
  const debouncedTerm = useDebounce(searchTerm, 350);

  const [results, setResults] = useState<Manga[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    setRecentSearches(localStorageService.getRecentSearches());
  }, []);

  useEffect(() => {
    if (initialQuery) {
      setSearchTerm(initialQuery);
    }
  }, [initialQuery]);

  useEffect(() => {
    const runSearch = async () => {
      const q = debouncedTerm.trim();
      if (!q) {
        setResults([]);
        setHasSearched(false);
        setLoading(false);
        return;
      }

      setLoading(true);
      setHasSearched(true);
      try {
        const filterType: ContentType | undefined =
          selectedType === 'all' ? undefined : (selectedType as ContentType);

        const searchRes = await contentService.searchContent(q, {
          content_type: filterType,
          per_page: 30
        });

        const mapped = searchRes.items.map(contentItemToManga);
        setResults(mapped);

        if (mapped.length > 0) {
          const updated = localStorageService.addRecentSearch(q);
          setRecentSearches(updated);
        }
      } catch (err) {
        console.warn('Unified search error:', err);
      } finally {
        setLoading(false);
      }
    };

    runSearch();
  }, [debouncedTerm, selectedType]);

  const quickSearchTags = [
    'Inception',
    'Stranger Things',
    'Demon Slayer',
    'RRR',
    'Interstellar',
    'Breaking Bad',
    'One Piece',
    'Solo Leveling',
    'Attack on Titan',
    'Vikram'
  ];

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20">
      {/* Search Header */}
      <div className="flex flex-col items-center text-center gap-2.5 max-w-2xl mx-auto w-full pt-2 pb-2">
        <h1 className="text-xl sm:text-2xl font-black text-zinc-100 flex items-center gap-2">
          <SearchIcon className="w-5 h-5 text-sky-400" />
          <span>Search</span>
        </h1>
        <p className="text-xs text-zinc-400">
          Discover movies, TV series, anime, manga, and regional cinema across global metadata providers
        </p>

        {/* Search Bar Input */}
        <div className="relative w-full mt-2">
          <input
            type="text"
            placeholder="Search movies, series, anime, manga (e.g. Inception, Stranger Things, Demon Slayer, RRR)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
            className="w-full bg-zinc-900 border border-zinc-700 focus:border-sky-500 rounded-xl pl-11 pr-11 py-3 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-hidden transition-all shadow-xl shadow-black/30"
          />
          <SearchIcon className="w-4 h-4 text-zinc-400 absolute left-4 top-3.5 pointer-events-none" />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="p-1 rounded-full text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 absolute right-3.5 top-3 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Content Type Filter Pills */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 mt-2">
          {CONTENT_TYPE_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = selectedType === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedType(tab.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-sky-500 text-zinc-950 font-bold shadow-md shadow-sky-500/20'
                    : 'bg-zinc-900/90 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-zinc-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Recent Searches (if any) */}
        {recentSearches.length > 0 && !searchTerm && (
          <div className="flex flex-wrap items-center justify-center gap-1.5 mt-1">
            <span className="text-[11px] text-zinc-400 mr-1 flex items-center gap-1">
              <Clock className="w-3 h-3 text-sky-400" /> Recent:
            </span>
            {recentSearches.slice(0, 5).map((term) => (
              <button
                key={term}
                onClick={() => setSearchTerm(term)}
                className="text-[11px] px-2 py-0.5 rounded-md bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-300 hover:text-sky-200 transition-colors cursor-pointer"
              >
                {term}
              </button>
            ))}
          </div>
        )}

        {/* Quick Search Badges */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 mt-1">
          <span className="text-[11px] text-zinc-400 mr-1 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" /> Popular:
          </span>
          {quickSearchTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSearchTerm(tag)}
              className="text-[11px] px-2 py-0.5 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-sky-300 transition-colors cursor-pointer"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Results Section */}
      <div className="mt-2">
        {hasSearched && (
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-zinc-800">
            <span className="text-xs font-bold text-zinc-300">
              {loading
                ? 'Searching entertainment databases...'
                : `Found ${results.length} result${results.length === 1 ? '' : 's'} for "${debouncedTerm}"`}
            </span>
            {selectedType !== 'all' && (
              <span className="text-xs text-sky-400 font-medium capitalize">
                Filtering by: {selectedType.replace('_', ' ')}
              </span>
            )}
          </div>
        )}

        {/* If no search entered yet, show starter suggestions */}
        {!hasSearched && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-300">
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              <span>Recommended Starters</span>
            </div>
            <MangaGrid
              items={SAMPLE_MANGA.filter(hasUsableImage)}
              onSelectManga={onSelectManga}
            />
          </div>
        )}

        {hasSearched && (
          <MangaGrid
            items={results}
            loading={loading}
            skeletonCount={12}
            onSelectManga={onSelectManga}
            emptyMessage={`No titles found matching "${debouncedTerm}" in the selected category. Check spelling or try searching across All Media.`}
          />
        )}
      </div>
    </div>
  );
};
