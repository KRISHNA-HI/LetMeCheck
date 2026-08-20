import React, { useState } from 'react';
import {
  BookOpen,
  Compass,
  Search,
  Bookmark,
  Heart,
  User as UserIcon,
  LogIn,
  Layers,
  Database
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useLibrary } from '../../hooks/useLibrary';

interface NavbarProps {
  currentRoute: string;
  navigate: (route: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentRoute, navigate }) => {
  const { user, isSupabaseOnline } = useAuth();
  const { library, favorites } = useLibrary();
  const [searchQuery, setSearchQuery] = useState('');

  const handleQuickSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`search?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('search');
    }
  };

  const navLinks = [
    { id: 'home', label: 'Home', icon: BookOpen, path: 'home' },
    { id: 'discover', label: 'Discover', icon: Compass, path: 'discover' },
    { id: 'search', label: 'Search', icon: Search, path: 'search' },
    {
      id: 'library',
      label: 'Library',
      icon: Bookmark,
      path: 'library',
      badge: library.length > 0 ? library.length : null
    },
    {
      id: 'favorites',
      label: 'Favorites',
      icon: Heart,
      path: 'favorites',
      badge: favorites.length > 0 ? favorites.length : null
    }
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div
          onClick={() => navigate('home')}
          className="flex items-center gap-3 cursor-pointer group shrink-0"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-sky-500 p-0.5 shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Layers className="w-5 h-5 text-sky-400" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg text-slate-100 tracking-tight">LetMeCheck</span>
            <span className="text-[11px] text-slate-400 font-normal -mt-0.5">
              Franchise & Entertainment Catalog
            </span>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = currentRoute === link.path || currentRoute.startsWith(`${link.path}?`);
            return (
              <button
                key={link.id}
                onClick={() => navigate(link.path)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors relative ${
                  isActive
                    ? 'bg-slate-800/90 text-sky-400 shadow-xs'
                    : 'text-slate-300 hover:text-slate-100 hover:bg-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-sky-400' : 'text-slate-400'}`} />
                <span>{link.label}</span>
                {link.badge !== null && link.badge !== undefined && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    {link.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Search Input and User Controls */}
        <div className="flex items-center gap-3">
          <form onSubmit={handleQuickSearch} className="hidden sm:block relative w-44 lg:w-60">
            <input
              type="text"
              placeholder="Search movies, series, anime, manga..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-sky-500 transition-colors"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          </form>

          {/* User Account / Login State */}
          {user ? (
            <button
              onClick={() => navigate('profile')}
              className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors"
              title="View Profile"
            >
              {user.avatar_url && user.avatar_url.trim() !== '' ? (
                <img
                  src={user.avatar_url.trim()}
                  alt={user.display_name || 'User'}
                  className="w-6 h-6 rounded-full object-cover border border-slate-700"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-indigo-600/30 text-indigo-400 flex items-center justify-center font-bold text-xs">
                  {user.display_name?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
              <span className="hidden sm:inline text-xs font-medium text-slate-200 max-w-[90px] truncate">
                {user.display_name}
              </span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('login')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-xs"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
