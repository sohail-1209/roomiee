import React from 'react';

/**
 * Spinner component — animated loading indicator
 * @param {string} size - sm | md | lg
 * @param {string} className - additional Tailwind classes
 */

const sizeClasses = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-8 w-8 border-[3px]',
};

const Spinner = ({ size = 'md', className = '' }) => {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={[
        'inline-block rounded-full border-current border-t-transparent animate-spin',
        sizeClasses[size] ?? sizeClasses.md,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    />
  );
};

export default Spinner;
