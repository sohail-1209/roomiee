// RequestsPage — full requests list with tab-based filtering for owner & tenant
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ClipboardList } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { requestsAPI } from '../../services/endpoints';
import RequestCard from '../../components/RequestCard';

// ── Tab definitions ────────────────────────────────────────────────────────────
const TABS = [
  { key: 'ALL',      labelKey: 'all' },
  { key: 'PENDING',  labelKey: 'pending' },
  { key: 'ACCEPTED', labelKey: 'accepted' },
  { key: 'REJECTED', labelKey: 'rejected' },
];

// ── Badge colours per tab ──────────────────────────────────────────────────────
const TAB_BADGE = {
  ALL:      'bg-surface-100 text-surface-600',
  PENDING:  'bg-amber-100 text-amber-700',
  ACCEPTED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-red-100 text-red-600',
};

// ── Skeleton card ──────────────────────────────────────────────────────────────
const RequestSkeleton = () => (
  <div className="card p-4 flex gap-4">
    <div className="skeleton w-20 h-20 rounded-xl flex-shrink-0" />
    <div className="flex-1 flex flex-col gap-2">
      <div className="skeleton h-4 w-3/4 rounded-lg" />
      <div className="skeleton h-3 w-1/2 rounded-lg" />
      <div className="skeleton h-3 w-2/5 rounded-lg" />
      <div className="skeleton h-7 w-32 rounded-lg mt-auto" />
    </div>
  </div>
);

// ── Empty state ────────────────────────────────────────────────────────────────
const EmptyState = ({ tab }) => {
  const { t } = useTranslation();
  const messages = {
    ALL:      { emoji: '📋', textKey: 'noRequestsYet' },
    PENDING:  { emoji: '⏳', textKey: 'noPendingNow' },
    ACCEPTED: { emoji: '✅', textKey: 'noAcceptedYet' },
    REJECTED: { emoji: '❌', textKey: 'noRejected' },
  };
  const { emoji, textKey } = messages[tab] ?? messages.ALL;

  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
      <div className="w-16 h-16 rounded-full bg-surface-100 flex items-center justify-center text-3xl select-none">
        {emoji}
      </div>
      <div>
        <p className="font-semibold text-surface-700">{t(textKey)}</p>
        <p className="text-sm text-surface-400 mt-1">
          {tab === 'ALL'
            ? t('requestsAppear')
            : t('switchTab')}
        </p>
      </div>
    </div>
  );
};

// ── Main component ─────────────────────────────────────────────────────────────
export default function RequestsPage() {
  const { user } = useAuth();
  const userRole = user?.role ?? 'TENANT';
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState('ALL');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['requests'],
    queryFn: () => requestsAPI.getAll().then((r) => r.data.data),
    staleTime: 1000 * 60 * 2,
  });

  const requests = data ?? [];

  // Count per tab for badges
  const counts = useMemo(() => ({
    ALL:      requests.length,
    PENDING:  requests.filter((r) => r.status === 'PENDING').length,
    ACCEPTED: requests.filter((r) => r.status === 'ACCEPTED').length,
    REJECTED: requests.filter((r) => r.status === 'REJECTED').length,
  }), [requests]);

  // Filtered list for active tab
  const filtered = useMemo(() =>
    activeTab === 'ALL' ? requests : requests.filter((r) => r.status === activeTab),
    [requests, activeTab],
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
          <ClipboardList size={20} className="text-primary-600" />
        </div>
        <div>
          <h1 className="section-title">{t('requests')}</h1>
          <p className="section-subtitle">
            {userRole === 'OWNER'
              ? t('reviewRespond')
              : t('trackRequests')}
          </p>
        </div>
      </div>

      {/* ── Tabs ────────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 bg-surface-100 p-1 rounded-xl w-full">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-150 whitespace-nowrap ${
              activeTab === tab.key
                ? 'bg-surface-50/80 text-surface-900 shadow-sm'
                : 'text-surface-500 hover:text-surface-700'
            }`}
          >
            {t(tab.labelKey)}
            {counts[tab.key] > 0 && (
              <span
                className={`text-[10px] sm:text-xs font-semibold px-1 sm:px-1.5 py-0.5 rounded-full ${
                  activeTab === tab.key ? TAB_BADGE[tab.key] : 'bg-surface-200 text-surface-500'
                }`}
              >
                {counts[tab.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Content ─────────────────────────────────────────────────────────── */}
      {isError ? (
        <div className="card p-10 flex flex-col items-center gap-3 text-center">
          <span className="text-3xl">⚠️</span>
          <p className="font-semibold text-surface-700">{t('failedToLoadRequests')}</p>
          <p className="text-sm text-surface-400">{t('refreshTryAgain')}</p>
        </div>
      ) : isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <RequestSkeleton key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState tab={activeTab} />
      ) : (
        <div className="space-y-3">
          {filtered.map((req) => (
            <RequestCard key={req.id} request={req} />
          ))}
        </div>
      )}

    </div>
  );
}
