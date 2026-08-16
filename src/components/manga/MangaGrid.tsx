import React from 'react';
import { Manga } from '../../types';
import { MangaCard } from './MangaCard';
import { Skeleton } from '../common/Skeleton';
import { BookX } from 'lucide-react';

interface MangaGridProps {
  items: Manga[];
  loading?: boolean;
  skeletonCount?: number;
  onSelectManga: (manga: Manga) => void;
  emptyMessage?: string;
  showProgress?: boolean;
}

export const MangaGrid: React.FC<MangaGridProps> = ({
  items,
  loading = false,
  skeletonCount = 12,
  onSelectManga,
  emptyMessage = 'No titles found matching your criteria.',
  showProgress = true
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
        {Array.from({ length: skeletonCount }).map((_, idx) => (
          <Skeleton key={idx} variant="card" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-zinc-900/40 rounded-2xl border border-zinc-800 my-4">
        <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 mb-3">
          <BookX className="w-6 h-6 text-zinc-400" />
        </div>
        <h4 className="text-base font-bold text-zinc-200 mb-1">No Manga Found</h4>
        <p className="text-xs text-zinc-400 max-w-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
      {items.map((manga, idx) => (
        <MangaCard
          key={manga.id ? `manga-${manga.id}` : (manga.anilist_id ? `anilist-${manga.anilist_id}` : `manga-${idx}-${manga.title}`)}
          manga={manga}
          onClick={() => onSelectManga(manga)}
          showProgress={showProgress}
          priority={idx < 6}
        />
      ))}
    </div>
  );
};
