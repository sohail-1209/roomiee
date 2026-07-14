// AmenityBadge — a small pill showing one amenity (icon + label).
// Used in both ListingCard and the listing detail page.
import React from 'react';

/**
 * @param {React.ReactNode} icon  - Lucide icon element (already sized, e.g. <Wifi size={13} />)
 * @param {string}          label - Human-readable amenity name
 */
const AmenityBadge = ({ icon, label }) => (
  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-surface-100 text-surface-600 border border-surface-200">
    {icon && (
      <span className="text-primary-500 flex-shrink-0">{icon}</span>
    )}
    {label}
  </span>
);

export default AmenityBadge;
