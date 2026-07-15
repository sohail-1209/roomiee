// My Listings page — owner's listing management
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus, Eye, Edit, Trash2, MapPin } from 'lucide-react';
import { listingsAPI } from '../../services/endpoints';
import { formatRent, getPrimaryPhoto } from '../../utils/helpers';
import PageHeader from '../../components/layout/PageHeader';
import { Badge, EmptyState } from '../../components/ui';

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Active', color: 'bg-success-50 text-success-600 border-success-200', activeColor: 'bg-success-500 text-white border-success-500' },
  { value: 'PAUSED', label: 'Inactive', color: 'bg-amber-50 text-amber-600 border-amber-200', activeColor: 'bg-amber-500 text-white border-amber-500' },
  { value: 'RENTED', label: 'Booked', color: 'bg-primary-50 text-primary-600 border-primary-200', activeColor: 'bg-primary-500 text-white border-primary-500' },
];

const getDetailPath = (listing) => {
  if (listing.type === 'HOSTEL') return `/hostel/${listing.id}`;
  if (listing.type === 'ROOM_SHARING') return `/room/${listing.id}`;
  if (listing.type === 'LAND_SALE') return `/land/${listing.id}`;
  return `/listing/${listing.id}`;
};

const MyListingsPage = () => {
  const qc = useQueryClient();
  const { data: listings, isLoading } = useQuery({
    queryKey: ['myListings'],
    queryFn: () => listingsAPI.getMyListings().then((r) => r.data.data),
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
        title="My Listings"
        subtitle={`${listings?.length || 0} total listings`}
        action={
          <Link to="/dashboard/listings/new" className="btn-primary btn-md px-4 py-2.5 text-sm rounded-xl inline-flex items-center gap-2">
            <Plus size={16} /> Add Listing
          </Link>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {[1,2,3,4].map((i) => <div key={i} className="skeleton h-32 rounded-2xl" />)}
        </div>
      ) : !listings?.length ? (
        <EmptyState
          icon={<span className="text-4xl">🏠</span>}
          title="No listings yet"
          description="Create your first listing to start receiving requests"
          action={<Link to="/dashboard/listings/new" className="btn-primary btn-md px-5 py-2.5 rounded-xl inline-flex items-center gap-2 mt-4"><Plus size={16} /> Add Listing</Link>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {listings.map((listing) => {
            const photo = getPrimaryPhoto(listing);
            return (
              <div key={listing.id} className="card p-4 flex gap-4">
                <img
                  src={photo || 'https://placehold.co/80x80?text=No+Photo'}
                  alt={listing.title}
                  className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-semibold text-surface-900 text-sm line-clamp-1">{listing.title}</h3>
                    <Badge variant={listing.status === 'ACTIVE' ? 'success' : listing.status === 'RENTED' ? 'primary' : 'warning'}>
                      {listing.status === 'ACTIVE' ? 'Active' : listing.status === 'RENTED' ? 'Booked' : 'Inactive'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-surface-400 mb-2">
                    <MapPin size={11} /> {listing.city}
                    <span className="mx-1">·</span>
                    <span className="font-medium text-surface-700">{formatRent(listing.rent)}/mo</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-surface-400 mb-3">
                    <Eye size={11} /> {listing.views} views
                    <span className="mx-1">·</span>
                    {listing._count?.requests} requests
                  </div>

                  {/* Radio-style status toggle */}
                  <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                    {STATUS_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => updateStatus({ id: listing.id, status: opt.value })}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 min-h-[36px] ${
                          listing.status === opt.value
                            ? `${opt.activeColor} shadow-sm scale-105`
                            : `${opt.color} hover:opacity-80`
                        }`}
                      >
                        <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${
                          listing.status === opt.value ? 'bg-white' : 'bg-current opacity-40'
                        }`} />
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <Link to={getDetailPath(listing)} className="btn btn-sm btn-ghost text-xs px-3 py-2 rounded-lg min-h-[40px]">
                      <Eye size={14} /> View
                    </Link>
                    <Link to={`/dashboard/listings/${listing.id}/edit`} className="btn btn-sm btn-secondary text-xs px-3 py-2 rounded-lg min-h-[40px]">
                      <Edit size={14} /> Edit
                    </Link>
                    <button
                      onClick={() => { if (confirm('Delete this listing?')) deleteListing(listing.id); }}
                      className="btn btn-sm text-xs px-3 py-2 rounded-lg text-danger-500 hover:bg-danger-50 min-h-[40px]"
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
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
