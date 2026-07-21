// OwnerDashboard — home page for property owners/landlords after login
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Home, Eye, Clock, CheckCircle, Plus, ArrowRight,
  Building2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { requestsAPI, listingsAPI } from '../../services/endpoints';
import RequestCard from '../../components/RequestCard';
import { useTranslation } from 'react-i18next';
import { formatRent, getPrimaryPhoto, requestStatusClass, formatNumber } from '../../utils/helpers';
import Avatar from '../../components/ui/Avatar';

// ── Category-style card (matches homepage) ──────────────────────────────────────
const CategoryCard = ({ to, icon: Icon, label, value, gradient, iconColor, isLoading, delay = 0 }) => (
  <Link
    to={to}
    className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-2 sm:gap-3 p-2.5 sm:p-4 rounded-2xl glass-card group"
    style={{ animation: `slide-up 0.4s cubic-bezier(0.16,1,0.3,1) ${delay}ms both` }}
  >
    <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-white/60 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform duration-300">
      <Icon size={16} className={`${iconColor} animate-bounce-subtle`} />
    </div>
    <div className="flex-1 min-w-0 flex flex-col items-center sm:items-start w-full">
      {isLoading ? (
        <div className="skeleton h-5 w-8 rounded-lg mb-1" />
      ) : (
        <p className="text-base sm:text-lg font-bold text-surface-900 font-display leading-tight">{value}</p>
      )}
      <p className="text-[10px] sm:text-xs text-surface-400 font-medium leading-tight mt-0.5 whitespace-normal break-words w-full">{label}</p>
    </div>
  </Link>
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
  const { t } = useTranslation();

  const getDetailPath = (listing) => {
    if (listing.type === 'HOSTEL') return `/hostel/${listing.id}`;
    if (listing.type === 'ROOM_SHARING') return `/room/${listing.id}`;
    if (listing.type === 'LAND_SALE') return `/land/${listing.id}`;
    return `/listing/${listing.id}`;
  };

  const detailPath = getDetailPath(listing);

  return (
    <div
      className="card p-3 flex items-center gap-3 cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => navigate(detailPath)}
      role="link"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && navigate(detailPath)}
    >
      <img
        src={photo || 'https://placehold.co/56x56?text=📷'}
        alt={listing.title}
        className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-surface-800 text-sm line-clamp-1">{listing.title}</p>
        <p className="text-xs text-surface-400 mt-0.5">
          {listing.type === 'HOSTEL' && listing.hostelSharing?.tiers?.length > 0
            ? `From ${formatRent(Math.min(...listing.hostelSharing.tiers.map((t) => t.price)))}`
            : formatRent(listing.rent)
          }/mo · {listing.city}
        </p>
        <div className="flex items-center gap-2 mt-1.5">
          <span
            className={`badge text-xs ${
              listing.status === 'ACTIVE' ? 'badge-success' : listing.status === 'RENTED' ? 'badge-primary' : 'badge-gray'
            }`}
          >
            {listing.status === 'ACTIVE' ? t('active') : listing.status === 'RENTED' ? (listing.type === 'HOSTEL' ? t('fullyBooked') : t('booked')) : t('inactive')}
          </span>
          <span className="text-xs text-surface-400 flex items-center gap-0.5">
            <Eye size={11} /> {formatNumber(listing.views ?? 0)} {t('views')}
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
  const { t } = useTranslation();

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
    <div className="space-y-6 sm:space-y-8 max-w-5xl mx-auto">

      {/* ── Welcome header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <Avatar src={user?.profileImage} name={user?.name} size="lg" className="ring-2 ring-primary-100" />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-surface-900 font-display">
              <span className="gradient-text">{t('hello', { name: firstName })}</span>
            </h1>
            <p className="text-xs sm:text-sm text-surface-400 mt-0.5">
              {t('manageListings')}
            </p>
          </div>
        </div>

        {/* CTA — Add New Listing */}
        <button
          onClick={() => navigate('/dashboard/listings/new')}
          className="btn-primary btn-md flex items-center gap-2 flex-shrink-0 self-start sm:self-auto"
        >
          <Plus size={18} />
          {t('addNewListing')}
        </button>
      </div>

      {/* ── Analytics cards — Category card style ───────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <CategoryCard
          to="/dashboard/listings"
          icon={Building2}
          label={t('totalListings')}
          value={totalListings}
          gradient="from-primary-50 to-primary-100"
          iconColor="text-primary-600"
          isLoading={listingsLoading}
          delay={0}
        />
        <CategoryCard
          to="/dashboard/listings"
          icon={Eye}
          label={t('totalViews')}
          value={formatNumber(totalViews)}
          gradient="from-violet-50 to-violet-100"
          iconColor="text-violet-600"
          isLoading={listingsLoading}
          delay={80}
        />
        <CategoryCard
          to="/dashboard/requests"
          icon={Clock}
          label={t('pendingRequests')}
          value={pendingRequests.length}
          gradient="from-amber-50 to-amber-100"
          iconColor="text-amber-600"
          isLoading={requestsLoading}
          delay={160}
        />
        <CategoryCard
          to="/dashboard/requests"
          icon={CheckCircle}
          label={t('acceptedRequests')}
          value={acceptedRequestsCount}
          gradient="from-emerald-50 to-emerald-100"
          iconColor="text-emerald-600"
          isLoading={requestsLoading}
          delay={240}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">

        {/* ── Recent Pending Requests (3/5 width) ──────────────────────────── */}
        <section className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="section-title">{t('pendingRequests')}</h2>
              <p className="section-subtitle">{t('awaitingResponse')}</p>
            </div>
            {pendingRequests.length > 5 && (
              <Link
                to="/dashboard/requests"
                className="btn-outline btn-sm flex items-center gap-1.5"
              >
                {t('viewAll')} <ArrowRight size={14} />
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
                <p className="font-semibold text-surface-700">{t('allCaughtUp')}</p>
                <p className="text-sm text-surface-400 mt-1">{t('noPending')}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {recentPendingRequests.map((req) => (
                <RequestCard key={req.id} request={req} />
              ))}
            </div>
          )}
        </section>

        {/* ── My Listings preview (2/5 width) ──────────────────────────────── */}
        <section className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="section-title">{t('myListings')}</h2>
              <p className="section-subtitle">{t('quickOverview')}</p>
            </div>
            <Link
              to="/dashboard/listings"
              className="btn-outline btn-sm flex items-center gap-1.5"
            >
              {t('viewAll')} <ArrowRight size={14} />
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
                <p className="font-semibold text-surface-700">{t('noListings')}</p>
                <p className="text-sm text-surface-400 mt-1">
                  {t('createFirst')}
                </p>
              </div>
              <button
                onClick={() => navigate('/dashboard/listings/new')}
                className="btn-primary btn-sm flex items-center gap-1.5"
              >
                <Plus size={14} /> {t('addListing')}
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
