import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Users,
  Home,
  AlertTriangle,
  BarChart3,
  ShieldAlert,
  UserCheck,
  UserX,
  CheckCircle,
  Eye,
  Trash2,
} from 'lucide-react';

import Navbar from '../../components/layout/Navbar';
import { adminAPI } from '../../services/endpoints';
import { Button, Badge, Spinner, EmptyState } from '../../components/ui';
import { formatRent, timeAgo } from '../../utils/helpers';

// Subcomponents for tabs
const StatsView = ({ stats }) => {
  const { t } = useTranslation();
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
    {[
      { label: t('totalUsers'), value: stats?.users, icon: Users, color: 'text-blue-600 bg-blue-50' },
      { label: t('activeListings'), value: stats?.listings, icon: Home, color: 'text-green-600 bg-green-50' },
      { label: t('totalRequestsLabel'), value: stats?.requests, icon: BarChart3, color: 'text-indigo-600 bg-indigo-50' },
      { label: t('openReports'), value: stats?.openReports, icon: AlertTriangle, color: 'text-danger-600 bg-danger-50' },
    ].map(({ label, value, icon: Icon, color }) => (
      <div key={label} className="card p-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-surface-400">{label}</p>
          <p className="font-display font-bold text-3xl text-surface-900 mt-2">
            {value !== undefined ? value : '—'}
          </p>
        </div>
        <div className={`p-4 rounded-2xl ${color}`}>
          <Icon size={24} />
        </div>
      </div>
    ))}
  </div>
  );
};

