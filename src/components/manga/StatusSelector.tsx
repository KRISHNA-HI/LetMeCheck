import React, { useState } from 'react';
import { Bookmark, Check, ChevronDown, Trash2 } from 'lucide-react';
import { ReadingStatus, Manga } from '../../types';
import { useLibrary } from '../../hooks/useLibrary';
import { getStatusColorClass } from '../../utils/formatters';

interface StatusSelectorProps {
  manga: Manga;
  className?: string;
  size?: 'sm' | 'md';
}

const ALL_STATUSES: ReadingStatus[] = ['Reading', 'Pending', 'Completed', 'On Hold', 'Dropped'];

export const StatusSelector: React.FC<StatusSelectorProps> = ({
  manga,
  className = '',
  size = 'md'
}) => {
  const { getEntryForManga, updateStatus, removeFromLibrary } = useLibrary();
  const [isOpen, setIsOpen] = useState(false);
  const entry = getEntryForManga(manga.id);
  const currentStatus = entry?.status;

  const handleSelect = async (status: ReadingStatus) => {
    setIsOpen(false);
    await updateStatus(manga, status);
  };

  const handleRemove = async () => {
    setIsOpen(false);
    await removeFromLibrary(manga.id);
  };

  const sizeClasses =
    size === 'sm' ? 'px-2.5 py-1 text-xs gap-1.5' : 'px-3 py-1.5 text-xs font-bold gap-2';

  return (
    <div className={`relative inline-block ${isOpen ? 'z-50' : 'z-20'} ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between rounded-lg font-semibold border transition-all cursor-pointer ${sizeClasses} ${
          currentStatus
            ? getStatusColorClass(currentStatus)
            : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border-zinc-800 hover:border-zinc-700'
        }`}
      >
        <div className="flex items-center gap-1.5 truncate">
          <Bookmark className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{currentStatus || '+ Library'}</span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/20"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute left-0 top-full mt-1.5 w-48 rounded-xl bg-[#141417] border border-zinc-700 shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 ring-1 ring-black/50">
            <div className="px-3 py-1.5 text-[10px] font-bold tracking-wider text-zinc-400 uppercase border-b border-zinc-800/80 mb-1">
              Select Status
            </div>
            {ALL_STATUSES.map((status) => {
              const isSelected = currentStatus === status;
              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => handleSelect(status)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-zinc-800 text-sky-400 font-bold'
                      : 'text-zinc-300 hover:bg-zinc-800/70 hover:text-zinc-100'
                  }`}
                >
                  <span>{status}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-sky-400" />}
                </button>
              );
            })}

            {currentStatus && (
              <>
                <div className="my-1 border-t border-zinc-800" />
                <button
                  type="button"
                  onClick={handleRemove}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-400 hover:bg-rose-500/10 transition-colors text-left cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove from Library</span>
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};
