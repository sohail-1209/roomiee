// My Listings page — owner's listing management
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus, Eye, Edit, Trash2, MapPin, Camera, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { listingsAPI } from '../../services/endpoints';
import { formatRent, getPrimaryPhoto, formatNumber } from '../../utils/helpers';
import PageHeader from '../../components/layout/PageHeader';
import { EmptyState } from '../../components/ui';

const STATUS_OPTIONS = [
  { value: 'ACTIVE', labelKey: 'active', color: 'bg-success-50 text-success-600 border-success-200', activeColor: 'bg-success-500 text-white border-success-500', dot: 'bg-success-500' },
  { value: 'PAUSED', labelKey: 'inactive', color: 'bg-amber-50 text-amber-600 border-amber-200', activeColor: 'bg-amber-500 text-white border-amber-500', dot: 'bg-amber-500' },
  { value: 'RENTED', labelKey: 'booked', color: 'bg-primary-50 text-primary-600 border-primary-200', activeColor: 'bg-primary-500 text-white border-primary-500', dot: 'bg-primary-500' },
];

const STATUS_BADGE = {
  ACTIVE: 'bg-emerald-50 text-emerald-600 border border-emerald-200',
  PAUSED: 'bg-amber-50 text-amber-600 border border-amber-200',
  RENTED: 'bg-primary-50 text-primary-600 border border-primary-200',
};

const getDetailPath = (listing) => {
  if (listing.type === 'HOSTEL') return `/hostel/${listing.id}`;
  if (listing.type === 'ROOM_SHARING') return `/room/${listing.id}`;
  if (listing.type === 'LAND_SALE') return `/land/${listing.id}`;
  return `/listing/${listing.id}`;
};

