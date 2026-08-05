import { useState, useEffect, useRef } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  lazy?: boolean;
}

export function OptimizedImage({ src, alt, width, height, className = '', lazy = true }: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!lazy) {
      setIsVisible(true);
      return;
    }

    const node = imgRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '200px' }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [lazy]);

  // Generate WebP/AVIF URLs via Supabase transformation or use a CDN
  // For Supabase storage: append ?format=webp
  const optimizedSrc = src.includes('supabase.co') ? `${src}?format=webp` : src;

  return (
    <div ref={imgRef} className={`relative overflow-hidden ${className}`} style={{ width, height }}>
      {isVisible && (
        <img
          src={optimizedSrc}
          alt={alt}
          width={width}
          height={height}
          loading={lazy ? 'lazy' : 'eager'}
          onLoad={() => setIsLoaded(true)}
          className={`h-full w-full object-cover transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}
      {!isLoaded && isVisible && (
        <div className="absolute inset-0 animate-pulse bg-gray-200 dark:bg-gray-800" />
      )}
    </div>
  );
}
