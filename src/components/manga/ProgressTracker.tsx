import React, { useState, useEffect } from 'react';
import { Plus, Minus, Check, Sparkles, BookOpen, Tv, Film } from 'lucide-react';
import { Manga } from '../../types';
import { useLibrary } from '../../hooks/useLibrary';
import { ProgressBar } from '../common/ProgressBar';
import {
  calculateProgressPercentage,
  getPresentationStatus,
  getStatusColorClass,
  isReadingMedia
} from '../../utils/formatters';

interface ProgressTrackerProps {
  manga: Manga;
}

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({ manga }) => {
  const { getProgressForManga, updateChapterProgress, getEntryForManga } = useLibrary();

  const progress = getProgressForManga(manga);
  const entry = getEntryForManga(manga);

  const [chapters, setChapters] = useState<number>(progress?.chapters_read || 0);
  const [volumes, setVolumes] = useState<number>(progress?.volumes_read || 0);

  useEffect(() => {
    if (progress) {
      setChapters(progress.chapters_read || 0);
      setVolumes(progress.volumes_read || 0);
    }
  }, [progress]);

  const handleChapterChange = async (val: number) => {
    const nextVal = Math.max(0, val);
    setChapters(nextVal);
    await updateChapterProgress(manga, nextVal, volumes);
  };

  const handleVolumeChange = async (val: number) => {
    const nextVal = Math.max(0, val);
    setVolumes(nextVal);
    await updateChapterProgress(manga, chapters, nextVal);
  };

  const isReading = isReadingMedia(manga.type);
  const maxChapters = manga.chapters || null;
  const maxVolumes = manga.volumes || null;

  const chapterPercentage = calculateProgressPercentage(chapters, maxChapters);
  const presentationStatus = entry ? getPresentationStatus(entry.status, manga.type) : '';

  const HeaderIcon = isReading ? BookOpen : manga.type === 'Movie' ? Film : Tv;
  const titleText = isReading ? 'Reading Progress' : 'Watch Progress';
  const subtitleText = isReading
    ? 'Keep track of your current chapters & volumes'
    : 'Keep track of your current episodes & seasons';
  const primaryUnitLabel = isReading ? 'Chapter' : 'Episode';
  const primaryControlLabel = isReading ? 'Chapters Read' : 'Episodes Watched';
  const secondaryControlLabel = isReading ? 'Volumes Read' : 'Seasons Watched';

  return (
    <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 sm:p-6 flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center border border-sky-500/20">
            <HeaderIcon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-zinc-100">{titleText}</h3>
            <p className="text-xs text-zinc-400">{subtitleText}</p>
          </div>
        </div>

        {entry && (
          <span
            className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border ${getStatusColorClass(
              presentationStatus
            )}`}
          >
            {presentationStatus}
          </span>
        )}
      </div>

      {/* Progress Visual Bar */}
      <ProgressBar
        current={chapters}
        total={maxChapters}
        percentage={chapterPercentage}
        size="md"
        unitLabel={primaryUnitLabel}
      />

      {/* Controls Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
        {/* Primary Control */}
        <div className="flex flex-col gap-2 p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800">
          <div className="flex items-center justify-between text-xs text-zinc-300 font-medium">
            <span>{primaryControlLabel}</span>
            <span className="text-zinc-400 font-mono">Total: {maxChapters || 'Ongoing'}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleChapterChange(chapters - 1)}
              disabled={chapters <= 0}
              className="p-2 rounded-lg bg-zinc-900 text-zinc-300 hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer border border-zinc-800"
              aria-label={`Decrease ${primaryUnitLabel.toLowerCase()}`}
            >
              <Minus className="w-4 h-4" />
            </button>

            <input
              type="number"
              min="0"
              max={maxChapters || 9999}
              value={chapters}
              onChange={(e) => handleChapterChange(parseInt(e.target.value, 10) || 0)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg py-1.5 px-3 text-center text-sm font-bold text-zinc-100 focus:outline-hidden focus:border-sky-500"
            />

            <button
              type="button"
              onClick={() => handleChapterChange(chapters + 1)}
              className="p-2 rounded-lg bg-sky-500 text-black hover:bg-sky-400 font-bold transition-colors shadow-xs cursor-pointer"
              aria-label={`Increase ${primaryUnitLabel.toLowerCase()}`}
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Secondary (Volume/Season) Control */}
        <div className="flex flex-col gap-2 p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800">
          <div className="flex items-center justify-between text-xs text-zinc-300 font-medium">
            <span>{secondaryControlLabel}</span>
            <span className="text-zinc-400 font-mono">Total: {maxVolumes || 'Ongoing'}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleVolumeChange(volumes - 1)}
              disabled={volumes <= 0}
              className="p-2 rounded-lg bg-zinc-900 text-zinc-300 hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer border border-zinc-800"
              aria-label={`Decrease ${secondaryControlLabel.toLowerCase()}`}
            >
              <Minus className="w-4 h-4" />
            </button>

            <input
              type="number"
              min="0"
              max={maxVolumes || 999}
              value={volumes}
              onChange={(e) => handleVolumeChange(parseInt(e.target.value, 10) || 0)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg py-1.5 px-3 text-center text-sm font-bold text-zinc-100 focus:outline-hidden focus:border-sky-500"
            />

            <button
              type="button"
              onClick={() => handleVolumeChange(volumes + 1)}
              className="p-2 rounded-lg bg-zinc-800 text-zinc-200 hover:bg-zinc-700 transition-colors cursor-pointer border border-zinc-700"
              aria-label={`Increase ${secondaryControlLabel.toLowerCase()}`}
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
