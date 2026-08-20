import React from 'react';
import { Layers, Film, Sparkles, ArrowRight, BookOpen } from 'lucide-react';
import { Universe } from '../../types/content';

interface UniverseCardProps {
  universe: Universe;
  onSelect: (universe: Universe) => void;
  variant?: 'featured' | 'compact' | 'order';
}

export const UniverseCard: React.FC<UniverseCardProps> = ({
  universe,
  onSelect,
  variant = 'featured'
}) => {
  const availableOrders = universe.available_orders || universe.watch_orders || universe.watchOrders || [];
  const defaultOrder = availableOrders.find((o) => o.is_default) || availableOrders[0];
  const orderCount = availableOrders.length;
  const titlesCount = universe.total_titles || (defaultOrder ? (defaultOrder.ordered_entries?.length || defaultOrder.items?.length || 0) : 0);

  const getCategoryLabel = (cat?: string) => {
    switch (cat) {
      case 'cinematic_universe':
        return 'Cinematic Universe';
      case 'anime_universe':
        return 'Anime Universe';
      case 'franchise':
        return 'Franchise';
      case 'series':
        return 'Series Saga';
      default:
        return 'Connected Universe';
    }
  };

  const getCategoryBadgeClass = (cat?: string) => {
    switch (cat) {
      case 'cinematic_universe':
        return 'bg-sky-500/15 text-sky-400 border-sky-500/30';
      case 'anime_universe':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'franchise':
        return 'bg-purple-500/15 text-purple-400 border-purple-500/30';
      default:
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    }
  };

  if (variant === 'compact') {
    return (
      <div
        onClick={() => onSelect(universe)}
        className="group relative flex items-center justify-between gap-3.5 p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 hover:border-sky-500/50 hover:bg-zinc-850 transition-all cursor-pointer shadow-xs hover:shadow-md"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getCategoryBadgeClass(universe.category)}`}>
              {getCategoryLabel(universe.category)}
            </span>
            <span className="text-[10px] text-zinc-400 font-mono font-medium">
              {titlesCount} {titlesCount === 1 ? 'Title' : 'Titles'}
            </span>
          </div>
          <h4 className="text-xs sm:text-sm font-bold text-zinc-100 group-hover:text-sky-400 transition-colors truncate">
            {universe.name}
          </h4>
          <p className="text-[11px] text-zinc-400 truncate mt-0.5">
            {universe.description}
          </p>
        </div>
        <div className="w-7 h-7 rounded-lg bg-zinc-800/80 group-hover:bg-sky-500 group-hover:text-zinc-950 text-zinc-400 flex items-center justify-center transition-all shrink-0">
          <ArrowRight className="w-3.5 h-3.5" />
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => onSelect(universe)}
      className="group relative flex flex-col justify-between p-4 sm:p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 hover:border-sky-500/60 hover:bg-zinc-850/90 overflow-hidden transition-all duration-200 hover:shadow-xl hover:shadow-sky-500/5 cursor-pointer flex-shrink-0 w-72 sm:w-80"
    >
      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md border shadow-xs ${getCategoryBadgeClass(universe.category)}`}>
            {getCategoryLabel(universe.category)}
          </span>

          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-zinc-950/80 border border-zinc-800 text-[10px] font-mono font-semibold text-zinc-300">
            <Film className="w-3 h-3 text-sky-400" />
            <span>{titlesCount} {titlesCount === 1 ? 'Title' : 'Titles'}</span>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-sm sm:text-base font-extrabold text-zinc-100 group-hover:text-sky-400 transition-colors leading-tight">
          {universe.name}
        </h3>
        {universe.original_name && (
          <div className="text-[10px] text-zinc-400 truncate font-medium mt-0.5">
            {universe.original_name}
          </div>
        )}

        {/* Card Body */}
        <p className="text-xs text-zinc-300 line-clamp-3 leading-relaxed mt-2">
          {universe.description}
        </p>
      </div>

      {/* Available Watch Orders Summary */}
      <div className="flex items-center justify-between pt-3 mt-4 border-t border-zinc-800/80 text-xs">
        {orderCount > 0 ? (
          <div className="flex items-center gap-1.5 text-zinc-400">
            <Layers className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-[11px] font-medium">
              {orderCount} {orderCount === 1 ? 'Watch Order' : 'Watch Orders'}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-zinc-400">
            <Film className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[11px] font-medium">
              Universe Guide
            </span>
          </div>
        )}

        <div className="flex items-center gap-1 text-sky-400 group-hover:translate-x-0.5 transition-transform text-[11px] font-bold">
          <span>Explore</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </div>
  );
};
