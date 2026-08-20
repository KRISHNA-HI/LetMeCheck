import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  ArrowLeft,
  Heart,
  Star,
  Calendar,
  ExternalLink,
  Users,
  CheckCircle2,
  Tag,
  Share2,
  AlertCircle,
  RefreshCw,
  WifiOff,
  Layers,
  ListOrdered,
  ChevronRight
} from 'lucide-react';
import { Manga, Universe, WatchOrder, WatchOrderEntry } from '../types';
import { mangaApi } from '../services/mangaApi';
import { universeService } from '../services/universeService';
import { useLibrary } from '../hooks/useLibrary';
import { ImageWithFallback } from '../components/common/ImageWithFallback';
import { StatusSelector } from '../components/manga/StatusSelector';
import { NotesSection } from '../components/manga/NotesSection';
import { UniverseDetailModal } from '../components/universe/UniverseDetailModal';
import {
  getMaterialTypeBadgeClass,
  getStatusColorClass,
  getDisplayTitle,
  getEnglishTitle,
  getRomajiTitle,
  getNativeTitle,
  getAllTitleVariants,
  isReadingMedia,
  getReliableBannerUrl,
  getReliableCoverUrl
} from '../utils/formatters';

interface MangaDetailsProps {
  mangaId: string | number;
  initialManga?: Manga | null;
  onBack: () => void;
  onSelectManga: (manga: Manga) => void;
}

