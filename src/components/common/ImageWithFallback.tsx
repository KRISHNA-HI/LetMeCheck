import React, { useState, useEffect, useRef, useCallback } from 'react';

// Global cache to track successfully loaded images across component mounts/remounts
const loadedImagesCache = new Set<string>();

// Permanent failures cache (only after exhausting all retries for a valid URL)
const failedImagesCache = new Set<string>();

interface ImageWithFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string | null;
  alt: string;
  fallbackSrc?: string;
  aspectRatio?: string;
  className?: string;
  priority?: boolean;
}

const MAX_IMAGE_RETRIES = 3;

export const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
  src,
  alt,
  fallbackSrc = '/placeholder-cover.svg',
  aspectRatio = 'aspect-[2/3]',
  className = '',
  priority = false,
  ...props
}) => {
  // Determine if this is a genuinely missing cover
  const isGenuinelyEmpty = !src || src.trim() === '' || src === fallbackSrc;
  const initialTargetSrc = isGenuinelyEmpty ? fallbackSrc : src.trim();
  const isAlreadyLoaded = !isGenuinelyEmpty && loadedImagesCache.has(initialTargetSrc);
  const isPermanentlyFailed = !isGenuinelyEmpty && failedImagesCache.has(initialTargetSrc);

  const [currentSrc, setCurrentSrc] = useState<string>(
    isPermanentlyFailed || isGenuinelyEmpty ? fallbackSrc : initialTargetSrc
  );
  const [status, setStatus] = useState<'loading' | 'loaded' | 'retrying' | 'error'>(() => {
    if (isGenuinelyEmpty || isPermanentlyFailed) return 'error';
    if (isAlreadyLoaded) return 'loaded';
    return 'loading';
  });
  const [retryCount, setRetryCount] = useState<number>(0);
  const lastSuccessSrcRef = useRef<string | null>(isAlreadyLoaded ? initialTargetSrc : null);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef<boolean>(true);

  // Clear pending timers on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  // Handle source changes from parent
  useEffect(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }

    if (!src || src.trim() === '' || src === fallbackSrc) {
      setCurrentSrc(fallbackSrc);
      setStatus('error');
      setRetryCount(0);
      return;
    }

    const cleanSrc = src.trim();
    if (loadedImagesCache.has(cleanSrc)) {
      setCurrentSrc(cleanSrc);
      setStatus('loaded');
      lastSuccessSrcRef.current = cleanSrc;
      setRetryCount(0);
      return;
    }

    if (failedImagesCache.has(cleanSrc)) {
      setCurrentSrc(fallbackSrc);
      setStatus('error');
      setRetryCount(MAX_IMAGE_RETRIES);
      return;
    }

    setCurrentSrc(cleanSrc);
    setStatus('loading');
    setRetryCount(0);
  }, [src, fallbackSrc]);

  // Handle online reconnect: retry any failed or retrying images
  useEffect(() => {
    const handleOnline = () => {
      if (src && !isGenuinelyEmpty && (status === 'error' || status === 'retrying')) {
        failedImagesCache.delete(src.trim());
        setRetryCount(0);
        setCurrentSrc(src.trim());
        setStatus('loading');
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [src, isGenuinelyEmpty, status]);

  const handleImageLoad = useCallback(() => {
    if (!isMountedRef.current) return;
    const cleanSrc = src ? src.trim() : null;
    if (cleanSrc && cleanSrc !== fallbackSrc) {
      loadedImagesCache.add(cleanSrc);
      failedImagesCache.delete(cleanSrc);
      lastSuccessSrcRef.current = cleanSrc;
    }
    setStatus('loaded');
    setRetryCount(0);
  }, [src, fallbackSrc]);

  const handleImageError = useCallback(() => {
    if (!isMountedRef.current) return;

    // If genuinely empty or fallback URL itself failed, show error directly
    if (isGenuinelyEmpty) {
      setStatus('error');
      setCurrentSrc(fallbackSrc);
      return;
    }

    const cleanSrc = src ? src.trim() : '';

    // If we haven't exhausted retry attempts, schedule intelligent retry
    if (retryCount < MAX_IMAGE_RETRIES) {
      const nextRetry = retryCount + 1;
      setStatus('retrying');

      // Exponential backoff: ~800ms, ~1800ms, ~3500ms + random jitter
      const delay = Math.min(800 * Math.pow(1.5, retryCount), 4000) + Math.random() * 200;

      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }

      retryTimeoutRef.current = setTimeout(() => {
        if (!isMountedRef.current) return;
        setRetryCount(nextRetry);
        setStatus('loading');
        // Force fresh load on retry without ever passing an empty string
        const separator = cleanSrc.includes('?') ? '&' : '?';
        setCurrentSrc(`${cleanSrc}${separator}_retry=${nextRetry}`);
      }, delay);
    } else {
      // Retries exhausted: mark as permanent failure for this session
      if (cleanSrc) {
        failedImagesCache.add(cleanSrc);
      }
      setStatus('error');
      setCurrentSrc(fallbackSrc);
    }
  }, [src, isGenuinelyEmpty, retryCount, fallbackSrc]);

  const isLoadingOrRetrying = status === 'loading' || status === 'retrying';
  const isGenuineError = status === 'error';
  const effectiveFallback = fallbackSrc && fallbackSrc.trim() !== '' ? fallbackSrc.trim() : '/placeholder-cover.svg';
  const effectiveSrc = isGenuineError || !currentSrc || currentSrc.trim() === ''
    ? effectiveFallback
    : currentSrc.trim();

  return (
    <div className={`relative overflow-hidden bg-zinc-900 ${aspectRatio} ${className}`}>
      {/* Loading Skeleton / Shimmer Overlay */}
      {isLoadingOrRetrying && (
        <div className="absolute inset-0 z-1 bg-gradient-to-tr from-zinc-900 via-zinc-800 to-zinc-900 animate-pulse flex items-center justify-center pointer-events-none">
          <div className="w-5 h-5 rounded-full border border-zinc-700/60 border-t-sky-400 animate-spin opacity-50" />
        </div>
      )}

      {/* Main Image */}
      <img
        src={effectiveSrc}
        alt={alt || 'Image'}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={priority ? 'high' : 'auto'}
        referrerPolicy="no-referrer"
        onLoad={handleImageLoad}
        onError={handleImageError}
        className={`w-full h-full object-cover transition-opacity duration-200 ${
          isLoadingOrRetrying && !lastSuccessSrcRef.current ? 'opacity-0' : 'opacity-100'
        }`}
        {...props}
      />
    </div>
  );
};
