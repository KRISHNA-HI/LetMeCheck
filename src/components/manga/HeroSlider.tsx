import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Play, Eye, Heart } from 'lucide-react';
import { Manga } from '../../types';
import { ImageWithFallback } from '../common/ImageWithFallback';
import { ProgressBar } from '../common/ProgressBar';
import { StatusSelector } from './StatusSelector';
import { getDisplayTitle, getReliableCoverUrl, getReliableBannerUrl } from '../../utils/formatters';

export interface HeroSlideItem {
  manga: Manga;
  badge: string;
  isReading?: boolean;
  region?: string;
}

interface HeroSliderProps {
  slides: HeroSlideItem[];
  onSelectManga: (manga: Manga) => void;
  getProgressForManga: (mangaId: string) => { chapters_read: number; updated_at?: string } | undefined;
  toggleFavorite?: (manga: Manga) => void;
  isMangaFavorite?: (manga: Manga) => boolean;
}

export const HeroSlider: React.FC<HeroSliderProps> = ({
  slides,
  onSelectManga,
  getProgressForManga,
  toggleFavorite,
  isMangaFavorite
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const touchMovedRef = useRef<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Keep index in bounds if slides length changes
  useEffect(() => {
    if (currentIndex >= slides.length && slides.length > 0) {
      setCurrentIndex(0);
    }
  }, [slides.length, currentIndex]);

  const goToNext = useCallback(() => {
    if (slides.length <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const goToPrev = useCallback(() => {
    if (slides.length <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  // Touch Swipe Handlers for smooth mobile swiping without interfering with vertical scroll
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartXRef.current = e.touches[0].clientX;
      touchStartYRef.current = e.touches[0].clientY;
      touchMovedRef.current = false;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null || touchStartYRef.current === null) return;
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const deltaX = currentX - touchStartXRef.current;
    const deltaY = currentY - touchStartYRef.current;

    // If moving significantly horizontally, flag that we've swiped
    if (Math.abs(deltaX) > 10 && Math.abs(deltaX) > Math.abs(deltaY)) {
      touchMovedRef.current = true;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const currentX = e.changedTouches[0].clientX;
    const currentY = e.changedTouches[0].clientY;
    const deltaX = currentX - touchStartXRef.current;
    const deltaY = Math.abs(currentY - (touchStartYRef.current || 0));

    // Threshold for horizontal swipe: at least 45px and more horizontal than vertical
    if (Math.abs(deltaX) > 45 && Math.abs(deltaX) > deltaY * 1.2) {
      if (deltaX < 0) {
        goToNext();
      } else {
        goToPrev();
      }
    }

    touchStartXRef.current = null;
    touchStartYRef.current = null;
  };

  if (!slides || slides.length === 0) return null;

  const currentSlide = slides[currentIndex] || slides[0];
  const currentManga = currentSlide.manga;
  const isReading = currentSlide.isReading;
  const badge = currentSlide.badge;

  const reliableCover = getReliableCoverUrl(currentManga);
  const reliableBanner = getReliableBannerUrl(currentManga);

  return (
    <section
      ref={containerRef}
      aria-roledescription="carousel"
      aria-label="Featured and Recent Releases Carousel"
      className="relative rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl z-20 overflow-hidden select-none touch-pan-y group"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Background Banner with Gradient Overlay */}
      <div className="absolute inset-0 z-0 overflow-hidden rounded-2xl pointer-events-none transition-opacity duration-700">
        {reliableBanner && reliableBanner.trim() !== '' ? (
          <img
            key={`banner-${currentManga.id}`}
            src={reliableBanner.trim()}
            alt={getDisplayTitle(currentManga)}
            loading="eager"
            decoding="async"
            className="w-full h-full object-cover opacity-25 filter blur-xs transition-opacity duration-500"
          />
        ) : reliableCover && reliableCover.trim() !== '' && reliableCover !== '/placeholder-cover.svg' ? (
          <img
            key={`cover-bg-${currentManga.id}`}
            src={reliableCover.trim()}
            alt={getDisplayTitle(currentManga)}
            loading="eager"
            decoding="async"
            className="w-full h-full object-cover opacity-20 filter blur-md transition-opacity duration-500"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent pointer-events-none" />
      </div>

      {/* Hero Content */}
      <div className="relative z-10 p-6 sm:p-8 md:p-10 flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-8 pb-14 sm:pb-16">
        {/* Cover Card */}
        <div
          onClick={() => onSelectManga(currentManga)}
          className="w-36 sm:w-48 md:w-52 aspect-[2/3] shrink-0 rounded-xl overflow-hidden border border-zinc-700/80 shadow-2xl cursor-pointer hover:scale-102 transition-transform relative group/cover"
        >
          <ImageWithFallback
            src={reliableCover}
            alt={getDisplayTitle(currentManga)}
            aspectRatio="aspect-[2/3]"
            priority={true}
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/cover:opacity-100 transition-opacity flex items-center justify-center">
            <span className="bg-sky-500 text-white rounded-full p-2.5 shadow-lg">
              <Eye className="w-5 h-5" />
            </span>
          </div>
        </div>

        {/* Meta and Description */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left gap-2.5 flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap justify-center md:justify-start">
            <span
              className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                isReading
                  ? 'bg-sky-500/25 text-sky-300 border border-sky-500/40'
                  : badge.includes('Favorites')
                  ? 'bg-rose-500/25 text-rose-300 border border-rose-500/40'
                  : badge.includes('Search')
                  ? 'bg-indigo-500/25 text-indigo-300 border border-indigo-500/40'
                  : badge.includes('Library')
                  ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40'
                  : badge.includes('Bollywood') || badge.includes('Hindi')
                  ? 'bg-orange-500/25 text-orange-300 border border-orange-500/40'
                  : badge.includes('South Indian') || badge.includes('Telugu') || badge.includes('Tamil')
                  ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/40'
                  : badge.includes('Anime')
                  ? 'bg-purple-500/25 text-purple-300 border border-purple-500/40'
                  : badge.includes('Hollywood')
                  ? 'bg-blue-500/25 text-blue-300 border border-blue-500/40'
                  : 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
              }`}
            >
              {badge}
            </span>

            <span className="text-[10px] px-2 py-0.5 bg-zinc-800 text-zinc-300 rounded-full font-bold uppercase tracking-wider">
              {currentManga.type}
            </span>

            {currentManga.release_year && (
              <span className="text-[10px] px-2 py-0.5 bg-zinc-800/80 text-zinc-400 rounded-full font-medium">
                {currentManga.release_year}
              </span>
            )}

            <span className="text-[10px] px-2 py-0.5 bg-emerald-500/15 text-emerald-400 rounded-full font-bold uppercase tracking-wider">
              {currentManga.status}
            </span>

            {currentManga.score && currentManga.score > 0 ? (
              <span className="text-[10px] px-2 py-0.5 bg-amber-500/15 text-amber-300 rounded-full font-bold uppercase tracking-wider">
                ★ {currentManga.score}%
              </span>
            ) : null}
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-zinc-100 tracking-tight leading-tight line-clamp-2">
            {getDisplayTitle(currentManga)}
          </h1>

          {/* Genres */}
          <div className="flex flex-wrap gap-1 justify-center md:justify-start">
            {currentManga.genres?.slice(0, 5).map((g) => (
              <span
                key={g}
                className="text-[10px] px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800 font-medium"
              >
                {g}
              </span>
            ))}
          </div>

          <p className="text-xs text-zinc-400 line-clamp-2 md:line-clamp-3 max-w-2xl leading-relaxed">
            {currentManga.description}
          </p>

          {/* Progress if currently reading hero */}
          {isReading && (
            <div className="w-full max-w-md my-1 p-2.5 rounded-xl bg-black/40 border border-zinc-800/80">
              <ProgressBar
                current={getProgressForManga(currentManga.id)?.chapters_read || 0}
                total={currentManga.chapters}
                size="sm"
                showLabels={true}
                unitLabel={currentManga.type === 'Movie' ? 'Min' : currentManga.type === 'TV Series' || currentManga.type === 'Anime' ? 'Ep.' : 'Ch.'}
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 mt-2 relative z-30">
            <button
              type="button"
              onClick={() => onSelectManga(currentManga)}
              className="bg-white text-black text-xs font-bold px-5 py-2 rounded-lg hover:bg-sky-400 transition-colors shadow-sm cursor-pointer flex items-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5 fill-black" />
              <span>View Details</span>
            </button>

            <StatusSelector manga={currentManga} size="md" dropdownPosition="top" />

            {toggleFavorite && (
              <button
                type="button"
                onClick={() => toggleFavorite(currentManga)}
                className={`p-2 rounded-lg border transition-all cursor-pointer ${
                  isMangaFavorite && isMangaFavorite(currentManga)
                    ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                    : 'bg-zinc-800/80 text-zinc-300 border-zinc-700 hover:bg-zinc-800'
                }`}
                aria-label="Toggle Favorite"
              >
                <Heart className={`w-4 h-4 ${isMangaFavorite && isMangaFavorite(currentManga) ? 'fill-current' : ''}`} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Arrows (visible on desktop hover or tap) */}
      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={goToPrev}
            aria-label="Previous slide"
            className="absolute left-2.5 top-1/2 -translate-y-1/2 z-30 p-2 rounded-full bg-black/60 hover:bg-black/90 text-zinc-300 hover:text-white border border-zinc-700/60 backdrop-blur-xs transition-all shadow-lg opacity-80 hover:opacity-100 hover:scale-105 active:scale-95 cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={goToNext}
            aria-label="Next slide"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 z-30 p-2 rounded-full bg-black/60 hover:bg-black/90 text-zinc-300 hover:text-white border border-zinc-700/60 backdrop-blur-xs transition-all shadow-lg opacity-80 hover:opacity-100 hover:scale-105 active:scale-95 cursor-pointer"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* Carousel Pagination Dots & Swipe Helper */}
      {slides.length > 1 && (
        <div className="absolute bottom-3 left-0 right-0 z-30 flex items-center justify-center gap-1.5 pointer-events-auto">
          {slides.map((_, idx) => (
            <button
              key={`dot-${idx}`}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              aria-current={currentIndex === idx ? 'true' : 'false'}
              className={`transition-all duration-300 rounded-full cursor-pointer ${
                currentIndex === idx
                  ? 'w-6 h-1.5 bg-sky-400 shadow-sm shadow-sky-500/50'
                  : 'w-1.5 h-1.5 bg-zinc-600 hover:bg-zinc-400'
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
};
