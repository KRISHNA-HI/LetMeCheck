import React, { useState } from 'react';
import {
  X,
  Layers,
  ListOrdered,
  Film,
  Calendar,
  Info,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  BookOpen,
  Sparkles,
  Bookmark,
  Clock
} from 'lucide-react';
import { Universe, WatchOrder, WatchOrderEntry } from '../../types/content';
import { Manga } from '../../types';
import { ImageWithFallback } from '../common/ImageWithFallback';
import { useLibrary } from '../../hooks/useLibrary';
import {
  resolveEntryPoster,
  getEffectiveStatus
} from '../../services/universeImageResolver';

interface UniverseDetailModalProps {
  universe: Universe | null;
  initialWatchOrder?: WatchOrder | null;
  onClose: () => void;
  onSelectTitle: (manga: Manga) => void;
}

export const UniverseDetailModal: React.FC<UniverseDetailModalProps> = ({
  universe,
  initialWatchOrder,
  onClose,
  onSelectTitle
}) => {
  if (!universe) return null;

  const { library, getEntryForManga } = useLibrary();
  const availableOrders = universe.available_orders || universe.watch_orders || universe.watchOrders || [];

  const [activeOrderIndex, setActiveOrderIndex] = useState<number>(() => {
    if (!initialWatchOrder || !availableOrders.length) return 0;
    const foundIdx = availableOrders.findIndex((o) => o.id === initialWatchOrder.id);
    return foundIdx !== -1 ? foundIdx : 0;
  });

  const currentOrder: WatchOrder | undefined = availableOrders[activeOrderIndex] || availableOrders[0];
  const entries: WatchOrderEntry[] = currentOrder?.ordered_entries || currentOrder?.items || [];

  const handleEntryClick = (entry: WatchOrderEntry) => {
    const entryPoster = resolveEntryPoster(entry, universe);
    const pseudoManga: Manga = {
      id: entry.content_id || entry.contentId,
      title: entry.title || universe.name,
      description: entry.explanation || entry.context || universe.description,
      type: 'Movie',
      status: entry.status === 'upcoming' ? 'Ongoing' : 'Completed',
      cover_url: entryPoster,
      banner_url: null,
      release_year: entry.release_year,
      source: 'Universe Registry',
      genres: universe.genres || [universe.category || 'Franchise']
    };

    onClose();
    onSelectTitle(pseudoManga);
  };

  const getOrderBadge = (type: string) => {
    switch (type) {
      case 'chronological':
        return 'Chronological Timeline';
      case 'recommended':
        return 'Recommended Guide';
      case 'release_order':
      default:
        return 'Release Order';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-4xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header without coverpage placeholder */}
        <div className="p-4 sm:p-6 pb-4 border-b border-zinc-800/80 bg-zinc-900/90 shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded bg-sky-500/15 text-sky-400 border border-sky-500/30">
                  {universe.category?.replace('_', ' ') || 'Universe'}
                </span>
                <span className="text-[10px] font-mono font-medium text-zinc-400">
                  {universe.total_titles || entries.length} Titles Connected
                </span>
                {universe.original_name && (
                  <span className="text-[10px] text-zinc-500 font-medium">
                    • {universe.original_name}
                  </span>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-zinc-100 tracking-tight leading-tight">
                {universe.name}
              </h2>
              {universe.description && (
                <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed mt-2.5">
                  {universe.description}
                </p>
              )}
            </div>

            {/* Close button */}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center border border-zinc-700/60 transition-colors cursor-pointer shrink-0 mt-0.5"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 flex flex-col gap-5">
          {/* Watch Order Selector Tabs */}
          {availableOrders.length > 0 && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ListOrdered className="w-3.5 h-3.5 text-sky-400" />
                  <span>Choose Watch / Read Order</span>
                </h3>
                <span className="text-[10px] text-zinc-400 font-mono">
                  {availableOrders.length} {availableOrders.length === 1 ? 'Order Guide' : 'Order Guides'}
                </span>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                {availableOrders.map((order, idx) => (
                  <button
                    key={order.id || idx}
                    onClick={() => setActiveOrderIndex(idx)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                      activeOrderIndex === idx
                        ? 'bg-sky-500 text-zinc-950 shadow-md shadow-sky-500/20'
                        : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-zinc-800'
                    }`}
                  >
                    <span>{order.name || order.title}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-normal ${activeOrderIndex === idx ? 'bg-black/20 text-zinc-950 font-bold' : 'bg-zinc-800 text-zinc-400'}`}>
                      {getOrderBadge(order.order_type)}
                    </span>
                  </button>
                ))}
              </div>

              {currentOrder?.description && (
                <div className="p-3 rounded-xl bg-zinc-950/70 border border-zinc-800 text-xs text-zinc-400 flex items-start gap-2">
                  <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                  <span>{currentOrder.description}</span>
                </div>
              )}
            </div>
          )}

          {/* Ordered Titles Timeline List */}
          <div className="flex flex-col gap-2.5">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Sequence Checklist ({entries.length} Titles)
            </h3>

            <div className="space-y-2">
              {entries.map((entry, index) => {
                const entryId = entry.content_id || entry.contentId;
                const libraryEntry = getEntryForManga(entryId);
                const isTracked = Boolean(libraryEntry);
                const effectiveStatus = getEffectiveStatus(entry.releaseDate, entry.release_year, entry.status);
                const isUpcoming = effectiveStatus === 'upcoming';
                const entryPoster = resolveEntryPoster(entry, universe);

                return (
                  <div
                    key={`${entry.position || index}-${entryId}`}
                    onClick={() => handleEntryClick(entry)}
                    className="group flex items-center gap-3 p-3 rounded-xl bg-zinc-950/70 border border-zinc-800/80 hover:border-sky-500/50 hover:bg-zinc-900 transition-all cursor-pointer"
                  >
                    {/* Position Number Pill */}
                    <div className="w-7 h-7 rounded-lg bg-sky-500/15 text-sky-400 font-mono font-black text-xs flex items-center justify-center shrink-0 border border-sky-500/25">
                      #{entry.position || index + 1}
                    </div>

                    {/* Mini Thumbnail */}
                    <div className="w-9 h-12 rounded-md overflow-hidden bg-zinc-900 shrink-0 border border-zinc-800">
                      <ImageWithFallback
                        src={entryPoster}
                        alt={entry.title || ''}
                        aspectRatio="aspect-[2/3]"
                      />
                    </div>

                    {/* Entry Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs sm:text-sm font-bold text-zinc-100 group-hover:text-sky-400 transition-colors truncate">
                          {entry.title}
                        </span>
                        {entry.release_year && (
                          <span className="text-[10px] text-zinc-400 font-mono bg-zinc-900 px-1.5 py-0.2 rounded border border-zinc-800">
                            {entry.release_year}
                          </span>
                        )}
                        {entry.context && (
                          <span className="text-[10px] text-amber-300 font-medium bg-amber-500/10 px-2 py-0.2 rounded border border-amber-500/20">
                            {entry.context}
                          </span>
                        )}
                        {isUpcoming && (
                          <span className="text-[10px] text-purple-300 font-semibold bg-purple-500/15 px-2 py-0.2 rounded border border-purple-500/30 flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            <span>Upcoming</span>
                          </span>
                        )}
                      </div>

                      {entry.explanation && (
                        <p className="text-[11px] text-zinc-400 mt-1 line-clamp-1">
                          {entry.explanation}
                        </p>
                      )}
                    </div>

                    {/* Status / Tracking Pill */}
                    <div className="flex items-center gap-2 shrink-0">
                      {isTracked ? (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span className="hidden sm:inline">{libraryEntry.status}</span>
                        </span>
                      ) : null}

                      <div className="w-6 h-6 rounded-md bg-zinc-900 text-zinc-400 group-hover:text-sky-400 group-hover:bg-zinc-800 flex items-center justify-center transition-colors">
                        <ChevronRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
