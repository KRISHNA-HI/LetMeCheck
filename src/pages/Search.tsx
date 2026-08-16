import React, { useState, useEffect } from 'react';
import { Search as SearchIcon, X, Sparkles, BookOpen, Clock } from 'lucide-react';
import { Manga } from '../types';
import { mangaApi } from '../services/mangaApi';
import { localStorageService } from '../services/storage';
import { MangaGrid } from '../components/manga/MangaGrid';
import { useDebounce } from '../hooks/useDebounce';
import { SAMPLE_MANGA } from '../data/sampleManga';

interface SearchProps {
  initialQuery?: string;
  onSelectManga: (manga: Manga) => void;
}

export const Search: React.FC<SearchProps> = ({ initialQuery = '', onSelectManga }) => {
  const [searchTerm, setSearchTerm] = useState<string>(initialQuery);
  const debouncedTerm = useDebounce(searchTerm, 400);

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
        const data = await mangaApi.searchManga(q, 1, 30);
        setResults(data.items);
        if (data.items.length > 0) {
          const updated = localStorageService.addRecentSearch(q);
          setRecentSearches(updated);
        }
      } catch (err) {
        console.warn('Search error:', err);
      } finally {
        setLoading(false);
      }
    };

    runSearch();
  }, [debouncedTerm]);

  const quickSearchTags = [
    'Solo Leveling',
    'Berserk',
    'Frieren',
    'One Piece',
    'Chainsaw Man',
    'Dandadan',
    'Omniscient Reader',
    'Tower of God',
    'Jujutsu Kaisen',
    'Vagabond'
  ];

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20">
      {/* Search Header */}
      <div className="flex flex-col items-center text-center gap-2.5 max-w-2xl mx-auto w-full pt-2 pb-2">
        <h1 className="text-xl sm:text-2xl font-black text-zinc-100 flex items-center gap-2">
          <SearchIcon className="w-5 h-5 text-sky-400" />
          <span>Search Manga & Media</span>
        </h1>
        <p className="text-xs text-zinc-400">
          Find any title across Japanese manga, Korean manhwa, Chinese manhua, and light novels
        </p>

        {/* Search Bar Input */}
        <div className="relative w-full mt-2">
          <input
            type="text"
            placeholder="Type a title (e.g. Solo Leveling, ベルセルク, Frieren)..."
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
                ? 'Searching database...'
                : `Found ${results.length} result${results.length === 1 ? '' : 's'} for "${debouncedTerm}"`}
            </span>
          </div>
        )}

        {/* If no search entered yet, show popular picks as suggestions */}
        {!hasSearched && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-300">
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              <span>Recommended Starters</span>
            </div>
            <MangaGrid
              items={SAMPLE_MANGA}
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
            emptyMessage={`No titles found matching "${debouncedTerm}". Check spelling or try a different term.`}
          />
        )}
      </div>
    </div>
  );
};
