import React from 'react';

/**
 * Spinner component — beautiful dual-ring glowing animated loading indicator
 * @param {string} size - sm | md | lg
 * @param {string} className - additional Tailwind classes
 */

const Spinner = ({ size = 'md', className = '' }) => {
  const sizeStyle = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-10 h-10',
  }[size] || 'w-6 h-6';

  return (
    <span
      role="status"
      aria-label="Loading"
      className={`relative inline-flex items-center justify-center shrink-0 ${sizeStyle} ${className}`}
    >
      {/* Outer pulsing ring */}
      <span className="absolute inset-0 rounded-full border border-primary-500/35 animate-ping opacity-60" />
      {/* Inner spinning gradient ring */}
      <span className="w-full h-full rounded-full border-2 border-primary-500 border-t-transparent border-r-transparent animate-spin" />
      {/* Center glowing dot */}
      <span className="absolute w-[28%] h-[28%] rounded-full bg-primary-600 shadow-sm shadow-primary-500/50" />
    </span>
  );
};

export default Spinner;
