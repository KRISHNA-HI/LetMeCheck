import React, { useState, useRef, useEffect } from 'react';
import { Bookmark, Check, ChevronDown, Trash2 } from 'lucide-react';
import { ReadingStatus, Manga } from '../../types';
import { useLibrary } from '../../hooks/useLibrary';
import { getStatusColorClass, getPresentationStatus, getStatusOptions } from '../../utils/formatters';

interface StatusSelectorProps {
  manga: Manga;
  className?: string;
  size?: 'sm' | 'md';
  align?: 'left' | 'right';
  dropdownPosition?: 'top' | 'bottom' | 'auto';
}

export const StatusSelector: React.FC<StatusSelectorProps> = ({
  manga,
  className = '',
  size = 'md',
  align = 'left',
  dropdownPosition = 'bottom'
}) => {
  const { getEntryForManga, updateStatus, removeFromLibrary } = useLibrary();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const entry = getEntryForManga(manga);
  const currentStatus = entry?.status;
  const presentationStatus = getPresentationStatus(currentStatus, manga.type);
  const statusOptions = getStatusOptions(manga.type);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = async (e: React.MouseEvent, status: ReadingStatus) => {
    e.stopPropagation();
    setIsOpen(false);
    await updateStatus(manga, status);
  };

  const handleRemove = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(false);
    await removeFromLibrary(manga.id);
  };

  const sizeClasses =
    size === 'sm' ? 'px-2.5 py-1 text-xs gap-1.5' : 'px-3 py-1.5 text-xs font-bold gap-2';

  const positionClasses =
    dropdownPosition === 'top'
      ? 'bottom-full mb-2'
      : 'top-full mt-1.5';

  return (
    <div ref={containerRef} className={`relative inline-block ${isOpen ? 'z-50' : 'z-20'} ${className}`}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        className={`flex items-center justify-between rounded-lg font-semibold border transition-all cursor-pointer ${sizeClasses} ${
          currentStatus
            ? getStatusColorClass(presentationStatus)
            : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border-zinc-800 hover:border-zinc-700'
        }`}
      >
        <div className="flex items-center gap-1.5 truncate">
          <Bookmark className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{presentationStatus || '+ Library'}</span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          className={`absolute ${
            align === 'right' ? 'right-0' : 'left-0'
          } ${positionClasses} w-48 max-w-[calc(100vw-2rem)] rounded-xl bg-zinc-900 border border-zinc-700 shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 ring-1 ring-black/50`}
        >
          <div className="px-3 py-1.5 text-[10px] font-bold tracking-wider text-zinc-400 uppercase border-b border-zinc-800/80 mb-1">
            Select Status
          </div>
          {statusOptions.map((opt) => {
            const isSelected = currentStatus === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={(e) => handleSelect(e, opt.value)}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-zinc-800 text-sky-400 font-bold'
                    : 'text-zinc-300 hover:bg-zinc-800/70 hover:text-zinc-100'
                }`}
              >
                <span>{opt.label}</span>
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
      )}
    </div>
  );
};
