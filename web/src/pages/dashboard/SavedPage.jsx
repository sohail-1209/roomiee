// SavedPage — grid of saved listings for the current tenant
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Heart, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { savedAPI } from '../../services/endpoints';
import ListingGrid from '../../components/listing/ListingGrid';

// ── Empty state ────────────────────────────────────────────────────────────────
const EmptyState = ({ onSearch }) => (
  <div className="flex flex-col items-center justify-center py-24 gap-5 text-center">
    <div className="w-20 h-20 rounded-full bg-primary-50 flex items-center justify-center">
      <Heart size={36} className="text-primary-300" />
    </div>
    <div>
      <p className="font-semibold text-surface-700 text-lg">No saved listings yet</p>
      <p className="text-sm text-surface-400 mt-1 max-w-xs">
        Tap the heart icon on any listing to save it here for later.
      </p>
    </div>
    <button
      onClick={onSearch}
      className="btn-primary btn-md flex items-center gap-2"
    >
      <Search size={16} />
      Browse Listings
    </button>
  </div>
);

// ── Main component ─────────────────────────────────────────────────────────────
export default function SavedPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  // Fetch all saved listings
  const { data, isLoading, isError } = useQuery({
    queryKey: ['saved'],
    queryFn: () => savedAPI.getAll().then((r) => r.data.data),
    staleTime: 1000 * 60 * 2,
  });

  // Unsave mutation (optimistic removal)
  const { mutate: unsave } = useMutation({
    mutationFn: (listingId) => savedAPI.unsave(listingId),
    onMutate: async (listingId) => {
      await qc.cancelQueries({ queryKey: ['saved'] });
      const previous = qc.getQueryData(['saved']);
      qc.setQueryData(['saved'], (old) =>
        old ? old.filter((item) => (item.listing?.id ?? item.id) !== listingId) : old,
      );
      return { previous };
    },
    onError: (_err, _id, ctx) => {
      qc.setQueryData(['saved'], ctx.previous);
      toast.error('Failed to remove saved listing');
    },
    onSuccess: () => {
      toast.success('Removed from saved');
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['saved'] });
    },
  });

  // Normalise: the API may return { listing: {...} } objects or raw listing objects
  const rawItems = data ?? [];
  const listings = rawItems.map((item) => item.listing ?? item);
  const savedIds = new Set(listings.map((l) => l.id));

  const handleToggleSave = (listingId) => {
    // If already saved → unsave
    if (savedIds.has(listingId)) {
      unsave(listingId);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
          <Heart size={20} className="text-primary-600" />
        </div>
        <div>
          <h1 className="section-title">Saved Listings</h1>
          <p className="section-subtitle">
            {isLoading
              ? 'Loading your saved listings…'
              : `${listings.length} listing${listings.length !== 1 ? 's' : ''} saved`}
          </p>
        </div>
      </div>

      {/* ── Error state ─────────────────────────────────────────────────────── */}
      {isError && (
        <div className="card p-10 flex flex-col items-center gap-3 text-center">
          <span className="text-3xl">⚠️</span>
          <p className="font-semibold text-surface-700">Failed to load saved listings</p>
          <p className="text-sm text-surface-400">Please refresh the page and try again.</p>
        </div>
      )}

      {/* ── Grid or Empty state ──────────────────────────────────────────────── */}
      {!isError && (
        <>
          {!isLoading && listings.length === 0 ? (
            <EmptyState onSearch={() => navigate('/search')} />
          ) : (
            <ListingGrid
              listings={listings}
              isLoading={isLoading}
              savedIds={savedIds}
              onSave={handleToggleSave}
              emptyMessage="You haven't saved any listings yet."
            />
          )}
        </>
      )}

    </div>
  );
}
