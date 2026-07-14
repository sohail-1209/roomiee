import { useQuery } from '@tanstack/react-query';
import {
  BarChart2, Eye, TrendingUp, DollarSign, List,
  Calendar, CheckCircle, Clock
} from 'lucide-react';
import { listingsAPI, requestsAPI } from '../../services/endpoints';
import PageHeader from '../../components/layout/PageHeader';

const StatCard = ({ label, value, description, icon: Icon, color }) => (
  <div className="card p-5 flex items-center justify-between gap-4">
    <div className="space-y-1">
      <p className="text-sm font-medium text-surface-400">{label}</p>
      <p className="text-2xl font-bold text-surface-900 font-display">{value}</p>
      {description && <p className="text-xs text-surface-400">{description}</p>}
    </div>
    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color} text-white`}>
      <Icon size={22} />
    </div>
  </div>
);

export default function AnalyticsPage() {
  const { data: listings, isLoading: listingsLoading } = useQuery({
    queryKey: ['myListings'],
    queryFn: () => listingsAPI.getMyListings().then((r) => r.data.data),
  });

  const { data: requests, isLoading: requestsLoading } = useQuery({
    queryKey: ['requests'],
    queryFn: () => requestsAPI.getAll().then((r) => r.data.data),
  });

  const isLoading = listingsLoading || requestsLoading;

  const totalListings = listings?.length || 0;
  const totalViews = listings?.reduce((acc, l) => acc + (l.views ?? 0), 0) || 0;
  const activeListings = listings?.filter((l) => l.status === 'ACTIVE').length || 0;
  
  const avgRent = totalListings > 0
    ? Math.round(listings.reduce((acc, l) => acc + l.rent, 0) / totalListings)
    : 0;

  const totalRequests = requests?.length || 0;
  const pendingRequests = requests?.filter((r) => r.status === 'PENDING').length || 0;
  const acceptedRequests = requests?.filter((r) => r.status === 'ACCEPTED').length || 0;

  // Max views for bar chart scaling
  const maxViews = listings?.length ? Math.max(...listings.map((l) => l.views ?? 0), 1) : 1;

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <PageHeader title="Analytics" subtitle="Performance stats for your listings" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map((i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 skeleton h-80 rounded-2xl" />
          <div className="skeleton h-80 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
      <PageHeader title="Analytics" subtitle="Performance stats and trends for your listings" />

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Views"
          value={totalViews.toLocaleString('en-IN')}
          description="Across all your listings"
          icon={Eye}
          color="bg-primary-600 shadow-lg shadow-primary-500/20"
        />
        <StatCard
          label="My Listings"
          value={totalListings}
          description={`${activeListings} active listings`}
          icon={List}
          color="bg-info-500 shadow-lg shadow-info-500/20"
        />
        <StatCard
          label="Avg. Rent"
          value={`₹${avgRent.toLocaleString('en-IN')}`}
          description="Average monthly rent set"
          icon={DollarSign}
          color="bg-success-500 shadow-lg shadow-success-500/20"
        />
        <StatCard
          label="Total Requests"
          value={totalRequests}
          description={`${pendingRequests} pending verification`}
          icon={TrendingUp}
          color="bg-accent-500 shadow-lg shadow-accent-500/20"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Views Bar Chart */}
        <div className="card p-6 lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display font-semibold text-lg text-surface-900">Traffic Breakdown</h3>
              <p className="text-xs text-surface-400 mt-0.5">Views per listing</p>
            </div>
            <BarChart2 className="text-surface-400" size={20} />
          </div>

          {!listings?.length ? (
            <div className="h-60 flex flex-col items-center justify-center text-surface-400">
              <span className="text-3xl mb-2">📊</span>
              <p className="text-sm font-medium">No listings found to analyze</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[280px] overflow-y-auto pr-1">
              {listings.map((l) => {
                const percentage = Math.max(Math.round(((l.views ?? 0) / maxViews) * 100), 2);
                return (
                  <div key={l.id} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs font-medium">
                      <span className="text-surface-700 truncate max-w-[80%]">{l.title}</span>
                      <span className="text-surface-900 font-bold">{l.views ?? 0} views</span>
                    </div>
                    <div className="h-2.5 w-full bg-surface-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary-600 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Requests Funnel */}
        <div className="card p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display font-semibold text-lg text-surface-900">Request Status</h3>
              <p className="text-xs text-surface-400 mt-0.5">Conversion funnel</p>
            </div>
            <TrendingUp className="text-surface-400" size={20} />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-surface-50 rounded-xl">
              <div className="flex items-center gap-3">
                <Clock className="text-warning-500" size={18} />
                <span className="text-sm font-medium text-surface-700">Pending</span>
              </div>
              <span className="text-lg font-bold text-surface-900">{pendingRequests}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-surface-50 rounded-xl">
              <div className="flex items-center gap-3">
                <CheckCircle className="text-success-500" size={18} />
                <span className="text-sm font-medium text-surface-700">Accepted</span>
              </div>
              <span className="text-lg font-bold text-surface-900">{acceptedRequests}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-surface-50 rounded-xl">
              <div className="flex items-center gap-3">
                <Calendar className="text-primary-500" size={18} />
                <span className="text-sm font-medium text-surface-700">Total</span>
              </div>
              <span className="text-lg font-bold text-surface-900">{totalRequests}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
