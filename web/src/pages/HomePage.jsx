// HomePage — search-first, listings immediately visible, minimal scroll
import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Search, MapPin, Home, Users, BedDouble, LandPlot, SlidersHorizontal,
  ArrowRight, Sparkles, Shield, Building2, Star,
} from 'lucide-react';
import { listingsAPI } from '../services/endpoints';
import ListingCard from '../components/listing/ListingCard';
import Navbar from '../components/layout/Navbar';
import { sessionCache } from '../utils/sessionCache';

const CATEGORIES = [
  { type: '', label: 'All', icon: SlidersHorizontal },
  { type: 'HOUSE_RENTAL', label: 'Houses', icon: Home },
  { type: 'ROOM_SHARING', label: 'Rooms', icon: Users },
  { type: 'HOSTEL', label: 'Hostels', icon: BedDouble },
  { type: 'LAND_SALE', label: 'Land', icon: LandPlot },
];

const CITIES = ['Hyderabad', 'Bangalore', 'Mumbai', 'Pune', 'Delhi', 'Chennai'];

export default function HomePage() {
  const navigate = useNavigate();
  const [searchCity, setSearchCity] = useState('');
  const [activeType, setActiveType] = useState('');
  const [page, setPage] = useState(1);
  const loaderRef = useRef(null);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['home-listings', activeType, page],
    queryFn: async () => {
      const params = { page, limit: 12 };
      if (activeType) params.type = activeType;
      const res = await listingsAPI.getAll(params);
      return res.data?.data ?? res.data ?? [];
    },
    placeholderData: (prev) => prev,
  });

  const listings = Array.isArray(data) ? data : data?.listings ?? [];

  useEffect(() => {
    setPage(1);
  }, [activeType]);

  useEffect(() => {
    if (!loaderRef.current) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && listings.length >= 12 && !isFetching) {
          setPage((p) => p + 1);
        }
      },
      { threshold: 0 }
    );
    obs.observe(loaderRef.current);
    return () => obs.disconnect();
  }, [listings.length, isFetching]);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchCity) params.set('city', searchCity);
    if (activeType) params.set('type', activeType);
    navigate(`/search?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-surface-50">
      <Navbar />

      {/* ═══ HERO — Compact, search-first ═══════════════════════════ */}
      <section className="relative bg-white border-b border-surface-100">
        <div className="absolute inset-0 bg-gradient-to-b from-primary-50/40 to-transparent pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-6">
          {/* Tagline */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-50 text-primary-600 text-xs font-medium mb-3">
              <Sparkles size={12} />
              India's Fastest Growing Room Finder
            </div>
            <h1 className="font-display font-extrabold text-3xl sm:text-4xl tracking-tight text-surface-900">
              Find your next home
            </h1>
          </div>

          {/* Search bar — wide, clean */}
          <form onSubmit={handleSearch} className="max-w-3xl mx-auto">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary-400" />
                <input
                  type="text"
                  value={searchCity}
                  onChange={(e) => setSearchCity(e.target.value)}
                  placeholder="Search by city, area, or landmark..."
                  className="w-full pl-10 pr-4 py-3 bg-surface-50 border border-surface-200 rounded-xl text-sm text-surface-900 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-all"
                />
              </div>
              <button type="submit" className="btn-primary px-6 py-3 rounded-xl text-sm font-semibold shrink-0">
                <Search size={16} />
                Search
              </button>
            </div>
          </form>

          {/* Category tabs — inline filter bar */}
          <div className="flex items-center gap-1.5 mt-4 max-w-3xl mx-auto overflow-x-auto no-scrollbar">
            {CATEGORIES.map(({ type, label, icon: Icon }) => (
              <button
                key={type}
                onClick={() => setActiveType(type)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                  activeType === type
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'bg-surface-100 text-surface-500 hover:bg-surface-200 hover:text-surface-700'
                }`}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>

          {/* Quick city links */}
          <div className="flex items-center justify-center gap-1.5 mt-3 text-xs text-surface-400">
            <span className="font-medium">Popular:</span>
            {CITIES.map((c, i) => (
              <span key={c} className="flex items-center gap-1.5">
                <button onClick={() => navigate(`/search?city=${encodeURIComponent(c)}`)} className="text-surface-500 hover:text-primary-600 font-medium transition-colors cursor-pointer">
                  {c}
                </button>
                {i < CITIES.length - 1 && <span className="text-surface-300">·</span>}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ LISTINGS — Immediate, no scroll gap ═══════════════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Header row */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-display font-bold text-lg text-surface-900">
              {activeType ? CATEGORIES.find((c) => c.type === activeType)?.label : 'All Listings'}
            </h2>
            <p className="text-xs text-surface-400 mt-0.5">
              {listings.length} listings found
            </p>
          </div>
          <Link to="/search" className="flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700">
            View all <ArrowRight size={12} />
          </Link>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="card animate-pulse">
                <div className="h-48 bg-surface-100 rounded-t-2xl" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-surface-100 rounded w-3/4" />
                  <div className="h-3 bg-surface-100 rounded w-1/2" />
                  <div className="h-3 bg-surface-100 rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : listings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <Building2 size={48} className="mx-auto mb-4 text-surface-200" />
            <p className="text-surface-500 font-medium">No listings found</p>
            <p className="text-surface-400 text-sm mt-1">Try a different category or city</p>
          </div>
        )}

        {/* Infinite scroll loader */}
        <div ref={loaderRef} className="h-10 flex items-center justify-center">
          {isFetching && (
            <div className="flex items-center gap-2 text-sm text-surface-400">
              <div className="w-4 h-4 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
              Loading more...
            </div>
          )}
        </div>
      </section>

      {/* ═══ TRUST BAR — Compact inline ════════════════════════════ */}
      <section className="border-t border-surface-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="grid grid-cols-3 gap-4">
            {[
              { Icon: Shield, value: '100%', label: 'Verified Owners' },
              { Icon: Star, value: '0%', label: 'Brokerage Fee' },
              { Icon: Building2, value: '500+', label: 'Active Listings' },
            ].map(({ Icon, value, label }) => (
              <div key={label} className="flex items-center gap-3 justify-center sm:justify-start">
                <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
                  <Icon size={18} className="text-primary-500" />
                </div>
                <div>
                  <p className="font-display font-bold text-lg text-surface-900 leading-tight">{value}</p>
                  <p className="text-xs text-surface-400">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CITIES — Compact row ══════════════════════════════════ */}
      <section className="border-t border-surface-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <h3 className="font-display font-bold text-sm text-surface-900 mb-3">Explore by City</h3>
          <div className="flex flex-wrap gap-2">
            {CITIES.map((city) => (
              <button
                key={city}
                onClick={() => navigate(`/search?city=${encodeURIComponent(city)}`)}
                className="px-4 py-2 rounded-xl bg-surface-50 border border-surface-100 text-sm font-medium text-surface-600 hover:border-primary-300 hover:text-primary-600 hover:bg-primary-50 transition-all cursor-pointer"
              >
                {city}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA — Compact ═════════════════════════════════════════ */}
      <section className="border-t border-surface-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="bg-surface-900 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-white">
            <div className="text-center sm:text-left">
              <h3 className="font-display font-bold text-lg">Own a property?</h3>
              <p className="text-surface-400 text-sm">List it for free. Reach verified tenants.</p>
            </div>
            <Link to="/register" className="btn bg-white text-surface-900 hover:bg-white/90 px-6 py-2.5 rounded-xl text-sm font-semibold shrink-0">
              Post Free Listing
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-surface-100 py-6 px-4 text-center text-xs text-surface-400 bg-white">
        <p>&copy; {new Date().getFullYear()} Houziee &middot; Made with care in India</p>
      </footer>
    </div>
  );
}
