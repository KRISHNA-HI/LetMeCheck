import React, { useState } from 'react';
import {
  Bookmark,
  Sparkles,
  LayoutGrid,
  List,
  Search,
  BookOpen,
  ArrowRight
} from 'lucide-react';
import { ReadingStatus, Manga, MangaType } from '../types';
import { useAuth } from '../hooks/useAuth';
import { useLibrary } from '../hooks/useLibrary';
import { MangaCard } from '../components/manga/MangaCard';
import { ImageWithFallback } from '../components/common/ImageWithFallback';
import { ProgressBar } from '../components/common/ProgressBar';
import { StatusSelector } from '../components/manga/StatusSelector';
import {
  getMaterialTypeBadgeClass,
  getStatusColorClass,
  getDisplayTitle,
  matchesMangaTitle,
  getPresentationStatus,
  isReadingMedia
} from '../utils/formatters';

interface LibraryProps {
  navigate: (route: string) => void;
  onSelectManga: (manga: Manga) => void;
}

const STATUS_TABS: { label: string; value: ReadingStatus | 'All'; countKey: string }[] = [
  { label: 'All Titles', value: 'All', countKey: 'total' },
  { label: 'In Progress', value: 'Reading', countKey: 'reading' },
  { label: 'Want to Watch / Read', value: 'Pending', countKey: 'pending' },
  { label: 'Completed', value: 'Completed', countKey: 'completed' },
  { label: 'On Hold', value: 'On Hold', countKey: 'onHold' },
  { label: 'Dropped', value: 'Dropped', countKey: 'dropped' }
];

