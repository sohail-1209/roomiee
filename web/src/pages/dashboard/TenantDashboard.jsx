// TenantDashboard — home page for tenants after login
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bookmark, Send, MessageSquare, Plus, ArrowRight, Home, CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { requestsAPI, savedAPI, chatAPI, listingsAPI } from '../../services/endpoints';
import RequestCard from '../../components/RequestCard';
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
      <div className="skeleton h-3 w-1/3 rounded-lg" />
    </div>
  </div>
);

// ── Main component ─────────────────────────────────────────────────────────────
export default function TenantDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

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

  const completeBookingMutation = useMutation({
    mutationFn: (id) => listingsAPI.completeBooking(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['myBookings'] });
      toast.success(t('bookingCompleted') || 'Booking activated!');
    },
    onError: () => toast.error(t('failedToUpdate')),
  });

  const requests = requestsData ?? [];
  const recentRequests = requests.slice(0, 3);
  const savedCount = savedData?.length ?? 0;
  const activeRequestsCount = requests.filter((r) => r.status === 'PENDING').length;
  const chatsCount = chatsData?.length ?? 0;
  const bookings = bookingsData ?? [];

  const firstName = user?.name?.split(' ')[0] ?? 'there';

  return (
    <div className="space-y-6 sm:space-y-8 max-w-4xl mx-auto">

      {/* ── Welcome header ──────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 sm:gap-4">
        <Avatar src={user?.profileImage} name={user?.name} size="lg" className="ring-2 ring-primary-100" />
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-surface-900 font-display">
            {t('welcomeBackName', { name: firstName })} <span className="gradient-text"></span>
          </h1>
          <p className="text-xs sm:text-sm text-surface-400 mt-0.5">
            {t('happeningWithRentals')}
          </p>
        </div>
      </div>

      {/* ── Stats row — Category card style ──────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        <CategoryCard
          to="/dashboard/saved"
          icon={Bookmark}
          label={t('savedListings')}
          value={savedCount}
          gradient="from-primary-50 to-primary-100"
          iconColor="text-primary-600"
          isLoading={savedLoading}
          delay={0}
        />
        <CategoryCard
          to="/dashboard/requests"
          icon={Send}
          label={t('activeRequests')}
          value={activeRequestsCount}
          gradient="from-amber-50 to-amber-100"
          iconColor="text-amber-600"
          isLoading={requestsLoading}
          delay={80}
        />
        <CategoryCard
          to="/dashboard/chats"
          icon={MessageSquare}
          label={t('chats')}
          value={chatsCount}
          gradient="from-emerald-50 to-emerald-100"
          iconColor="text-emerald-600"
          isLoading={chatsLoading}
          delay={160}
        />
      </div>

      {/* ── Recent Requests ─────────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="section-title">{t('recentRequests')}</h2>
            <p className="section-subtitle">{t('latestRentalRequests')}</p>
          </div>
          {requests.length > 3 && (
            <Link to="/dashboard/requests" className="btn-outline btn-sm flex items-center gap-1.5">
              {t('viewAll')} <ArrowRight size={14} />
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
              <p className="font-semibold text-surface-700">{t('noRequests')}</p>
              <p className="text-sm text-surface-400 mt-1">
                {t('browseGetStarted')}
              </p>
            </div>
            <Link to="/search" className="btn-primary btn-sm">
              {t('browseListings')}
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

      {/* ── My Bookings (Accepted) ──────────────────────────────────────────── */}
      {bookings.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="section-title">{t('myBookings')}</h2>
              <p className="section-subtitle">{t('acceptedBookings')}</p>
            </div>
          </div>
          <div className="space-y-3">
            {bookings.map((booking) => (
              <div key={booking.id} className="card p-4">
                <div className="flex gap-4">
                  <img
                    src={booking.listing?.photos?.[0]?.url || 'https://placehold.co/80x80?text=No+Photo'}
                    alt={booking.listing?.title}
                    className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-surface-800 text-sm truncate">{booking.listing?.title}</p>
                    <p className="text-xs text-surface-400 truncate">{booking.listing?.city}</p>
                  </div>
                </div>
                {/* Activate prompt */}
                <div className="mt-3 p-3 bg-primary-50/50 rounded-xl border border-primary-100">
                  <div className="flex items-start gap-2">
                    <CheckCircle size={16} className="text-primary-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs font-medium text-primary-700">{t('bookingConfirmed')}</p>
                      <p className="text-[11px] text-primary-500 mt-0.5">{t('activateBookingPrompt') || 'Create a room sharing listing to activate this booking'}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => navigate('/dashboard/listings/new', { state: { fromBooking: booking } })}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-primary-600 text-white text-xs font-medium rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      <Plus size={14} /> {t('activateNow') || 'Activate Now'}
                    </button>
                    <button
                      onClick={() => completeBookingMutation.mutate(booking.id)}
                      className="px-3 py-2 text-xs font-medium text-surface-500 border border-surface-200 rounded-lg hover:bg-surface-50 transition-colors"
                    >
                      {t('dismiss') || 'Dismiss'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

    </div>
  );
}
