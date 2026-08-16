import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Heart,
  Star,
  BookOpen,
  Calendar,
  Layers,
  Sparkles,
  ExternalLink,
  Users,
  CheckCircle2,
  Tag,
  Share2,
  AlertCircle
} from 'lucide-react';
import { Manga } from '../types';
import { mangaApi } from '../services/mangaApi';
import { useLibrary } from '../hooks/useLibrary';
import { ImageWithFallback } from '../components/common/ImageWithFallback';
import { StatusSelector } from '../components/manga/StatusSelector';
import { ProgressTracker } from '../components/manga/ProgressTracker';
import { MaterialGuide } from '../components/manga/MaterialGuide';
import { NotesSection } from '../components/manga/NotesSection';
import {
  getMaterialTypeBadgeClass,
  getStatusColorClass,
  getDisplayTitle,
  getEnglishTitle,
  getRomajiTitle,
  getNativeTitle,
  getAllTitleVariants
} from '../utils/formatters';

interface MangaDetailsProps {
  mangaId: string | number;
  onBack: () => void;
  onSelectManga: (manga: Manga) => void;
}

export const MangaDetails: React.FC<MangaDetailsProps> = ({ mangaId, onBack, onSelectManga }) => {
  const { isMangaFavorite, toggleFavorite, getEntryForManga } = useLibrary();

  const [manga, setManga] = useState<Manga | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'guide' | 'progress' | 'notes'>('guide');
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadManga = async () => {
      setLoading(true);
      try {
        const data = await mangaApi.getMangaById(mangaId);
        if (isMounted) {
          setManga(data);
        }
      } catch (err) {
        console.warn('Failed to load manga details:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadManga();
    return () => {
      isMounted = false;
    };
  }, [mangaId]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse flex flex-col gap-6">
        <div className="h-6 bg-zinc-800 rounded w-24 mb-2" />
        <div className="h-64 sm:h-80 bg-zinc-900 rounded-2xl border border-zinc-800" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-96 bg-zinc-900 rounded-2xl border border-zinc-800" />
          <div className="lg:col-span-2 h-96 bg-zinc-900 rounded-2xl border border-zinc-800" />
        </div>
      </div>
    );
  }

  if (!manga) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400">
          <AlertCircle className="w-6 h-6 text-amber-400" />
        </div>
        <h2 className="text-xl font-bold text-zinc-100">Title Not Found</h2>
        <p className="text-xs text-zinc-400">
          Could not locate metadata for this manga. It may have been removed or is temporarily unavailable.
        </p>
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 transition-colors"
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
    <div className="flex flex-col gap-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
      <div className="relative rounded-3xl bg-zinc-950 border border-zinc-800 shadow-xl">
        {/* Backdrop Banner */}
        <div className="absolute inset-0 h-56 sm:h-72 w-full overflow-hidden rounded-t-3xl">
          {manga.banner_url ? (
            <img
              src={manga.banner_url}
              alt={displayTitle}
              loading="eager"
              decoding="async"
              className="w-full h-full object-cover opacity-30 filter blur-xs"
            />
          ) : (
            <img
              src={manga.cover_url}
              alt={displayTitle}
              loading="eager"
              decoding="async"
              className="w-full h-full object-cover opacity-20 filter blur-md"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/80 to-transparent" />
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

      {/* Main Grid: Sidebar Details + Material Guide / Tracking Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Sidebar: Detailed Facts & Synopsis */}
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
                <span className="text-zinc-400 font-medium">Chapters</span>
                <span className="text-zinc-200 font-semibold mt-0.5">
                  {manga.chapters ? manga.chapters : 'Ongoing'}
                </span>
              </div>
              <div className="flex flex-col bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-800/80">
                <span className="text-zinc-400 font-medium">Volumes</span>
                <span className="text-zinc-200 font-semibold mt-0.5">
                  {manga.volumes ? manga.volumes : 'Unknown'}
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

          {/* Synopsis Card */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 flex flex-col gap-3">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Synopsis</h3>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed whitespace-pre-line">
              {manga.description}
            </p>
          </div>
        </div>

        {/* Right Section: Material Guide & Tracking Tabs */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 p-1 bg-zinc-900/90 border border-zinc-800 rounded-xl">
            <button
              onClick={() => setActiveTab('guide')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'guide'
                  ? 'bg-zinc-800 text-sky-400 shadow-sm border border-zinc-700/60'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Material Guide</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-950 font-mono text-zinc-400 border border-zinc-800">
                {manga.materials?.length || 1}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('progress')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'progress'
                  ? 'bg-zinc-800 text-sky-400 shadow-sm border border-zinc-700/60'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Chapter Progress</span>
            </button>

            <button
              onClick={() => setActiveTab('notes')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'notes'
                  ? 'bg-zinc-800 text-sky-400 shadow-sm border border-zinc-700/60'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Personal Notes</span>
            </button>
          </div>

          {/* Tab Views */}
          {activeTab === 'guide' && <MaterialGuide manga={manga} />}
          {activeTab === 'progress' && <ProgressTracker manga={manga} />}
          {activeTab === 'notes' && <NotesSection manga={manga} />}
        </div>
      </div>
    </div>
  );
};
