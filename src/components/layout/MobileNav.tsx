import React from 'react';
import { BookOpen, Compass, Search, Bookmark, Heart, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useLibrary } from '../../hooks/useLibrary';

interface MobileNavProps {
  currentRoute: string;
  navigate: (route: string) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ currentRoute, navigate }) => {
  const { user } = useAuth();
  const { library, favorites } = useLibrary();

  const navItems = [
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
    },
    {
      id: 'profile',
      label: user ? 'Profile' : 'Account',
      icon: UserIcon,
      path: user ? 'profile' : 'login'
    }
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0C0C0E]/95 backdrop-blur-lg border-t border-zinc-800 px-2 py-1.5 safe-area-bottom">
      <div className="grid grid-cols-6 items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentRoute === item.path || currentRoute.startsWith(`${item.path}?`);
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center py-1 px-0.5 rounded-lg relative transition-colors cursor-pointer ${
                isActive ? 'text-sky-400 font-bold' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-4 h-4 ${isActive ? 'text-sky-400' : 'text-zinc-400'}`} />
                {item.badge !== null && item.badge !== undefined && (
                  <span className="absolute -top-1 -right-2.5 px-1 py-0.2 text-[8px] font-bold rounded-full bg-sky-500 text-zinc-950">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>
              <span className="text-[9px] font-medium tracking-tight mt-1">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
