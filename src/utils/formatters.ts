import { ReadingStatus, MaterialType } from '../types';

export function calculateProgressPercentage(current: number, total: number | null | undefined): number {
  if (!total || total <= 0) return 0;
  const pct = (current / total) * 100;
  return Math.min(100, Math.max(0, Math.round(pct * 10) / 10));
}

export function formatCompactNumber(num?: number | null): string {
  if (num === null || num === undefined) return '0';
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1)}K`;
  }
  return num.toString();
}

export function getStatusColorClass(status: ReadingStatus | string): string {
  switch (status) {
    case 'Reading':
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    case 'Pending':
      return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    case 'Completed':
      return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
    case 'On Hold':
      return 'bg-orange-500/10 text-orange-400 border-orange-500/30';
    case 'Dropped':
      return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
    default:
      return 'bg-slate-800 text-slate-300 border-slate-700';
  }
}

export function getMaterialTypeBadgeClass(type: MaterialType | string): string {
  switch (type) {
    case 'Manga':
      return 'bg-sky-500/15 text-sky-400 border-sky-500/30';
    case 'Manhwa':
      return 'bg-purple-500/15 text-purple-400 border-purple-500/30';
    case 'Manhua':
      return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
    case 'Light Novel':
      return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    case 'Anime':
    case 'OVA':
    case 'Movie':
      return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    case 'Special':
    case 'One-shot':
      return 'bg-fuchsia-500/15 text-fuchsia-400 border-fuchsia-500/30';
    default:
      return 'bg-slate-800 text-slate-400 border-slate-700';
  }
}

export function truncateText(text: string, maxLength = 160): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}

export * from './titles';

