// ImageGallery — main photo + thumbnail strip + arrow navigation + fullscreen lightbox.
// Props: photos → array of { url, id } objects.
import React, { useState, useCallback, useEffect } from 'react';
import {
  ChevronLeft, ChevronRight, X, Expand, ImageOff,
} from 'lucide-react';

const PLACEHOLDER = '/images/listing-placeholder.svg';

/**
 * @param {Array<{url: string, id: string|number}>} photos - Photo array
 */
const ImageGallery = ({ photos = [] }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const hasPhotos = photos.length > 0;
  const activePhoto = hasPhotos ? photos[activeIndex] : null;

  /* ── Navigation helpers ── */
  const prev = useCallback(() => {
    setActiveIndex((i) => (i === 0 ? photos.length - 1 : i - 1));
  }, [photos.length]);

  const next = useCallback(() => {
    setActiveIndex((i) => (i === photos.length - 1 ? 0 : i + 1));
  }, [photos.length]);

  const lightboxPrev = useCallback(() => {
    setLightboxIndex((i) => (i === 0 ? photos.length - 1 : i - 1));
  }, [photos.length]);

  const lightboxNext = useCallback(() => {
    setLightboxIndex((i) => (i === photos.length - 1 ? 0 : i + 1));
  }, [photos.length]);

  /* ── Keyboard support ── */
  useEffect(() => {
    if (!lightboxOpen) return;
    const handler = (e) => {
      if (e.key === 'ArrowLeft')  lightboxPrev();
      if (e.key === 'ArrowRight') lightboxNext();
      if (e.key === 'Escape')     setLightboxOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightboxOpen, lightboxPrev, lightboxNext]);

  /* ── Prevent body scroll when lightbox open ── */
  useEffect(() => {
    document.body.style.overflow = lightboxOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [lightboxOpen]);

  const openLightbox = (index) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  /* ── No photos state ── */
  if (!hasPhotos) {
    return (
      <div className="aspect-video bg-surface-100 rounded-2xl flex flex-col items-center justify-center gap-3 text-surface-400">
        <ImageOff size={48} strokeWidth={1.5} />
        <p className="text-sm font-medium">No photos available</p>
      </div>
    );
  }

  return (
    <>
      {/* ── Main gallery ── */}
      <div className="flex flex-col gap-3">

        {/* Primary large photo */}
        <div className="relative aspect-video overflow-hidden rounded-2xl bg-surface-100 group">
          <img
            key={activePhoto.id ?? activeIndex}
            src={activePhoto.url}
            alt={`Photo ${activeIndex + 1}`}
            className="w-full h-full object-cover transition-opacity duration-300"
            loading="lazy"
            onError={(e) => { e.currentTarget.src = PLACEHOLDER; }}
          />

          {/* Arrow nav (only if >1 photo) */}
          {photos.length > 1 && (
            <>
              <button
                type="button"
                onClick={prev}
                aria-label="Previous photo"
                className="
                  absolute left-3 top-1/2 -translate-y-1/2
                  w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm text-white
                  flex items-center justify-center
                  opacity-0 group-hover:opacity-100 transition-opacity duration-200
                  hover:bg-black/60
                "
              >
                <ChevronLeft size={20} />
              </button>
              <button
                type="button"
                onClick={next}
                aria-label="Next photo"
                className="
                  absolute right-3 top-1/2 -translate-y-1/2
                  w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm text-white
                  flex items-center justify-center
                  opacity-0 group-hover:opacity-100 transition-opacity duration-200
                  hover:bg-black/60
                "
              >
                <ChevronRight size={20} />
              </button>
            </>
          )}

          {/* Expand / lightbox button */}
          <button
            type="button"
            onClick={() => openLightbox(activeIndex)}
            aria-label="View fullscreen"
            className="
              absolute bottom-3 right-3
              w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm text-white
              flex items-center justify-center
              opacity-0 group-hover:opacity-100 transition-opacity duration-200
              hover:bg-black/60
            "
          >
            <Expand size={16} />
          </button>

          {/* Counter pill */}
          {photos.length > 1 && (
            <span className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full font-medium">
              {activeIndex + 1} / {photos.length}
            </span>
          )}
        </div>

        {/* Thumbnail strip (only when >1 photo) */}
        {photos.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {photos.map((photo, idx) => (
              <button
                key={photo.id ?? idx}
                type="button"
                onClick={() => setActiveIndex(idx)}
                className={`
                  flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all duration-200
                  ${idx === activeIndex
                    ? 'border-primary-500 ring-2 ring-primary-200 scale-[1.05]'
                    : 'border-transparent hover:border-primary-300 opacity-70 hover:opacity-100'
                  }
                `}
                aria-label={`View photo ${idx + 1}`}
              >
                <img
                  src={photo.url}
                  alt={`Thumbnail ${idx + 1}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => { e.currentTarget.src = PLACEHOLDER; }}
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Lightbox modal ── */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={() => setLightboxOpen(false)}
        >
          {/* Stop propagation so inner clicks don't close */}
          <div
            className="relative w-full max-w-5xl mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close */}
            <button
              type="button"
              onClick={() => setLightboxOpen(false)}
              aria-label="Close lightbox"
              className="absolute -top-12 right-0 text-white hover:text-surface-300 transition-colors"
            >
              <X size={28} />
            </button>

            {/* Main image */}
            <img
              key={lightboxIndex}
              src={photos[lightboxIndex].url}
              alt={`Full photo ${lightboxIndex + 1}`}
              className="w-full max-h-[80vh] object-contain rounded-xl"
              onError={(e) => { e.currentTarget.src = PLACEHOLDER; }}
            />

            {/* Arrows */}
            {photos.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={lightboxPrev}
                  aria-label="Previous"
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/25 transition-colors"
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  type="button"
                  onClick={lightboxNext}
                  aria-label="Next"
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/25 transition-colors"
                >
                  <ChevronRight size={24} />
                </button>
              </>
            )}

            {/* Counter */}
            <p className="text-center text-white/60 text-sm mt-3">
              {lightboxIndex + 1} of {photos.length}
            </p>

            {/* Thumbnail strip in lightbox */}
            {photos.length > 1 && (
              <div className="flex justify-center gap-2 mt-3 overflow-x-auto">
                {photos.map((photo, idx) => (
                  <button
                    key={photo.id ?? idx}
                    type="button"
                    onClick={() => setLightboxIndex(idx)}
                    className={`
                      flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition-all
                      ${idx === lightboxIndex ? 'border-primary-400 opacity-100' : 'border-white/20 opacity-50 hover:opacity-80'}
                    `}
                  >
                    <img
                      src={photo.url}
                      alt={`thumb ${idx + 1}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default ImageGallery;
