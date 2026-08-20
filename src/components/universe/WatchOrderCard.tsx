import React from 'react';
import { ListOrdered, Layers, ArrowRight, Play, CheckCircle2, Clock } from 'lucide-react';
import { Universe, WatchOrder } from '../../types/content';

interface WatchOrderCardProps {
  universe: Universe;
  watchOrder: WatchOrder;
  onSelect: (universe: Universe, watchOrder?: WatchOrder) => void;
}

export const WatchOrderCard: React.FC<WatchOrderCardProps> = ({
  universe,
  watchOrder,
  onSelect
}) => {
  const entries = watchOrder.ordered_entries || [];
  const previewEntries = entries.slice(0, 3);
  const remainingCount = Math.max(0, entries.length - 3);

  const getOrderBadge = (type: string) => {
    switch (type) {
      case 'chronological':
        return { label: 'Chronological Timeline', color: 'bg-amber-500/15 text-amber-400 border-amber-500/30' };
      case 'recommended':
        return { label: 'Recommended Guide', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' };
      case 'release_order':
      default:
        return { label: 'Release Order', color: 'bg-sky-500/15 text-sky-400 border-sky-500/30' };
    }
  };

  const badge = getOrderBadge(watchOrder.order_type);

  return (
    <div
      onClick={() => onSelect(universe, watchOrder)}
      className="group relative flex flex-col justify-between p-4 sm:p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 hover:border-sky-500/60 hover:bg-zinc-850/80 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-lg"
    >
      <div>
        {/* Header Badges */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md border ${badge.color}`}>
            {badge.label}
          </span>
          <span className="text-[11px] font-mono font-bold text-zinc-400">
            {entries.length} Titles
          </span>
        </div>

        {/* Universe Title & Order Name */}
        <h4 className="text-sm sm:text-base font-extrabold text-zinc-100 group-hover:text-sky-400 transition-colors">
          {universe.name}
        </h4>
        <div className="text-xs text-zinc-400 font-medium mt-0.5">
          {watchOrder.name || watchOrder.title}
        </div>

        {watchOrder.description && (
          <p className="text-[11px] text-zinc-400 mt-2 line-clamp-2 leading-relaxed">
            {watchOrder.description}
          </p>
        )}

        {/* Ordered Preview Rail */}
        <div className="mt-3.5 space-y-1.5 pt-3 border-t border-zinc-800/80">
          {previewEntries.map((entry) => (
            <div
              key={entry.position}
              className="flex items-center gap-2 text-xs py-1 px-2 rounded-lg bg-zinc-950/60 border border-zinc-850 text-zinc-300"
            >
              <span className="w-4 h-4 rounded-full bg-sky-500/20 text-sky-400 text-[10px] font-black flex items-center justify-center shrink-0">
                {entry.position}
              </span>
              <span className="font-medium truncate flex-1">{entry.title}</span>
              {entry.release_year && (
                <span className="text-[10px] text-zinc-400 font-mono shrink-0">
                  {entry.release_year}
                </span>
              )}
            </div>
          ))}

          {remainingCount > 0 && (
            <div className="text-[10px] text-zinc-400 font-semibold pl-2 pt-0.5">
              + {remainingCount} more in sequence...
            </div>
          )}
        </div>
      </div>

      {/* Footer CTA */}
      <div className="flex items-center justify-between pt-3.5 mt-3.5 border-t border-zinc-800/80">
        <div className="text-[11px] text-zinc-400 flex items-center gap-1.5">
          <ListOrdered className="w-3.5 h-3.5 text-sky-400" />
          <span>View Full Order</span>
        </div>
        <div className="w-6 h-6 rounded-full bg-zinc-800 group-hover:bg-sky-500 group-hover:text-zinc-950 text-zinc-300 flex items-center justify-center transition-colors">
          <ArrowRight className="w-3 h-3" />
        </div>
      </div>
    </div>
  );
};
