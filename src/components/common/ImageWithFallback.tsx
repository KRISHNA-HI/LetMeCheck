import React, { useState, useEffect } from 'react';

// Global cache to track successfully loaded images across component remounts
const loadedImagesCache = new Set<string>();

interface ImageWithFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallbackSrc?: string;
  aspectRatio?: string;
  className?: string;
  priority?: boolean;
}

export const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
  src,
  alt,
  fallbackSrc = '/placeholder-cover.svg',
  aspectRatio = 'aspect-[2/3]',
  className = '',
  priority = false,
  ...props
}) => {
  const targetSrc = src || fallbackSrc;
  const isAlreadyLoaded = loadedImagesCache.has(targetSrc);

  const [imgSrc, setImgSrc] = useState<string>(targetSrc);
  const [loading, setLoading] = useState<boolean>(!isAlreadyLoaded);
  const [error, setError] = useState<boolean>(false);

  // Sync if src prop changes
  useEffect(() => {
    const nextSrc = src || fallbackSrc;
    setImgSrc(nextSrc);
    setError(false);
    if (loadedImagesCache.has(nextSrc)) {
      setLoading(false);
    } else {
      setLoading(true);
    }
  }, [src, fallbackSrc]);

  return (
    <div className={`relative overflow-hidden bg-zinc-900 ${aspectRatio} ${className}`}>
      {loading && !error && (
        <div className="absolute inset-0 bg-gradient-to-tr from-zinc-900 via-zinc-800 to-zinc-900 animate-pulse flex items-center justify-center">
          <div className="w-6 h-6 rounded-full border border-zinc-700/60 border-t-sky-400 animate-spin opacity-50" />
        </div>
      )}
      <img
        src={error ? fallbackSrc : imgSrc}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={priority ? 'high' : 'auto'}
        referrerPolicy="no-referrer"
        onLoad={() => {
          if (targetSrc) {
            loadedImagesCache.add(targetSrc);
          }
          setLoading(false);
        }}
        onError={() => {
          setError(true);
          setLoading(false);
          setImgSrc(fallbackSrc);
        }}
        className={`w-full h-full object-cover transition-opacity duration-200 ${
          loading ? 'opacity-0' : 'opacity-100'
        }`}
        {...props}
      />
    </div>
  );
};