const UserManagement = () => {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => adminAPI.getAllUsers().then((r) => r.data.data),
  });

  const { mutate: toggleBan } = useMutation({
    mutationFn: ({ id, isBanned }) => adminAPI.banUser(id, isBanned),
    onSuccess: (_, variables) => {
      toast.success(variables.isBanned ? t('userBanned') : t('userUnbanned'));
      qc.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: () => toast.error(t('operationFailed')),
  });

  if (isLoading) return <Spinner size="lg" className="mx-auto my-12" />;

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-100 border-b border-surface-200">
              <th className="p-4 font-semibold text-sm text-surface-700">{t('nameEmail')}</th>
              <th className="p-4 font-semibold text-sm text-surface-700">{t('role')}</th>
              <th className="p-4 font-semibold text-sm text-surface-700">{t('rating')}</th>
              <th className="p-4 font-semibold text-sm text-surface-700">{t('joined')}</th>
              <th className="p-4 font-semibold text-sm text-surface-700">{t('status')}</th>
              <th className="p-4 font-semibold text-sm text-surface-700 text-right">{t('actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100 text-sm text-surface-600">
            {users?.map((u) => (
              <tr key={u.id} className="hover:bg-surface-50">
                <td className="p-4">
                  <div className="font-semibold text-surface-900">{u.name}</div>
                  <div className="text-xs text-surface-400 mt-0.5">{u.email}</div>
                </td>
                <td className="p-4 uppercase text-xs font-semibold">{u.role}</td>
                <td className="p-4">⭐ {u.avgRating?.toFixed(1) || '0.0'}</td>
                <td className="p-4">{new Date(u.createdAt).toLocaleDateString()}</td>
                <td className="p-4">
                  <Badge variant={u.isBanned ? 'danger' : 'success'}>
                    {u.isBanned ? t('banned') : t('active')}
                  </Badge>
                </td>
                <td className="p-4 text-right">
                  <Button
                    variant={u.isBanned ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => toggleBan({ id: u.id, isBanned: !u.isBanned })}
                  >
                    {u.isBanned ? <UserCheck size={14} /> : <UserX size={14} />}
                    {u.isBanned ? t('unban') : t('ban')}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const ListingManagement = () => {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { data: listings, isLoading } = useQuery({
    queryKey: ['admin-listings'],
    queryFn: () => adminAPI.getAllListings().then((r) => r.data.data),
  });

  const { mutate: verifyListing } = useMutation({
    mutationFn: (id) => adminAPI.verifyListing(id),
    onSuccess: () => {
      toast.success(t('listingVerified'));
      qc.invalidateQueries({ queryKey: ['admin-listings'] });
      qc.invalidateQueries({ queryKey: ['myListings'] });
      qc.invalidateQueries({ queryKey: ['admin-analytics'] });
    },
    onError: () => toast.error(t('verificationFailedToast')),
  });

  if (isLoading) return <Spinner size="lg" className="mx-auto my-12" />;

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-100 border-b border-surface-200">
              <th className="p-4 font-semibold text-sm text-surface-700">{t('listingTitleHeader')}</th>
              <th className="p-4 font-semibold text-sm text-surface-700">{t('ownerHeader')}</th>
              <th className="p-4 font-semibold text-sm text-surface-700">{t('rentHeader')}</th>
              <th className="p-4 font-semibold text-sm text-surface-700">{t('locationHeader')}</th>
              <th className="p-4 font-semibold text-sm text-surface-700">{t('status')}</th>
              <th className="p-4 font-semibold text-sm text-surface-700 text-right">{t('actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100 text-sm text-surface-600">
            {listings?.map((l) => (
              <tr key={l.id} className="hover:bg-surface-50">
                <td className="p-4">
                  <div className="font-semibold text-surface-900">{l.title}</div>
                  <div className="text-xs text-primary-600 uppercase mt-0.5">{l.type.replace('_', ' ')}</div>
                </td>
                <td className="p-4">
                  <div className="font-medium text-surface-800">{l.owner?.name}</div>
                  <div className="text-xs text-surface-400 mt-0.5">{l.owner?.email}</div>
                </td>
                <td className="p-4 font-semibold text-surface-900">{formatRent(l.rent)}</td>
                <td className="p-4">{l.city}</td>
                <td className="p-4">
                  <Badge variant={l.status === 'ACTIVE' ? 'success' : 'warning'}>
                    {l.status}
                  </Badge>
                </td>
                <td className="p-4 text-right flex justify-end gap-2">
                  <a
                    href={`/listing/${l.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-sm btn-secondary flex items-center gap-1"
                  >
                    <Eye size={14} /> {t('view')}
                  </a>
                  {l.status !== 'ACTIVE' && (
                    <Button variant="primary" size="sm" onClick={() => verifyListing(l.id)}>
                      <CheckCircle size={14} /> {t('verifyBtn')}
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const ReportManagement = () => {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { data: reports, isLoading } = useQuery({
    queryKey: ['admin-reports'],
    queryFn: () => adminAPI.getAllReports().then((r) => r.data.data),
  });

  const { mutate: updateReportStatus } = useMutation({
    mutationFn: ({ id, status }) => adminAPI.updateReport(id, status),
    onSuccess: () => {
      toast.success(t('reportResolved'));
      qc.invalidateQueries({ queryKey: ['admin-reports'] });
      qc.invalidateQueries({ queryKey: ['admin-analytics'] });
    },
    onError: () => toast.error(t('failedToResolve')),
  });

  if (isLoading) return <Spinner size="lg" className="mx-auto my-12" />;

  return (
    <div className="space-y-4">
      {!reports?.length ? (
        <EmptyState
          icon={<ShieldAlert size={48} className="text-surface-300" />}
          title={t('noReports')}
          description={t('everythingClear')}
        />
      ) : (
        reports.map((r) => (
          <div key={r.id} className="card p-5 flex flex-col md:flex-row justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Badge variant={r.status === 'OPEN' ? 'danger' : 'gray'}>
                  {r.status}
                </Badge>
                <span className="text-xs text-surface-400">{timeAgo(r.createdAt)}</span>
              </div>
              <h4 className="font-semibold text-surface-900">
                {t('reportedListing')}{' '}
                <a
                  href={`/listing/${r.listingId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:underline"
                >
                  {r.listing?.title}
                </a>
              </h4>
              <p className="text-sm font-semibold text-danger-500">
                {t('reasonLabel')} {r.reason.replace('_', ' ')}
              </p>
              {r.details && (
                <p className="text-sm bg-surface-50 p-3 rounded-xl border italic">
                  "{r.details}"
                </p>
              )}
              <p className="text-xs text-surface-400">
                {t('reportedBy')} {r.reporter?.name} ({r.reporter?.email})
              </p>
            </div>
            {r.status === 'OPEN' && (
              <div className="flex md:flex-col justify-end gap-2 shrink-0">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => updateReportStatus({ id: r.id, status: 'RESOLVED' })}
                >
                  {t('resolve')}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => updateReportStatus({ id: r.id, status: 'DISMISSED' })}
                >
                  {t('dismiss')}
                </Button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};

const AdminDashboard = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('stats');

  const { data: stats } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: () => adminAPI.getAnalytics().then((r) => r.data.data),
  });

  return (
    <div className="min-h-screen bg-surface-50 font-sans">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="font-display font-bold text-2xl sm:text-3xl text-surface-900 tracking-tight">
              {t('adminCenter')}
            </h1>
            <p className="text-surface-500 text-sm mt-1">
              {t('verifyModerate')}
            </p>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-surface-200 gap-4 sm:gap-6 mb-6 sm:mb-8 overflow-x-auto no-scrollbar">
          {[
            { key: 'stats', label: t('overview'), icon: BarChart3 },
            { key: 'users', label: t('users'), icon: Users },
            { key: 'listings', label: t('listingsTab'), icon: Home },
            { key: 'reports', label: t('reports'), icon: ShieldAlert },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 pb-4 text-sm font-semibold border-b-2 transition-all shrink-0 ${
                  activeTab === tab.key
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-surface-400 hover:text-surface-900'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Render Tab Contents */}
        {activeTab === 'stats' && <StatsView stats={stats} />}
        {activeTab === 'users' && <UserManagement />}
        {activeTab === 'listings' && <ListingManagement />}
        {activeTab === 'reports' && <ReportManagement />}
      </div>
    </div>
  );
};

export default AdminDashboard;
