// OwnerDashboard — home page for property owners/landlords after login
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Home, Eye, Clock, CheckCircle, Plus, ArrowRight,
  TrendingUp, Building2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { requestsAPI, listingsAPI } from '../../services/endpoints';
import RequestCard from '../../components/RequestCard';
import { formatRent, getPrimaryPhoto, requestStatusClass } from '../../utils/helpers';
import Avatar from '../../components/ui/Avatar';

// ── Analytics card ─────────────────────────────────────────────────────────────
const AnalyticsCard = ({ icon: Icon, label, value, color, sub, isLoading }) => (
  <div className="card p-5 flex flex-col gap-3">
    <div className="flex items-center justify-between">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={18} className="text-white" />
      </div>
      {sub != null && (
        <span className="text-xs text-emerald-600 font-medium flex items-center gap-0.5">
          <TrendingUp size={12} /> {sub}
        </span>
      )}
    </div>
    {isLoading ? (
      <div className="skeleton h-8 w-14 rounded-lg" />
    ) : (
      <p className="text-3xl font-bold text-surface-900 font-display">{value}</p>
    )}
    <p className="text-xs text-surface-400 font-medium -mt-1">{label}</p>
  </div>
);

// ── Skeleton for request cards ─────────────────────────────────────────────────
const RequestSkeleton = () => (
  <div className="card p-4 flex gap-4">
    <div className="skeleton w-20 h-20 rounded-xl flex-shrink-0" />
    <div className="flex-1 flex flex-col gap-2">
      <div className="skeleton h-4 w-3/4 rounded-lg" />
      <div className="skeleton h-3 w-1/2 rounded-lg" />
      <div className="skeleton h-6 w-32 rounded-lg mt-auto" />
    </div>
  </div>
);

