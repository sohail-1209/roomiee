import React from 'react';
import { Star } from 'lucide-react';

/**
 * StarRating component — read-only and interactive modes
 * @param {number} value - current rating value (0–5)
 * @param {function} onChange - if provided, makes the rating interactive
 * @param {number} size - pixel size of each star icon (default 20)
 * @param {string} className - additional Tailwind classes
 */

const StarRating = ({ value = 0, onChange, size = 20, className = '' }) => {
  const isInteractive = typeof onChange === 'function';
  const [hovered, setHovered] = React.useState(null);

  const displayValue = hovered !== null ? hovered : value;

  return (
    <div
      className={`inline-flex items-center gap-0.5 ${className}`}
      role={isInteractive ? 'radiogroup' : 'img'}
      aria-label={`Rating: ${value} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= displayValue;
        return (
          <button
            key={star}
            type="button"
            disabled={!isInteractive}
            aria-label={`${star} star${star !== 1 ? 's' : ''}`}
            onClick={() => isInteractive && onChange(star)}
            onMouseEnter={() => isInteractive && setHovered(star)}
            onMouseLeave={() => isInteractive && setHovered(null)}
            className={[
              'transition-colors focus:outline-none',
              isInteractive
                ? 'cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-400 rounded'
                : 'cursor-default pointer-events-none',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            <Star
              size={size}
              className={
                filled
                  ? 'fill-amber-400 text-amber-400'
                  : 'fill-gray-200 text-gray-200'
              }
            />
          </button>
        );
      })}
    </div>
  );
};

export default StarRating;
