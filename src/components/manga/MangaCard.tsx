import React from 'react';
import { Heart, Star, BookOpen } from 'lucide-react';
import { Manga } from '../../types';
import { ImageWithFallback } from '../common/ImageWithFallback';
import { Badge } from '../common/Badge';
import { ProgressBar } from '../common/ProgressBar';
import { useLibrary } from '../../hooks/useLibrary';
import {
  getMaterialTypeBadgeClass,
  getStatusColorClass,
  getDisplayTitle,
  getPresentationStatus,
  isReadingMedia
} from '../../utils/formatters';

interface MangaCardProps {
  manga: Manga;
  onClick?: () => void;
  showProgress?: boolean;
  priority?: boolean;
}

export const MangaCard: React.FC<MangaCardProps> = ({ manga, onClick, showProgress = true, priority = false }) => {
  const { isMangaFavorite, toggleFavorite, getEntryForManga, getProgressForManga } = useLibrary();

  const isFav = isMangaFavorite(manga);
  const entry = getEntryForManga(manga);
  const progress = getProgressForManga(manga);
  const displayTitle = getDisplayTitle(manga);

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await toggleFavorite(manga);
  };

  const currentChapters = progress?.chapters_read || 0;
  const presentationStatus = entry ? getPresentationStatus(entry.status, manga.type) : '';

  return (
    <div
      onClick={onClick}
      className="group relative flex flex-col rounded-xl overflow-hidden bg-zinc-900/70 border border-zinc-800/80 hover:border-zinc-700/80 hover:bg-zinc-900 transition-all duration-200 cursor-pointer shadow-xs hover:shadow-lg hover:shadow-black/40"
    >
      {/* Cover Image Container */}
      <div className="relative w-full aspect-[2/3] overflow-hidden bg-zinc-950">
        <ImageWithFallback
          src={manga.cover_url}
          alt={displayTitle}
          aspectRatio="aspect-[2/3]"
          priority={priority}
          className="group-hover:scale-105 transition-transform duration-300 pointer-events-none"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-black/30 opacity-70 group-hover:opacity-50 transition-opacity pointer-events-none" />

        {/* Favorite Heart Button */}
        <button
          type="button"
          onClick={handleFavoriteClick}
          className={`absolute top-2 right-2 z-10 p-1.5 rounded-full backdrop-blur-md transition-all cursor-pointer ${
            isFav
              ? 'bg-rose-500/90 text-white shadow-xs'
              : 'bg-black/50 text-zinc-300 hover:text-white hover:bg-black/70'
          }`}
          aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-current' : ''}`} />
        </button>

        {/* Top-Left Type Badge */}
        <div className="absolute top-2 left-2 z-10 flex flex-col gap-1 items-start pointer-events-none">
          <span
            className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border backdrop-blur-md shadow-xs ${getMaterialTypeBadgeClass(
              manga.type
            )}`}
          >
            {manga.type}
          </span>
        </div>

        {/* Bottom Score & Status on Cover */}
        <div className="absolute bottom-2 left-2 right-2 z-10 flex items-center justify-between text-xs pointer-events-none">
          {manga.score && manga.score > 0 ? (
            <div className="flex items-center gap-1 bg-black/70 backdrop-blur-md px-1.5 py-0.5 rounded border border-white/10 text-zinc-100 text-[10px] font-bold">
              <span>{manga.score}%</span>
            </div>
          ) : (
            <div />
          )}

          {entry && (
            <span
              className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border backdrop-blur-md ${getStatusColorClass(
                presentationStatus
              )}`}
            >
              {presentationStatus}
            </span>
          )}
        </div>
      </div>

      {/* Card Info */}
      <div className="flex flex-col flex-1 p-2.5 gap-1.5">
        <h4 className="font-bold text-xs sm:text-sm text-zinc-100 line-clamp-2 group-hover:text-sky-400 transition-colors leading-snug">
          {displayTitle}
        </h4>

        {/* Genres */}
        <div className="flex flex-wrap gap-1">
          {manga.genres?.slice(0, 2).map((genre) => (
            <span
              key={genre}
              className="text-[9px] font-medium px-1.5 py-0.2 rounded bg-zinc-950 text-zinc-400 border border-zinc-800"
            >
              {genre}
            </span>
          ))}
        </div>

        {/* Reading/Watching Progress Bar if active */}
        {showProgress && entry && (
          <div className="mt-auto pt-1">
            <ProgressBar
              current={currentChapters}
              total={manga.chapters}
              size="sm"
              showLabels={true}
              unitLabel={isReadingMedia(manga.type) ? 'Ch.' : 'Ep.'}
            />
          </div>
        )}

        {/* Footer Meta */}
        {!entry && (
          <div className="mt-auto pt-1 flex items-center justify-between text-[10px] text-zinc-400 uppercase tracking-tight">
            <span>{manga.release_year ? `${manga.release_year}` : manga.status}</span>
            <span>
              {manga.type === 'Movie'
                ? 'Movie'
                : manga.chapters
                ? `${manga.chapters} ${isReadingMedia(manga.type) ? 'Ch.' : 'Ep.'}`
                : manga.status}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