// ── Mini listing row ───────────────────────────────────────────────────────────
const ListingRow = ({ listing }) => {
  const photo = getPrimaryPhoto(listing);
  const navigate = useNavigate();

  return (
    <div
      className="card p-3 flex items-center gap-3 cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => navigate(`/listing/${listing.id}`)}
      role="link"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/listing/${listing.id}`)}
    >
      <img
        src={photo || 'https://placehold.co/56x56?text=📷'}
        alt={listing.title}
        className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-surface-800 text-sm line-clamp-1">{listing.title}</p>
        <p className="text-xs text-surface-400 mt-0.5">{formatRent(listing.rent)}/mo · {listing.city}</p>
        <div className="flex items-center gap-2 mt-1.5">
          <span
            className={`badge text-xs ${
              listing.isActive ? 'badge-success' : 'badge-gray'
            }`}
          >
            {listing.isActive ? 'Active' : 'Inactive'}
          </span>
          <span className="text-xs text-surface-400 flex items-center gap-0.5">
            <Eye size={11} /> {listing.views ?? 0} views
          </span>
        </div>
      </div>
      <ArrowRight size={16} className="text-surface-300 flex-shrink-0" />
    </div>
  );
};

// ── Skeleton listing row ───────────────────────────────────────────────────────
const ListingRowSkeleton = () => (
  <div className="card p-3 flex items-center gap-3">
    <div className="skeleton w-14 h-14 rounded-xl flex-shrink-0" />
    <div className="flex-1 flex flex-col gap-2">
      <div className="skeleton h-4 w-3/4 rounded-lg" />
      <div className="skeleton h-3 w-1/2 rounded-lg" />
      <div className="skeleton h-5 w-20 rounded-full" />
    </div>
  </div>
);

// ── Main component ─────────────────────────────────────────────────────────────
export default function OwnerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: requestsData, isLoading: requestsLoading } = useQuery({
    queryKey: ['requests'],
    queryFn: () => requestsAPI.getAll().then((r) => r.data.data),
    staleTime: 1000 * 60 * 2,
  });

  const { data: listingsData, isLoading: listingsLoading } = useQuery({
    queryKey: ['myListings'],
    queryFn: () => listingsAPI.getMyListings().then((r) => r.data.data),
    staleTime: 1000 * 60 * 2,
  });

  const requests = requestsData ?? [];
  const listings = listingsData ?? [];

  const totalListings = listings.length;
  const totalViews = listings.reduce((acc, l) => acc + (l.views ?? 0), 0);
  const pendingRequests = requests.filter((r) => r.status === 'PENDING');
  const acceptedRequestsCount = requests.filter((r) => r.status === 'ACCEPTED').length;

  const recentPendingRequests = pendingRequests.slice(0, 5);
  const recentListings = listings.slice(0, 3);

  const firstName = user?.name?.split(' ')[0] ?? 'there';

  return (
    <div className="space-y-8 max-w-5xl mx-auto">

      {/* ── Welcome header ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <Avatar src={user?.profileImage} name={user?.name} size="lg" className="ring-2 ring-primary-100" />
          <div>
            <h1 className="text-2xl font-bold text-surface-900 font-display">
              Hello, <span className="gradient-text">{firstName}!</span>
            </h1>
            <p className="text-sm text-surface-400 mt-0.5">
              Manage your listings and tenant requests.
            </p>
          </div>
        </div>

        {/* CTA — Add New Listing */}
        <button
          onClick={() => navigate('/dashboard/listings/new')}
          className="btn-primary btn-md flex items-center gap-2 flex-shrink-0"
        >
          <Plus size={18} />
          Add New Listing
        </button>
      </div>

      {/* ── Analytics cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <AnalyticsCard
          icon={Building2}
          label="Total Listings"
          value={totalListings}
          color="bg-primary-500"
          isLoading={listingsLoading}
        />
        <AnalyticsCard
          icon={Eye}
          label="Total Views"
          value={totalViews.toLocaleString('en-IN')}
          color="bg-violet-500"
          isLoading={listingsLoading}
        />
        <AnalyticsCard
          icon={Clock}
          label="Pending Requests"
          value={pendingRequests.length}
          color="bg-amber-500"
          isLoading={requestsLoading}
        />
        <AnalyticsCard
          icon={CheckCircle}
          label="Accepted Requests"
          value={acceptedRequestsCount}
          color="bg-emerald-500"
          isLoading={requestsLoading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

        {/* ── Recent Pending Requests (3/5 width) ──────────────────────────── */}
        <section className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="section-title">Pending Requests</h2>
              <p className="section-subtitle">Awaiting your response</p>
            </div>
            {pendingRequests.length > 5 && (
              <Link
                to="/dashboard/requests"
                className="btn-outline btn-sm flex items-center gap-1.5"
              >
                View all <ArrowRight size={14} />
              </Link>
            )}
          </div>

          {requestsLoading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => <RequestSkeleton key={i} />)}
            </div>
          ) : recentPendingRequests.length === 0 ? (
            <div className="card p-10 flex flex-col items-center justify-center text-center gap-3">
              <div className="w-14 h-14 rounded-full bg-surface-100 flex items-center justify-center text-3xl select-none">
                🎉
              </div>
              <div>
                <p className="font-semibold text-surface-700">All caught up!</p>
                <p className="text-sm text-surface-400 mt-1">No pending requests right now.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {recentPendingRequests.map((req) => (
                <RequestCard key={req.id} request={req} userRole="OWNER" />
              ))}
            </div>
          )}
        </section>

        {/* ── My Listings preview (2/5 width) ──────────────────────────────── */}
        <section className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="section-title">My Listings</h2>
              <p className="section-subtitle">Quick overview</p>
            </div>
            <Link
              to="/dashboard/listings"
              className="btn-outline btn-sm flex items-center gap-1.5"
            >
              View all <ArrowRight size={14} />
            </Link>
          </div>

          {listingsLoading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => <ListingRowSkeleton key={i} />)}
            </div>
          ) : recentListings.length === 0 ? (
            <div className="card p-8 flex flex-col items-center justify-center text-center gap-3">
              <div className="w-14 h-14 rounded-full bg-surface-100 flex items-center justify-center text-3xl select-none">
                🏠
              </div>
              <div>
                <p className="font-semibold text-surface-700">No listings yet</p>
                <p className="text-sm text-surface-400 mt-1">
                  Create your first listing to start receiving requests.
                </p>
              </div>
              <button
                onClick={() => navigate('/dashboard/listings/new')}
                className="btn-primary btn-sm flex items-center gap-1.5"
              >
                <Plus size={14} /> Add Listing
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {recentListings.map((listing) => (
                <ListingRow key={listing.id} listing={listing} />
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
