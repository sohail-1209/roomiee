// ListingGrid — responsive grid of ListingCards with skeleton loading and empty state.
// Used on Home, Search, Saved, and Dashboard pages.
import React from 'react';
import ListingCard from './ListingCard';

/* ── Skeleton card (mirrors the ListingCard structure) ── */
const SkeletonCard = () => (
  <div className="card overflow-hidden flex flex-col">
    <div className="skeleton aspect-[4/3]" />
    <div className="p-4 flex flex-col gap-3">
      <div className="skeleton h-7 w-2/5 rounded-lg" />
      <div className="skeleton h-4 w-4/5 rounded-lg" />
      <div className="skeleton h-3 w-3/5 rounded-lg" />
      <div className="flex gap-3">
        <div className="skeleton h-3 w-14 rounded-lg" />
        <div className="skeleton h-3 w-14 rounded-lg" />
        <div className="skeleton h-3 w-14 rounded-lg" />
      </div>
      <hr className="border-surface-100" />
      <div className="flex items-center gap-2">
        <div className="skeleton w-7 h-7 rounded-full" />
        <div className="skeleton h-3 w-20 rounded-lg" />
      </div>
      <div className="skeleton h-9 w-full rounded-xl" />
    </div>
  </div>
);

/* ── Empty state ── */
const EmptyState = ({ message }) => (
  <div className="col-span-full flex flex-col items-center justify-center py-20 gap-4 text-center">
    <div className="w-20 h-20 rounded-full bg-surface-100 flex items-center justify-center text-4xl select-none">
      🏠
    </div>
    <div>
      <p className="font-semibold text-surface-700 text-lg">No listings found</p>
      <p className="text-surface-400 text-sm mt-1 max-w-xs">
        {message || 'Try adjusting your filters or search in a different area.'}
      </p>
    </div>
  </div>
);

/**
 * @param {object[]}  listings     - Array of listing objects
 * @param {boolean}   isLoading    - Show skeleton placeholders while true
 * @param {string}    emptyMessage - Custom message shown when listings is empty
 * @param {Set}       savedIds     - Set of saved listing IDs for the current user
 * @param {Function}  onSave       - Callback forwarded to each ListingCard
 */
const ListingGrid = ({
  listings = [],
  isLoading = false,
  emptyMessage,
  savedIds = new Set(),
  onSave,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {isLoading
        ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
        : listings.length === 0
          ? <EmptyState message={emptyMessage} />
          : listings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                isSaved={savedIds.has(listing.id)}
                onSave={onSave}
              />
            ))
      }
    </div>
  );
};

export default ListingGrid;
