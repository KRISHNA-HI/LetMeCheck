import React from 'react';

interface ProgressBarProps {
  current: number;
  total?: number | null;
  percentage?: number;
  showLabels?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  unitLabel?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  current,
  total,
  percentage,
  showLabels = true,
  size = 'md',
  className = '',
  unitLabel = 'Ch.'
}) => {
  const calculatedPct =
    percentage !== undefined
      ? percentage
      : total && total > 0
      ? Math.min(100, Math.max(0, Math.round((current / total) * 1000) / 10))
      : 0;

  const heightClasses = {
    sm: 'h-1',
    md: 'h-1.5',
    lg: 'h-2.5'
  }[size];

  return (
    <div className={`w-full flex flex-col gap-1 ${className}`}>
      {showLabels && (
        <div className="flex items-center justify-between text-[11px] text-zinc-400 font-medium">
          <span>
            {unitLabel} {current}
            {total ? ` / ${total}` : ' / Ongoing'}
          </span>
          {total ? <span className="font-bold text-zinc-300 font-mono">{calculatedPct}%</span> : null}
        </div>
      )}
      <div className={`w-full bg-zinc-800 rounded-full overflow-hidden ${heightClasses}`}>
        <div
          className="h-full bg-sky-500 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${total ? calculatedPct : current > 0 ? 100 : 0}%` }}
        />
      </div>
    </div>
  );
};
