import React, { useState } from 'react';

/**
 * Avatar component — shows profile image or initials fallback
 * @param {string} src - image URL
 * @param {string} name - user name used for initials fallback
 * @param {string} size - sm | md | lg | xl
 * @param {string} className - additional Tailwind classes
 */

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-base',
  xl: 'h-20 w-20 text-xl',
};

/** Derive up to 2 initials from a display name */
const getInitials = (name = '') => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return '?';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

/**
 * Deterministic background color based on name so the same user always gets
 * the same avatar color.
 */
const BG_COLORS = [
  'bg-violet-500',
  'bg-indigo-500',
  'bg-blue-500',
  'bg-cyan-500',
  'bg-teal-500',
  'bg-green-500',
  'bg-amber-500',
  'bg-orange-500',
  'bg-rose-500',
  'bg-pink-500',
];

const getColorClass = (name = '') => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return BG_COLORS[Math.abs(hash) % BG_COLORS.length];
};

const Avatar = ({ src, name = '', size = 'md', className = '' }) => {
  const [imgError, setImgError] = useState(false);
  const showImage = src && !imgError;
  const initials = getInitials(name);
  const bgColor = getColorClass(name);

  return (
    <span
      className={[
        'inline-flex items-center justify-center rounded-full overflow-hidden shrink-0 font-semibold select-none',
        sizeClasses[size] ?? sizeClasses.md,
        !showImage ? `${bgColor} text-white` : 'bg-gray-100',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      aria-label={name || 'Avatar'}
    >
      {showImage ? (
        <img
          src={src}
          alt={name}
          className="h-full w-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <span aria-hidden="true">{initials}</span>
      )}
    </span>
  );
};

export default Avatar;