export const Library: React.FC<LibraryProps> = ({ navigate, onSelectManga }) => {
  const { user, loading: authLoading } = useAuth();
  const { library, stats, getProgressForManga, loading: libraryLoading } = useLibrary();

  const [activeStatus, setActiveStatus] = useState<ReadingStatus | 'All'>('All');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [selectedType, setSelectedType] = useState<MangaType | 'All'>('All');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  if (authLoading || (user && libraryLoading)) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-center max-w-lg mx-auto">
        <div className="w-8 h-8 rounded-full border-2 border-sky-400 border-t-transparent animate-spin mb-4" />
        <p className="text-xs text-zinc-400">Loading your personal library...</p>
      </div>
    );
  }

  // If user is not logged in, enforce the strict auth requirement
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center p-8 sm:p-16 text-center max-w-lg mx-auto">
        <div className="w-14 h-14 rounded-2xl bg-sky-500/15 text-sky-400 flex items-center justify-center mb-4 border border-sky-500/30 shadow-lg shadow-sky-500/10">
          <Bookmark className="w-7 h-7" />
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-zinc-100 mb-2">Library is a Personal Feature</h2>
        <p className="text-xs sm:text-sm text-zinc-400 mb-6 leading-relaxed">
          Create a free account or sign in to track your watch & reading progress, organize custom statuses (In Progress, Want to Watch/Read, Completed), and sync across all devices.
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

  // Filter entries
  const filteredEntries = library.filter((entry) => {
    if (!entry.manga) return false;
    if (activeStatus !== 'All' && entry.status !== activeStatus) return false;
    if (selectedType !== 'All' && entry.manga.type !== selectedType) return false;
    if (searchFilter.trim() && !matchesMangaTitle(entry.manga, searchFilter)) {
      return false;
    }
    return true;
  });

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-28 md:pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-100 flex items-center gap-2.5">
            <Bookmark className="w-7 h-7 text-sky-400" />
            <span>Your Personal Library</span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Track watch and reading progress, manage custom lists, and access your collection
          </p>
        </div>

        <button
          onClick={() => navigate('discover')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-zinc-950 font-bold text-xs transition-colors self-start sm:self-auto shadow-md cursor-pointer"
        >
          <Sparkles className="w-4 h-4" />
          <span>Browse Catalog</span>
        </button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-zinc-900/60 border border-zinc-800 p-3 rounded-xl flex flex-col">
          <span className="text-xs text-zinc-400">Total Entries</span>
          <span className="text-lg font-bold text-zinc-100 mt-0.5">{stats.total}</span>
        </div>
        <div className="bg-zinc-900/60 border border-zinc-800 p-3 rounded-xl flex flex-col">
          <span className="text-xs text-sky-400">In Progress</span>
          <span className="text-lg font-bold text-sky-300 mt-0.5">{stats.reading}</span>
        </div>
        <div className="bg-zinc-900/60 border border-zinc-800 p-3 rounded-xl flex flex-col">
          <span className="text-xs text-amber-400">Want to Watch / Read</span>
          <span className="text-lg font-bold text-amber-300 mt-0.5">{stats.pending}</span>
        </div>
        <div className="bg-zinc-900/60 border border-zinc-800 p-3 rounded-xl flex flex-col">
          <span className="text-xs text-emerald-400">Completed</span>
          <span className="text-lg font-bold text-emerald-300 mt-0.5">{stats.completed}</span>
        </div>
        <div className="bg-zinc-900/60 border border-zinc-800 p-3 rounded-xl flex flex-col">
          <span className="text-xs text-purple-400">On Hold</span>
          <span className="text-lg font-bold text-purple-300 mt-0.5">{stats.onHold}</span>
        </div>
        <div className="bg-zinc-900/60 border border-zinc-800 p-3 rounded-xl flex flex-col">
          <span className="text-xs text-pink-400">Favorites</span>
          <span className="text-lg font-bold text-pink-400 mt-0.5">{stats.favorites}</span>
        </div>
      </div>

      {/* Filter & View Mode Controls */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 flex flex-col gap-4">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {STATUS_TABS.map((tab) => {
            const count = (stats as any)[tab.countKey] ?? 0;
            const isActive = activeStatus === tab.value;

            return (
              <button
                key={tab.value}
                onClick={() => setActiveStatus(tab.value)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-sky-500 text-zinc-950 shadow-xs'
                    : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive ? 'bg-zinc-950/20 text-zinc-950' : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Filter Inputs & View Switches */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-zinc-800">
          <div className="flex items-center gap-2 w-full sm:w-auto flex-1 max-w-md">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Filter titles in your library..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full bg-zinc-950/70 border border-zinc-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-hidden focus:border-sky-500"
              />
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5 pointer-events-none" />
            </div>

            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as any)}
              className="bg-zinc-950/70 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-300 focus:outline-hidden focus:border-sky-500 cursor-pointer"
            >
              <option value="All">All Formats</option>
              <option value="Movie">Movie</option>
              <option value="TV Series">TV Series</option>
              <option value="Anime">Anime</option>
              <option value="Manga">Manga</option>
              <option value="Manhwa">Manhwa</option>
              <option value="Light Novel">Light Novel</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800 self-end sm:self-auto">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-zinc-800 text-sky-400'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-zinc-800 text-sky-400'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Library Entries Content */}
      {filteredEntries.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-zinc-900/40 rounded-2xl border border-zinc-800 my-4">
          <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 mb-3">
            <BookOpen className="w-6 h-6 text-sky-400" />
          </div>
          <h4 className="text-base font-bold text-zinc-200 mb-1">No Entries Found</h4>
          <p className="text-xs text-zinc-400 max-w-sm mb-4">
            {library.length === 0
              ? 'Your library is empty. Start discovering titles and tracking your progress!'
              : 'No titles match your selected filters.'}
          </p>
          {library.length === 0 && (
            <button
              onClick={() => navigate('discover')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-zinc-950 font-bold text-xs transition-colors cursor-pointer"
            >
              <span>Explore Catalog</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
          {filteredEntries.map((entry) => (
            <MangaCard
              key={entry.manga_id}
              manga={entry.manga!}
              onClick={() => onSelectManga(entry.manga!)}
              showProgress={true}
            />
          ))}
        </div>
      ) : (
        /* Detailed Table / List View */
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="bg-zinc-950 text-zinc-400 uppercase tracking-wider font-semibold border-b border-zinc-800">
                <tr>
                  <th className="py-3 px-4">Title</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Progress</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 font-medium">
                {filteredEntries.map((entry) => {
                  const manga = entry.manga!;
                  const prog = getProgressForManga(manga.id);
                  const chRead = prog?.chapters_read || 0;
                  const totalCh = manga.chapters;
                  const presStatus = getPresentationStatus(entry.status, manga.type);

                  return (
                    <tr
                      key={entry.manga_id}
                      className="hover:bg-zinc-800/40 transition-colors group cursor-pointer"
                      onClick={() => onSelectManga(manga)}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 aspect-[2/3] shrink-0 rounded overflow-hidden border border-zinc-800 bg-zinc-950">
                            <ImageWithFallback
                              src={manga.cover_url}
                              alt={getDisplayTitle(manga)}
                              aspectRatio="aspect-[2/3]"
                            />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-zinc-100 group-hover:text-sky-400 transition-colors line-clamp-1">
                              {getDisplayTitle(manga)}
                            </span>
                            {manga.release_year && (
                              <span className="text-[11px] text-zinc-400">
                                {manga.release_year}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className={`text-xs px-2 py-0.5 rounded border ${getStatusColorClass(presStatus)}`}>
                          {presStatus}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span className={`text-[11px] px-2 py-0.5 rounded border ${getMaterialTypeBadgeClass(manga.type)}`}>
                          {manga.type}
                        </span>
                      </td>

                      <td className="py-3 px-4 min-w-[140px]">
                        <ProgressBar
                          current={chRead}
                          total={totalCh}
                          size="sm"
                          showLabels={true}
                          unitLabel={isReadingMedia(manga.type) ? 'Ch.' : 'Ep.'}
                        />
                      </td>

                      <td
                        className="py-3 px-4 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <StatusSelector manga={manga} size="sm" align="right" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
