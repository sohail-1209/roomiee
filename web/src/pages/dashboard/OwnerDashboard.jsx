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
const CategoryCard = ({ to, icon: Icon, label, value, color, isLoading, delay = 0 }) => (
  <Link
    to={to}
    className="flex items-center gap-3 p-3 sm:p-4 rounded-2xl bg-white/60 hover:bg-white/80 transition-all duration-300 group shadow-sm hover:shadow-md border border-surface-100"
    style={{ animation: `slide-up 0.4s cubic-bezier(0.16,1,0.3,1) ${delay}ms both` }}
  >
    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform duration-300 ${color}`}>
      <Icon size={18} className="text-white" />
    </div>
    <div className="flex-1 min-w-0">
      {isLoading ? (
        <div className="skeleton h-5 w-8 rounded-lg mb-1" />
      ) : (
        <p className="text-lg font-bold text-surface-900 font-display">{value}</p>
      )}
      <p className="text-xs text-surface-400 font-medium">{label}</p>
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
              listing.status === 'ACTIVE' ? 'badge-success' : listing.status === 'RENTED' ? 'badge-primary' : 'badge-gray'
            }`}
          >
            {listing.status === 'ACTIVE' ? t('active') : listing.status === 'RENTED' ? t('booked') : t('inactive')}
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
          color="bg-primary-500"
          isLoading={listingsLoading}
          delay={0}
        />
        <CategoryCard
          to="/dashboard/listings"
          icon={Eye}
          label={t('totalViews')}
          value={formatNumber(totalViews)}
          color="bg-violet-500"
          isLoading={listingsLoading}
          delay={80}
        />
        <CategoryCard
          to="/dashboard/requests"
          icon={Clock}
          label={t('pendingRequests')}
          value={pendingRequests.length}
          color="bg-amber-500"
          isLoading={requestsLoading}
          delay={160}
        />
        <CategoryCard
          to="/dashboard/requests"
          icon={CheckCircle}
          label={t('acceptedRequests')}
          value={acceptedRequestsCount}
          color="bg-emerald-500"
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
                <RequestCard key={req.id} request={req} userRole="OWNER" />
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
