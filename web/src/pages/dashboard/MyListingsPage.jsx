// My Listings page — owner's listing management
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus, Eye, Edit, Trash2, MapPin } from 'lucide-react';
import { listingsAPI } from '../../services/endpoints';
import { formatRent, getPrimaryPhoto } from '../../utils/helpers';
import DashboardLayout from '../../components/layout/DashboardLayout';
import PageHeader from '../../components/layout/PageHeader';
import { Badge, Button, EmptyState } from '../../components/ui';

const statusVariant = { ACTIVE: 'success', RENTED: 'primary', PAUSED: 'warning', DELETED: 'danger' };

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

  return (
    <>
      <PageHeader
        title="My Listings"
        subtitle={`${listings?.length || 0} total listings`}
        action={
          <Link to="/listings/new" className="btn-primary btn-md px-4 py-2.5 text-sm rounded-xl inline-flex items-center gap-2">
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
          action={<Link to="/listings/new" className="btn-primary btn-md px-5 py-2.5 rounded-xl inline-flex items-center gap-2 mt-4"><Plus size={16} /> Add Listing</Link>}
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
                    <Badge variant={statusVariant[listing.status] || 'gray'}>{listing.status}</Badge>
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
                  <div className="flex gap-2">
                    <Link to={`/listing/${listing.id}`} className="btn btn-sm btn-ghost text-xs px-2 py-1 rounded-lg">
                      <Eye size={12} /> View
                    </Link>
                    <Link to={`/dashboard/listings/${listing.id}/edit`} className="btn btn-sm btn-secondary text-xs px-2 py-1 rounded-lg">
                      <Edit size={12} /> Edit
                    </Link>
                    <button
                      onClick={() => { if (confirm('Delete this listing?')) deleteListing(listing.id); }}
                      className="btn btn-sm text-xs px-2 py-1 rounded-lg text-danger-500 hover:bg-danger-50"
                    >
                      <Trash2 size={12} />
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