const MyListingsPage = () => {
  const qc = useQueryClient();
  const { t } = useTranslation();
  const { data: listings, isLoading } = useQuery({
    queryKey: ['myListings'],
    queryFn: () => listingsAPI.getMyListings().then((r) => r.data.data),
    select: (data) => data?.map((l) => ({
      ...l,
      _minHostelPrice: l.type === 'HOSTEL' && l.hostelSharing?.tiers?.length > 0
        ? Math.min(...l.hostelSharing.tiers.map((t) => t.price))
        : 0,
    })),
  });

  const { mutate: deleteListing } = useMutation({
    mutationFn: (id) => listingsAPI.delete(id),
    onSuccess: () => { toast.success('Listing deleted'); qc.invalidateQueries({ queryKey: ['myListings'] }); },
    onError: () => toast.error('Failed to delete'),
  });

  const { mutate: updateStatus } = useMutation({
    mutationFn: ({ id, status }) => listingsAPI.updateStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['myListings'] });
      qc.invalidateQueries({ queryKey: ['listings'] });
      toast.success('Status updated');
    },
    onError: () => toast.error('Failed to update status'),
  });

  return (
    <>
      <PageHeader
        title={t('myListings')}
        subtitle={`${listings?.length || 0} total listing`}
        action={
          <Link to="/dashboard/listings/new" className="btn-primary btn-md px-4 py-2.5 text-sm rounded-xl inline-flex items-center gap-2">
            <Plus size={16} /> {t('addListing')}
          </Link>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mt-5 sm:mt-6">
          {[1,2,3,4].map((i) => <div key={i} className="skeleton h-48 rounded-2xl" />)}
        </div>
      ) : !listings?.length ? (
        <EmptyState
          icon={<span className="text-4xl">🏠</span>}
          title={t('noListings')}
          description={t('createFirst')}
          action={<Link to="/dashboard/listings/new" className="btn-primary btn-md px-5 py-2.5 rounded-xl inline-flex items-center gap-2 mt-4"><Plus size={16} /> {t('addListing')}</Link>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mt-5 sm:mt-6">
          {listings.map((listing) => {
            const photo = getPrimaryPhoto(listing);
            const statusLabel = listing.status === 'ACTIVE' ? t('active') : listing.status === 'RENTED' ? (listing.type === 'HOSTEL' ? t('fullyBooked') : t('booked')) : t('inactive');
            return (
              <div key={listing.id} className="card overflow-hidden">
                {/* Top: Image + Info */}
                <div className="flex gap-3 p-4">
                  <div className="relative flex-shrink-0">
                    <img
                      src={photo || 'https://placehold.co/120x120?text=No+Photo'}
                      alt={listing.title}
                      className="w-28 h-28 rounded-xl object-cover"
                    />
                    {listing.photos?.length > 0 && (
                      <span className="absolute bottom-1.5 left-1.5 flex items-center gap-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded-md backdrop-blur-sm">
                        <Camera size={10} /> {listing.photos.length} Photos
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-semibold text-surface-900 text-sm line-clamp-1">{listing.title}</h3>
                      <span className={`flex-shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full ${STATUS_BADGE[listing.status] || STATUS_BADGE.ACTIVE}`}>
                        <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${
                          listing.status === 'ACTIVE' ? 'bg-emerald-500' : listing.status === 'RENTED' ? 'bg-primary-500' : 'bg-amber-500'
                        }`} />
                        {statusLabel}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-surface-400 mb-2">
                      <MapPin size={11} className="flex-shrink-0" /> <span className="truncate">{listing.city}</span>
                    </div>
                    <p className="text-sm font-semibold text-surface-900 mb-2">{listing.type === 'HOSTEL' && listing._minHostelPrice > 0 ? `From ${formatRent(listing._minHostelPrice)}` : formatRent(listing.rent)} <span className="text-xs font-normal text-surface-400">/ mo</span></p>
                    {/* Views & Requests */}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 bg-surface-50 border border-surface-200 rounded-lg px-2.5 py-1.5">
                        <Eye size={13} className="text-surface-500" />
                        <span className="text-xs font-semibold text-surface-700">{formatNumber(listing.views)}</span>
                        <span className="text-[10px] text-surface-400">{t('views')}</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-surface-50 border border-surface-200 rounded-lg px-2.5 py-1.5">
                        <Users size={13} className="text-surface-500" />
                        <span className="text-xs font-semibold text-surface-700">{listing._count?.requests || 0}</span>
                        <span className="text-[10px] text-surface-400">{t('requests')}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status toggle */}
                <div className="px-4 pb-3">
                  <p className="text-[10px] font-medium text-surface-400 uppercase tracking-wider mb-2">{t('status')}</p>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {STATUS_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => updateStatus({ id: listing.id, status: opt.value })}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 ${
                          listing.status === opt.value
                            ? `${opt.activeColor} shadow-sm`
                            : `${opt.color} hover:opacity-80`
                        }`}
                      >
                        <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${
                          listing.status === opt.value ? 'bg-white' : opt.dot
                        }`} />
                        {t(opt.labelKey)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 px-4 pb-3 pt-1 border-t border-surface-100">
                  <Link to={getDetailPath(listing)} className="btn btn-sm btn-ghost text-xs px-3 py-2 rounded-lg min-h-[38px] flex-1 justify-center">
                    <Eye size={14} /> {t('view')}
                  </Link>
                  <Link to={`/dashboard/listings/${listing.id}/edit`} className="btn btn-sm btn-secondary text-xs px-3 py-2 rounded-lg min-h-[38px] flex-1 justify-center">
                    <Edit size={14} /> {t('edit')}
                  </Link>
                  <button
                    onClick={() => { if (confirm('Delete this listing?')) deleteListing(listing.id); }}
                    className="btn btn-sm text-xs px-3 py-2 rounded-lg text-danger-500 hover:bg-danger-50 min-h-[38px] flex-1 justify-center"
                  >
                    <Trash2 size={14} /> {t('delete')}
                  </button>
                </div>

                {/* Listed date */}
                <div className="px-4 pb-3 text-[10px] text-surface-400 flex items-center gap-1">
                  <span>📋</span> Listed on {new Date(listing.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
};

export default MyListingsPage;
