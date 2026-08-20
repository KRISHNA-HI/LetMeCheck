import React from 'react';
import { Film, Sparkles, BookOpen, Tv, Layers, ArrowRight } from 'lucide-react';
import { Universe } from '../../types/content';

interface UniverseTextCardProps {
  universe: Universe;
  onSelect: (universe: Universe) => void;
}

export const UniverseTextCard: React.FC<UniverseTextCardProps> = ({
  universe,
  onSelect
}) => {
  const availableOrders = universe.available_orders || universe.watch_orders || universe.watchOrders || [];
  const defaultOrder = availableOrders.find((o) => o.is_default) || availableOrders[0];
  const titlesCount =
    universe.total_titles ||
    (defaultOrder ? (defaultOrder.ordered_entries?.length || defaultOrder.items?.length || 0) : 0);

  const getCategoryConfig = (cat?: string) => {
    switch (cat) {
      case 'cinematic_universe':
        return {
          shortLabel: 'Cinematic',
          icon: Film,
          badgeColor: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
          dotColor: 'bg-sky-400'
        };
      case 'anime_universe':
        return {
          shortLabel: 'Anime',
          icon: Sparkles,
          badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
          dotColor: 'bg-amber-400'
        };
      case 'series':
        return {
          shortLabel: 'Series',
          icon: Tv,
          badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
          dotColor: 'bg-emerald-400'
        };
      case 'manga':
      case 'comic':
        return {
          shortLabel: 'Comics',
          icon: BookOpen,
          badgeColor: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
          dotColor: 'bg-rose-400'
        };
      default:
        return {
          shortLabel: 'Franchise',
          icon: Layers,
          badgeColor: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
          dotColor: 'bg-purple-400'
        };
    }
  };

  const config = getCategoryConfig(universe.category);

  return (
    <div
      onClick={() => onSelect(universe)}
      className="group relative flex flex-col justify-between p-2 sm:p-2.5 rounded-lg bg-zinc-900/90 border border-zinc-800/90 hover:border-sky-500/50 hover:bg-zinc-850/90 transition-all duration-150 cursor-pointer shadow-xs min-w-0 h-full"
    >
      <div className="min-w-0">
        {/* Category Indicator with Dot / Badge */}
        <div className="flex items-center gap-1 mb-1">
          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold border ${config.badgeColor} max-w-full truncate`}>
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${config.dotColor}`} />
            <span className="truncate">{config.shortLabel}</span>
          </span>
        </div>

        {/* Universe / Franchise Name */}
        <h3 className="text-[11px] sm:text-xs font-bold text-zinc-100 group-hover:text-sky-400 transition-colors leading-tight line-clamp-2 mt-0.5">
          {universe.name}
        </h3>

        {/* Short 1-line description */}
        <p className="text-[9.5px] sm:text-[10px] text-zinc-400 line-clamp-1 mt-0.5 leading-snug">
          {universe.description}
        </p>
      </div>

      {/* Bottom Title Count & Action */}
      <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-zinc-800/80 min-w-0">
        <span className="text-[9.5px] sm:text-[10px] font-bold text-sky-400 font-mono truncate">
          {titlesCount} {titlesCount === 1 ? 'Title' : 'Titles'}
        </span>
        <div className="flex items-center gap-0.5 text-[9px] sm:text-[10px] font-medium text-zinc-400 group-hover:text-sky-400 transition-colors shrink-0">
          <span>Explore</span>
          <ArrowRight className="w-2.5 h-2.5 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </div>
  );
};
