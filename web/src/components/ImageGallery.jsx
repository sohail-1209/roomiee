// ImageGallery — reusable photo gallery with prev/next navigation + thumbnail strip
import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const ImageGallery = ({ photos = [], title = '' }) => {
  const [active, setActive] = useState(0);
  const total = photos.length;

  const prev = () => setActive((i) => (i === 0 ? total - 1 : i - 1));
  const next = () => setActive((i) => (i === total - 1 ? 0 : i + 1));

  if (total === 0) {
    return (
      <div className="rounded-2xl overflow-hidden h-72 sm:h-[420px] bg-surface-100 flex items-center justify-center text-surface-400 mb-8">
        <div className="text-center">
          <p className="text-4xl mb-2">📷</p>
          <p className="text-sm font-medium">No photos yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl overflow-hidden mb-8 relative group">
      {/* Main image area */}
      <div className="relative h-72 sm:h-[420px]">
        <img
          src={photos[active]?.url}
          alt={title}
          className="w-full h-full object-contain bg-surface-50 transition-opacity duration-200"
        />

        {/* Prev / Next arrows */}
        {total > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 backdrop-blur-sm"
              aria-label="Previous photo"
            >
              <ChevronLeft size={22} />
            </button>
            <button
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 backdrop-blur-sm"
              aria-label="Next photo"
            >
              <ChevronRight size={22} />
            </button>
          </>
        )}

        {/* Photo counter badge */}
        {total > 1 && (
          <div className="absolute bottom-3 right-3 bg-black/50 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1 rounded-full">
            {active + 1} / {total}
          </div>
        )}
      </div>

      {/* Thumbnail strip */}
      {total > 1 && (
        <div className="flex gap-1.5 p-2 bg-surface-900">
          {photos.map((p, i) => (
            <button
              key={p.id || i}
              onClick={() => setActive(i)}
              className={`flex-1 h-16 sm:h-20 rounded-lg overflow-hidden transition-all flex-shrink-0 ${
                active === i
                  ? 'ring-2 ring-primary-500 ring-offset-1 ring-offset-surface-900'
                  : 'opacity-60 hover:opacity-90'
              }`}
            >
              <img src={p.url} alt="" className="w-full h-full object-contain bg-surface-100" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageGallery;