export const MangaDetails: React.FC<MangaDetailsProps> = ({ mangaId, initialManga: passedInitialManga, onBack, onSelectManga }) => {
  const { isMangaFavorite, toggleFavorite, getEntryForManga } = useLibrary();

  // Try initial cached item from prop or user's library if available
  const existingLibraryEntry = getEntryForManga(mangaId);
  const fallbackManga = passedInitialManga || existingLibraryEntry?.manga || null;

  const [manga, setManga] = useState<Manga | null>(fallbackManga);
  const [loading, setLoading] = useState<boolean>(!fallbackManga);
  const [errorInfo, setErrorInfo] = useState<{
    type: 'NOT_FOUND' | 'TEMPORARY_ERROR';
    message: string;
  } | null>(null);
  const [isRetrying, setIsRetrying] = useState<boolean>(false);
  const [retryCountdown, setRetryCountdown] = useState<number | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Universe & Watch Order Connection
  const [universeConnection, setUniverseConnection] = useState<{
    universe: Universe;
    entry?: WatchOrderEntry;
    order?: WatchOrder;
  } | null>(null);
  const [isUniverseModalOpen, setIsUniverseModalOpen] = useState(false);

  useEffect(() => {
    if (manga) {
      universeService.findUniverseForContent(manga.id, manga.title).then((conn) => {
        setUniverseConnection(conn);
      });
    }
  }, [manga]);

  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMountedRef = useRef<boolean>(true);

  const clearTimers = () => {
    if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    retryTimerRef.current = null;
    countdownIntervalRef.current = null;
  };

  const loadManga = useCallback(
    async (isManualRetry = false) => {
      clearTimers();
      if (!isMountedRef.current) return;

      if (isManualRetry) {
        setIsRetrying(true);
      } else if (!manga) {
        setLoading(true);
      }
      setErrorInfo(null);

      try {
        if (mangaApi.getMangaDetail) {
          const res = await mangaApi.getMangaDetail(mangaId);
          if (!isMountedRef.current) return;

          if (res.data) {
            setManga(res.data);
            setErrorInfo(null);
            setRetryCountdown(null);
          } else if (res.errorType === 'NOT_FOUND') {
            setManga(null);
            setErrorInfo({
              type: 'NOT_FOUND',
              message: res.errorMessage || 'Could not locate metadata for this manga in the catalog.'
            });
            setRetryCountdown(null);
          } else {
            // Temporary error
            if (!manga) {
              setErrorInfo({
                type: 'TEMPORARY_ERROR',
                message:
                  res.errorMessage ||
                  'AniList catalog service is temporarily busy. We will automatically retry in a few seconds.'
              });
              // Schedule auto-retry countdown
              setRetryCountdown(6);
              let remaining = 6;
              countdownIntervalRef.current = setInterval(() => {
                remaining -= 1;
                if (remaining <= 0) {
                  clearTimers();
                  setRetryCountdown(null);
                  loadManga(false);
                } else {
                  setRetryCountdown(remaining);
                }
              }, 1000);
            }
          }
        } else {
          const data = await mangaApi.getMangaById(mangaId);
          if (!isMountedRef.current) return;
          if (data) {
            setManga(data);
            setErrorInfo(null);
          } else {
            setManga(null);
            setErrorInfo({
              type: 'NOT_FOUND',
              message: 'Could not locate metadata for this manga.'
            });
          }
        }
      } catch (err: any) {
        if (!isMountedRef.current) return;
        console.warn('Failed to load manga details:', err);
        if (!manga) {
          setErrorInfo({
            type: 'TEMPORARY_ERROR',
            message: 'Unable to connect to the catalog server. Please check your internet connection or try again.'
          });
        }
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
          setIsRetrying(false);
        }
      }
    },
    [mangaId, manga]
  );

  useEffect(() => {
    isMountedRef.current = true;
    loadManga();

    const handleOnline = () => {
      if (errorInfo?.type === 'TEMPORARY_ERROR' || !manga) {
        loadManga(true);
      }
    };
    window.addEventListener('online', handleOnline);

    return () => {
      isMountedRef.current = false;
      clearTimers();
      window.removeEventListener('online', handleOnline);
    };
  }, [mangaId]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-28 md:pb-20 flex flex-col gap-6">
        <div>
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-semibold text-zinc-300 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
        </div>
        <div className="animate-pulse flex flex-col gap-6">
          <div className="h-64 sm:h-80 bg-zinc-900 rounded-2xl border border-zinc-800" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="h-96 bg-zinc-900 rounded-2xl border border-zinc-800" />
            <div className="lg:col-span-2 h-96 bg-zinc-900 rounded-2xl border border-zinc-800" />
          </div>
        </div>
      </div>
    );
  }

  // Handle errors when no manga object is available
  if (!manga) {
    if (errorInfo?.type === 'TEMPORARY_ERROR') {
      return (
        <div className="max-w-xl mx-auto px-4 py-16 text-center flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <WifiOff className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-zinc-100">Temporary Connection Issue</h2>
          <p className="text-xs text-zinc-400 max-w-md leading-relaxed">
            {errorInfo.message}
          </p>

          {retryCountdown !== null && retryCountdown > 0 && (
            <div className="text-xs font-semibold text-sky-400 bg-sky-500/10 border border-sky-500/20 px-3 py-1 rounded-full">
              Automatically retrying in {retryCountdown}s...
            </div>
          )}

          <div className="flex items-center gap-3 mt-2">
            <button
              onClick={() => loadManga(true)}
              disabled={isRetrying}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-xs font-bold text-white transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
              <span>{isRetrying ? 'Retrying...' : 'Retry Now'}</span>
            </button>
            <button
              onClick={onBack}
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 transition-colors cursor-pointer"
            >
              Back to Catalog
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400">
          <AlertCircle className="w-6 h-6 text-zinc-400" />
        </div>
        <h2 className="text-xl font-bold text-zinc-100">Title Not Found</h2>
        <p className="text-xs text-zinc-400">
          {errorInfo?.message ||
            'Could not locate metadata for this manga. It may have been removed or does not exist in the catalog.'}
        </p>
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 transition-colors cursor-pointer"
        >
          Back to Catalog
        </button>
      </div>
    );
  }

  const isFav = isMangaFavorite(manga);
  const entry = getEntryForManga(manga);

  const displayTitle = getDisplayTitle(manga);
  const englishTitle = getEnglishTitle(manga);
  const romajiTitle = getRomajiTitle(manga);
  const nativeTitle = getNativeTitle(manga);
  const allVariants = getAllTitleVariants(manga);
  const secondaryAlts = allVariants.filter(
    (t) => t !== displayTitle && t !== nativeTitle && t !== romajiTitle
  );

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-28 md:pb-20">
      {/* Temporary Sync Issue Non-Intrusive Banner if viewing cached data */}
      {errorInfo?.type === 'TEMPORARY_ERROR' && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 shrink-0 text-amber-400" />
            <span>Showing saved offline details. Live catalog sync is temporarily busy.</span>
          </div>
          <button
            onClick={() => loadManga(true)}
            className="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-[11px] font-semibold text-amber-200 cursor-pointer"
          >
            Retry Sync
          </button>
        </div>
      )}

      {/* Top Breadcrumb Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-semibold text-zinc-300 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-medium text-zinc-300 transition-colors cursor-pointer"
            title="Share page"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{copiedLink ? 'Copied URL!' : 'Share'}</span>
          </button>
        </div>
      </div>

      {/* Main Header / Banner Section */}
      <div className="relative rounded-3xl bg-zinc-950 border border-zinc-800 shadow-xl z-20">
        {/* Backdrop Banner */}
        <div className="absolute top-0 left-0 right-0 h-56 sm:h-72 w-full overflow-hidden rounded-t-3xl pointer-events-none">
          {(() => {
            const banner = getReliableBannerUrl(manga);
            const cover = getReliableCoverUrl(manga);
            if (banner && banner.trim() !== '') {
              return (
                <img
                  src={banner.trim()}
                  alt={displayTitle}
                  loading="eager"
                  decoding="async"
                  className="w-full h-full object-cover opacity-30 filter blur-xs"
                />
              );
            }
            if (cover && cover.trim() !== '' && cover !== '/placeholder-cover.svg') {
              return (
                <img
                  src={cover.trim()}
                  alt={displayTitle}
                  loading="eager"
                  decoding="async"
                  className="w-full h-full object-cover opacity-20 filter blur-md"
                />
              );
            }
            return (
              <div className="w-full h-full bg-gradient-to-b from-zinc-800/40 via-zinc-900/60 to-zinc-950" />
            );
          })()}
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/70 to-transparent pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/80 to-transparent pointer-events-none" />
        </div>

        {/* Content Overlay */}
        <div className="relative z-10 pt-20 sm:pt-28 p-6 sm:p-8 flex flex-col md:flex-row gap-6 md:gap-8 items-start">
          {/* Cover Art */}
          <div className="w-36 sm:w-48 md:w-52 aspect-[2/3] shrink-0 rounded-2xl overflow-hidden border-2 border-zinc-700/80 shadow-2xl bg-zinc-900 self-center md:self-start">
            <ImageWithFallback
              src={manga.cover_url}
              alt={displayTitle}
              aspectRatio="aspect-[2/3]"
              priority={true}
            />
          </div>

          {/* Details & Metadata Header */}
          <div className="flex flex-col gap-3 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`text-xs font-semibold px-2.5 py-0.5 rounded-md border ${getMaterialTypeBadgeClass(
                  manga.type
                )}`}
              >
                {manga.type}
              </span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                {manga.status}
              </span>
              {manga.score && manga.score > 0 ? (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <Star className="w-3 h-3 fill-amber-400" /> {manga.score}%
                </span>
              ) : null}
              {manga.release_year && (
                <span className="text-xs text-zinc-400 font-mono bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                  {manga.release_year}
                </span>
              )}
            </div>

            {/* Primary English/Translated Title */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-zinc-100 tracking-tight leading-tight">
              {displayTitle}
            </h1>

            {/* Preserved Original/Native, Romaji, and Synonym Titles */}
            <div className="flex flex-col gap-1 text-xs">
              {nativeTitle && nativeTitle !== displayTitle && (
                <div className="text-zinc-400 font-medium flex items-center gap-1.5 flex-wrap">
                  <span className="text-zinc-400 font-semibold">Original:</span>
                  <span className="text-zinc-200">{nativeTitle}</span>
                </div>
              )}
              {romajiTitle && romajiTitle !== displayTitle && romajiTitle !== nativeTitle && (
                <div className="text-zinc-400 font-medium flex items-center gap-1.5 flex-wrap">
                  <span className="text-zinc-400 font-semibold">Romaji:</span>
                  <span className="text-zinc-300">{romajiTitle}</span>
                </div>
              )}
              {secondaryAlts.length > 0 && (
                <div className="text-zinc-400 font-medium flex items-center gap-1.5 flex-wrap">
                  <span className="text-zinc-400 font-semibold">Alt:</span>
                  <span className="text-zinc-400">{secondaryAlts.slice(0, 3).join(' • ')}</span>
                </div>
              )}
            </div>

            {/* Genres */}
            <div className="flex flex-wrap gap-1.5 my-1">
              {manga.genres?.map((genre) => (
                <span
                  key={genre}
                  className="text-xs font-medium px-2.5 py-0.5 rounded-md bg-zinc-900 text-zinc-300 border border-zinc-800"
                >
                  {genre}
                </span>
              ))}
            </div>

            {/* Actions Bar: Status Selector & Favorite */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <StatusSelector manga={manga} size="md" />

              <button
                type="button"
                onClick={() => toggleFavorite(manga)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  isFav
                    ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 shadow-xs'
                    : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-800'
                }`}
              >
                <Heart className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
                <span>{isFav ? 'Favorited' : 'Favorite'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Sidebar Details + Synopsis & Personal Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Sidebar: Detailed Facts */}
        <div className="flex flex-col gap-5">
          {/* Metadata Card */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 flex flex-col gap-4">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Work Information
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="flex flex-col bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-800/80">
                <span className="text-zinc-400 font-medium">Type</span>
                <span className="text-zinc-200 font-semibold mt-0.5">{manga.type}</span>
              </div>
              <div className="flex flex-col bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-800/80">
                <span className="text-zinc-400 font-medium">Status</span>
                <span className="text-zinc-200 font-semibold mt-0.5">{manga.status}</span>
              </div>
              <div className="flex flex-col bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-800/80">
                <span className="text-zinc-400 font-medium">
                  {isReadingMedia(manga.type) ? 'Chapters' : 'Episodes'}
                </span>
                <span className="text-zinc-200 font-semibold mt-0.5">
                  {manga.chapters ? manga.chapters : isReadingMedia(manga.type) ? 'Ongoing' : 'Available'}
                </span>
              </div>
              <div className="flex flex-col bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-800/80">
                <span className="text-zinc-400 font-medium">
                  {isReadingMedia(manga.type) ? 'Volumes' : 'Seasons'}
                </span>
                <span className="text-zinc-200 font-semibold mt-0.5">
                  {manga.volumes ? manga.volumes : isReadingMedia(manga.type) ? 'Unknown' : '1+'}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2 border-t border-zinc-800 text-xs">
              {englishTitle && (
                <div className="flex justify-between py-1">
                  <span className="text-zinc-400">English Title:</span>
                  <span className="text-zinc-200 font-medium text-right max-w-[65%] truncate" title={englishTitle}>{englishTitle}</span>
                </div>
              )}
              {romajiTitle && (
                <div className="flex justify-between py-1">
                  <span className="text-zinc-400">Romanized:</span>
                  <span className="text-zinc-200 font-medium text-right max-w-[65%] truncate" title={romajiTitle}>{romajiTitle}</span>
                </div>
              )}
              {nativeTitle && (
                <div className="flex justify-between py-1">
                  <span className="text-zinc-400">Native / Original:</span>
                  <span className="text-zinc-200 font-medium text-right max-w-[65%] truncate" title={nativeTitle}>{nativeTitle}</span>
                </div>
              )}
              {manga.author && (
                <div className="flex justify-between py-1">
                  <span className="text-zinc-400">Story / Author:</span>
                  <span className="text-zinc-200 font-medium text-right">{manga.author}</span>
                </div>
              )}
              {manga.artist && manga.artist !== manga.author && (
                <div className="flex justify-between py-1">
                  <span className="text-zinc-400">Art / Illustrator:</span>
                  <span className="text-zinc-200 font-medium text-right">{manga.artist}</span>
                </div>
              )}
              <div className="flex justify-between py-1">
                <span className="text-zinc-400">Source Database:</span>
                <span className="text-sky-400 font-medium">{manga.source || 'AniList'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section: Synopsis, Universe Connection & Personal Notes */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          {/* Universe & Watch Order Connection Banner (Rendered only if part of a universe) */}
          {universeConnection && (
            <div className="bg-gradient-to-r from-sky-950/40 via-zinc-900/80 to-zinc-900/90 border border-sky-500/30 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg shadow-sky-950/20">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center shrink-0 mt-0.5">
                  <Layers className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-sky-400">
                      Part of Connected Universe
                    </span>
                    {universeConnection.entry?.position && (
                      <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-sky-500/20 text-sky-300 font-bold">
                        #{universeConnection.entry.position} in Timeline
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm sm:text-base font-bold text-zinc-100">
                    {universeConnection.universe.name}
                  </h4>
                  <p className="text-xs text-zinc-400 line-clamp-1 mt-0.5">
                    {universeConnection.entry?.explanation || universeConnection.universe.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                <button
                  type="button"
                  onClick={() => setIsUniverseModalOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-zinc-950 text-xs font-bold transition-all shadow-md shadow-sky-500/20 cursor-pointer"
                >
                  <ListOrdered className="w-3.5 h-3.5" />
                  <span>View Watch Order</span>
                </button>
              </div>
            </div>
          )}

          {/* Synopsis Card */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 flex flex-col gap-3">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Synopsis</h3>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed whitespace-pre-line">
              {manga.description}
            </p>
          </div>

          {/* Personal Notes Section */}
          <NotesSection manga={manga} />
        </div>
      </div>

      {/* Universe Modal */}
      {isUniverseModalOpen && universeConnection && (
        <UniverseDetailModal
          universe={universeConnection.universe}
          initialWatchOrder={universeConnection.order}
          onClose={() => setIsUniverseModalOpen(false)}
          onSelectTitle={(selected) => {
            setIsUniverseModalOpen(false);
            onSelectManga(selected);
          }}
        />
      )}
    </div>
  );
};
