import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'rectangular' | 'circular' | 'card';
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', variant = 'rectangular' }) => {
  if (variant === 'circular') {
    return <div className={`animate-pulse rounded-full bg-zinc-800/80 ${className}`} />;
  }

  if (variant === 'card') {
    return (
      <div className="flex flex-col rounded-xl overflow-hidden bg-zinc-900/60 border border-zinc-800 animate-pulse p-2.5">
        <div className="w-full aspect-[2/3] bg-zinc-800/70 rounded-lg mb-2.5" />
        <div className="h-3.5 bg-zinc-800 rounded w-3/4 mb-1.5" />
        <div className="h-2.5 bg-zinc-800/60 rounded w-1/2 mb-2" />
        <div className="flex gap-1.5 mt-auto">
          <div className="h-4 bg-zinc-800 rounded w-12" />
          <div className="h-4 bg-zinc-800 rounded w-10" />
        </div>
      </div>
    );
  }

  return <div className={`animate-pulse rounded-md bg-zinc-800/80 ${className}`} />;
};
