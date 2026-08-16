import React, { useState, useEffect, useCallback } from 'react';
import {
  BookOpen,
  Compass,
  Search as SearchIcon,
  Bookmark,
  Heart,
  User as UserIcon,
  LogIn,
  Layers,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Flame,
  CheckCircle2,
  Clock,
  HardDrive
} from 'lucide-react';
import { useAuth } from './hooks/useAuth';
import { useLibrary } from './hooks/useLibrary';
import { Manga } from './types';
import { Home } from './pages/Home';
import { Discover } from './pages/Discover';
import { Search } from './pages/Search';
import { Library } from './pages/Library';
import { Favorites } from './pages/Favorites';
import { MangaDetails } from './pages/MangaDetails';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Profile } from './pages/Profile';
import { MobileNav } from './components/layout/MobileNav';
import { ImageWithFallback } from './components/common/ImageWithFallback';

function getRouteFromHash(): { route: string; query: string } {
  if (typeof window === 'undefined') return { route: 'home', query: '' };
  const hash = window.location.hash.replace(/^#\/?/, '').trim();
  if (!hash) return { route: 'home', query: '' };

  if (hash.startsWith('search?q=')) {
    const q = decodeURIComponent(hash.replace('search?q=', ''));
    return { route: 'search', query: q };
  }

  return { route: hash, query: '' };
}

export default function App() {
  const { user, profile } = useAuth();
  const { library, favorites, stats, getProgressForManga } = useLibrary();

  // Navigation state initialized from URL hash
  const [currentRoute, setCurrentRoute] = useState<string>(() => getRouteFromHash().route);
  const [selectedManga, setSelectedManga] = useState<Manga | null>(null);
  const [searchQueryParam, setSearchQueryParam] = useState<string>(() => getRouteFromHash().query);
  const [navSearchInput, setNavSearchInput] = useState<string>('');

  // Handle URL hash sync
  useEffect(() => {
    const handleHashChange = () => {
      const { route, query } = getRouteFromHash();
      setCurrentRoute(route);
      if (query) setSearchQueryParam(query);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = useCallback((route: string) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (route.startsWith('search?q=')) {
      const q = decodeURIComponent(route.replace('search?q=', ''));
      setSearchQueryParam(q);
      window.location.hash = `#/${route}`;
      setCurrentRoute('search');
      return;
    }

    window.location.hash = `#/${route}`;
    setCurrentRoute(route);
  }, []);

  const handleSelectManga = (manga: Manga) => {
    setSelectedManga(manga);
    navigate(`manga/${manga.id}`);
  };

  const handleNavSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (navSearchInput.trim()) {
      navigate(`search?q=${encodeURIComponent(navSearchInput.trim())}`);
      setNavSearchInput('');
    }
  };

  // Extract manga ID if on manga details route
  const isDetailsRoute = currentRoute.startsWith('manga/');
  const detailsId = isDetailsRoute ? currentRoute.replace('manga/', '') : null;

  const readingList = library.filter((item) => item.status === 'Reading' && item.manga);

  return (
    <div className="flex flex-col min-h-screen bg-[#09090B] text-zinc-100 font-sans selection:bg-sky-500 selection:text-black">
      {/* High Density Top Navbar */}
      <nav className="flex items-center justify-between px-4 sm:px-6 h-16 border-b border-zinc-800 bg-[#0C0C0E] sticky top-0 z-40 shrink-0">
        {/* Brand & Main Links */}
        <div className="flex items-center gap-6 lg:gap-8">
          <div
            onClick={() => navigate('home')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-8 h-8 bg-sky-500 rounded flex items-center justify-center font-black text-black text-sm shadow-md shadow-sky-500/20 group-hover:scale-105 transition-transform">
              LM
            </div>
            <div className="flex flex-col">
              <span className="text-base sm:text-lg font-black tracking-tight text-zinc-100">
                LetMeCheck
              </span>
            </div>
          </div>

          {/* Desktop Nav Items */}
          <div className="hidden md:flex items-center gap-5 text-xs font-semibold text-zinc-400">
            <button
              onClick={() => navigate('home')}
              className={`transition-colors cursor-pointer ${
                currentRoute === 'home' ? 'text-sky-400 font-bold' : 'hover:text-white'
              }`}
            >
              Home
            </button>
            <button
              onClick={() => navigate('discover')}
              className={`transition-colors cursor-pointer ${
                currentRoute === 'discover' ? 'text-sky-400 font-bold' : 'hover:text-white'
              }`}
            >
              Discover
            </button>
            <button
              onClick={() => navigate('library')}
              className={`transition-colors cursor-pointer flex items-center gap-1.5 ${
                currentRoute === 'library' ? 'text-sky-400 font-bold' : 'hover:text-white'
              }`}
            >
              <span>Library</span>
              {stats.total > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300 font-mono">
                  {stats.total}
                </span>
              )}
            </button>
            <button
              onClick={() => navigate('favorites')}
              className={`transition-colors cursor-pointer flex items-center gap-1.5 ${
                currentRoute === 'favorites' ? 'text-pink-400 font-bold' : 'hover:text-white'
              }`}
            >
              <span>Favorites</span>
              {stats.favorites > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-pink-500/20 text-pink-400 font-mono">
                  {stats.favorites}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Search & Profile Section */}
        <div className="flex items-center gap-3">
          <form onSubmit={handleNavSearchSubmit} className="relative hidden sm:block">
            <input
              type="text"
              placeholder="Search titles, authors..."
              value={navSearchInput}
              onChange={(e) => setNavSearchInput(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded-lg pl-8 pr-3 py-1.5 text-xs w-48 lg:w-64 focus:outline-hidden focus:border-sky-500 text-zinc-200 placeholder-zinc-500 transition-colors"
            />
            <SearchIcon className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2.5 pointer-events-none" />
          </form>

          {user ? (
            <button
              onClick={() => navigate('profile')}
              className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Profile & Settings"
            >
              <div className="w-6 h-6 rounded-md bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-xs">
                {profile?.username ? profile.username.substring(0, 2).toUpperCase() : 'LM'}
              </div>
              <span className="hidden sm:inline text-xs font-semibold text-zinc-200 max-w-[80px] truncate">
                {profile?.username || 'Reader'}
              </span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('login')}
                className="px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-zinc-950 font-bold text-xs transition-colors cursor-pointer"
              >
                Sign In
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content Layout with Responsive High Density Sidebar Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop High-Density Left Stats & Quick Library Sidebar (Shown on main catalog/home routes) */}
        {['home', 'discover', 'library', 'favorites'].includes(currentRoute) && (
          <aside className="hidden xl:flex w-64 border-r border-zinc-800 bg-[#0C0C0E] p-4 flex-col gap-6 shrink-0 h-[calc(100vh-64px)] sticky top-16 overflow-y-auto">
            {/* Quick Stats Grid */}
            <div>
              <h3 className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold mb-2.5">
                Your Reading Stats
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-zinc-900/50 p-2.5 rounded-lg border border-zinc-800/60">
                  <div className="text-[11px] text-zinc-400 font-medium">Total Titles</div>
                  <div className="text-base font-black text-zinc-100">{stats.total}</div>
                </div>
                <div className="bg-zinc-900/50 p-2.5 rounded-lg border border-zinc-800/60">
                  <div className="text-[11px] text-sky-400 font-medium">Reading</div>
                  <div className="text-base font-black text-sky-400">{stats.reading}</div>
                </div>
                <div className="bg-zinc-900/50 p-2.5 rounded-lg border border-zinc-800/60">
                  <div className="text-[11px] text-zinc-400 font-medium">Chapters Read</div>
                  <div className="text-base font-black text-zinc-100">{stats.chaptersRead}</div>
                </div>
                <div className="bg-zinc-900/50 p-2.5 rounded-lg border border-zinc-800/60">
                  <div className="text-[11px] text-pink-400 font-medium">Favorites</div>
                  <div className="text-base font-black text-pink-400">{stats.favorites}</div>
                </div>
              </div>
            </div>

            {/* Quick Library / Reading Tracker */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">
                  Quick Continue
                </h3>
                <button
                  onClick={() => navigate('library')}
                  className="text-[10px] text-sky-400 hover:underline cursor-pointer"
                >
                  All ({library.length})
                </button>
              </div>

              {readingList.length === 0 ? (
                <div className="p-3 rounded-lg bg-zinc-900/30 border border-zinc-800/50 text-center text-zinc-400 text-xs">
                  {user
                    ? 'No active reading series. Add titles from Discover to track here.'
                    : 'Sign in to track your reading series and continue where you left off.'}
                </div>
              ) : (
                <div className="space-y-2">
                  {readingList.slice(0, 4).map((entry) => {
                    const manga = entry.manga!;
                    const prog = getProgressForManga(manga.id);
                    const chRead = prog?.chapters_read || 0;
                    const maxCh = manga.chapters || 0;
                    const percent = maxCh > 0 ? Math.min(100, Math.round((chRead / maxCh) * 100)) : 50;

                    return (
                      <div
                        key={entry.manga_id}
                        onClick={() => handleSelectManga(manga)}
                        className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-zinc-900 cursor-pointer border border-transparent hover:border-zinc-800 transition-all group"
                      >
                        <div className="w-8 aspect-[2/3] bg-zinc-900 rounded overflow-hidden shadow-xs shrink-0 border border-zinc-800">
                          <ImageWithFallback
                            src={manga.cover_url}
                            alt={manga.title}
                            aspectRatio="aspect-[2/3]"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold text-zinc-200 group-hover:text-sky-400 truncate">
                            {manga.title}
                          </div>
                          <div className="text-[10px] text-zinc-400">
                            Ch. {chRead} {maxCh > 0 ? `/ ${maxCh}` : '(Ongoing)'}
                          </div>
                          <div className="w-full bg-zinc-800 h-1 rounded-full mt-1 overflow-hidden">
                            <div
                              className="bg-sky-500 h-full rounded-full transition-all"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </aside>
        )}

        {/* Center / Main View Area */}
        <main className="flex-1 min-w-0 overflow-y-auto bg-[#09090B] pb-28 md:pb-12">
          {isDetailsRoute && detailsId ? (
            <MangaDetails
              mangaId={detailsId}
              onBack={() => navigate('home')}
              onSelectManga={handleSelectManga}
            />
          ) : currentRoute === 'home' ? (
            <Home navigate={navigate} onSelectManga={handleSelectManga} />
          ) : currentRoute === 'discover' ? (
            <Discover onSelectManga={handleSelectManga} />
          ) : currentRoute === 'search' ? (
            <Search initialQuery={searchQueryParam} onSelectManga={handleSelectManga} />
          ) : currentRoute === 'library' ? (
            <Library navigate={navigate} onSelectManga={handleSelectManga} />
          ) : currentRoute === 'favorites' ? (
            <Favorites navigate={navigate} onSelectManga={handleSelectManga} />
          ) : currentRoute === 'login' ? (
            <Login navigate={navigate} />
          ) : currentRoute === 'register' ? (
            <Register navigate={navigate} />
          ) : currentRoute === 'profile' ? (
            <Profile navigate={navigate} />
          ) : (
            <Home navigate={navigate} onSelectManga={handleSelectManga} />
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav currentRoute={currentRoute} navigate={navigate} />
    </div>
  );
}
