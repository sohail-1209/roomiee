// TenantDashboard — home page for tenants after login
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Bookmark, Send, MessageSquare, Search, Heart, ArrowRight, Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { requestsAPI, savedAPI, chatAPI, listingsAPI } from '../../services/endpoints';
import RequestCard from '../../components/RequestCard';
import Avatar from '../../components/ui/Avatar';

// ── Stat card ─────────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, color, isLoading }) => (
  <div className="card p-5 flex items-center gap-4">
    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${color}`}>
      <Icon size={22} className="text-white" />
    </div>
    <div>
      {isLoading ? (
        <div className="skeleton h-7 w-10 rounded-lg mb-1" />
      ) : (
        <p className="text-2xl font-bold text-surface-900 font-display">{value}</p>
      )}
      <p className="text-xs text-surface-400 font-medium">{label}</p>
    </div>
  </div>
);

// ── Quick link button ──────────────────────────────────────────────────────────
const QuickLink = ({ to, icon: Icon, label, description }) => (
  <Link
    to={to}
    className="card card-hover p-4 flex items-center gap-3 group"
  >
    <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0 group-hover:bg-primary-100 transition-colors">
      <Icon size={18} className="text-primary-600" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="font-semibold text-surface-800 text-sm">{label}</p>
      <p className="text-xs text-surface-400 truncate">{description}</p>
    </div>
    <ArrowRight size={16} className="text-surface-300 group-hover:text-primary-500 transition-colors flex-shrink-0" />
  </Link>
);

// ── Skeleton for request cards ─────────────────────────────────────────────────
const RequestSkeleton = () => (
  <div className="card p-4 flex gap-4">
    <div className="skeleton w-20 h-20 rounded-xl flex-shrink-0" />
    <div className="flex-1 flex flex-col gap-2">
      <div className="skeleton h-4 w-3/4 rounded-lg" />
      <div className="skeleton h-3 w-1/2 rounded-lg" />
      <div className="skeleton h-3 w-1/3 rounded-lg" />
    </div>
  </div>
);

// ── Main component ─────────────────────────────────────────────────────────────
export default function TenantDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: requestsData, isLoading: requestsLoading } = useQuery({
    queryKey: ['requests'],
    queryFn: () => requestsAPI.getAll().then((r) => r.data.data),
    staleTime: 1000 * 60 * 2,
  });

  const { data: savedData, isLoading: savedLoading } = useQuery({
    queryKey: ['saved'],
    queryFn: () => savedAPI.getAll().then((r) => r.data.data),
    staleTime: 1000 * 60 * 2,
  });

  const { data: chatsData, isLoading: chatsLoading } = useQuery({
    queryKey: ['chats'],
    queryFn: () => chatAPI.getChats().then((r) => r.data.data),
    staleTime: 1000 * 60 * 2,
  });

  const { data: bookingsData, isLoading: bookingsLoading } = useQuery({
    queryKey: ['myBookings'],
    queryFn: () => listingsAPI.getMyBookings().then((r) => r.data.data),
    staleTime: 1000 * 60 * 2,
  });

  const requests = requestsData ?? [];
  const recentRequests = requests.slice(0, 3);
  const savedCount = savedData?.length ?? 0;
  const activeRequestsCount = requests.filter((r) => r.status === 'PENDING').length;
  const chatsCount = chatsData?.length ?? 0;
  const bookings = bookingsData ?? [];

  const firstName = user?.name?.split(' ')[0] ?? 'there';

  return (
    <div className="space-y-8 max-w-4xl mx-auto">

      {/* ── Welcome header ──────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <Avatar src={user?.profileImage} name={user?.name} size="lg" className="ring-2 ring-primary-100" />
        <div>
          <h1 className="text-2xl font-bold text-surface-900 font-display">
            Welcome back, <span className="gradient-text">{firstName}!</span>
          </h1>
          <p className="text-sm text-surface-400 mt-0.5">
            Here's what's happening with your rentals today.
          </p>
        </div>
      </div>

      {/* ── Stats row ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={Bookmark}
          label="Saved Listings"
          value={savedCount}
          color="bg-primary-500"
          isLoading={savedLoading}
        />
        <StatCard
          icon={Send}
          label="Active Requests"
          value={activeRequestsCount}
          color="bg-amber-500"
          isLoading={requestsLoading}
        />
        <StatCard
          icon={MessageSquare}
          label="Chats"
          value={chatsCount}
          color="bg-emerald-500"
          isLoading={chatsLoading}
        />
      </div>

      {/* ── Recent Requests ─────────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="section-title">Recent Requests</h2>
            <p className="section-subtitle">Your latest rental requests</p>
          </div>
          {requests.length > 3 && (
            <Link to="/dashboard/requests" className="btn-outline btn-sm flex items-center gap-1.5">
              View all <ArrowRight size={14} />
            </Link>
          )}
        </div>

        {requestsLoading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => <RequestSkeleton key={i} />)}
          </div>
        ) : recentRequests.length === 0 ? (
          <div className="card p-10 flex flex-col items-center justify-center text-center gap-4">
            <div className="w-16 h-16 rounded-full bg-surface-100 flex items-center justify-center text-3xl select-none">
              📋
            </div>
            <div>
              <p className="font-semibold text-surface-700">No requests yet</p>
              <p className="text-sm text-surface-400 mt-1">
                Browse listings and send a request to get started.
              </p>
            </div>
            <Link to="/search" className="btn-primary btn-sm">
              Browse Listings
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recentRequests.map((req) => (
              <RequestCard key={req.id} request={req} userRole="TENANT" />
            ))}
          </div>
        )}
      </section>

      {/* ── Quick Links ─────────────────────────────────────────────────────── */}
      <section>
        <h2 className="section-title mb-4">Quick Links</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <QuickLink
            to="/search"
            icon={Search}
            label="Search Listings"
            description="Find your next home"
          />
          <QuickLink
            to="/dashboard/saved"
            icon={Heart}
            label="View Saved"
            description={`${savedCount} saved listing${savedCount !== 1 ? 's' : ''}`}
          />
          <QuickLink
            to="/dashboard/chats"
            icon={MessageSquare}
            label="View Chats"
            description={`${chatsCount} active conversation${chatsCount !== 1 ? 's' : ''}`}
          />
        </div>
      </section>

      {/* ── My Bookings (Accepted) ──────────────────────────────────────────── */}
      {bookings.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="section-title">My Bookings</h2>
              <p className="section-subtitle">Your accepted bookings — create a room sharing listing from here</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {bookings.map((booking) => (
              <div key={booking.id} className="card p-4 flex gap-4">
                <img
                  src={booking.photos?.[0]?.url || 'https://placehold.co/120x120?text=No+Photo'}
                  alt={booking.title}
                  className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-surface-800 text-sm truncate">{booking.title}</p>
                  <p className="text-xs text-surface-400 truncate">{booking.city}</p>
                  <button
                    onClick={() => navigate('/dashboard/listings/new', { state: { fromBooking: booking } })}
                    className="mt-2 text-xs font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1"
                  >
                    <Plus size={13} /> Create Room Sharing
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

    </div>
  );
}
