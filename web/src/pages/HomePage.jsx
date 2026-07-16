// HomePage — Liquid glass design, floating blobs, aurora backgrounds
import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Search, MapPin, Home, Users, BedDouble, LandPlot, SlidersHorizontal,
  ArrowRight, Sparkles, Shield, Building2, Star, TrendingUp, Zap,
} from 'lucide-react';
import { listingsAPI } from '../services/endpoints';
import ListingCard from '../components/listing/ListingCard';
import Navbar from '../components/layout/Navbar';

const CATEGORIES = [
  { type: '', label: 'All', icon: SlidersHorizontal, color: 'from-surface-500 to-surface-600' },
  { type: 'HOUSE_RENTAL', label: 'Houses', icon: Home, color: 'from-primary-500 to-primary-600' },
  { type: 'ROOM_SHARING', label: 'Rooms', icon: Users, color: 'from-accent-500 to-accent-600' },
  { type: 'HOSTEL', label: 'Hostels', icon: BedDouble, color: 'from-emerald-500 to-emerald-600' },
  { type: 'LAND_SALE', label: 'Land', icon: LandPlot, color: 'from-amber-500 to-amber-600' },
];

const CITIES = ['Hyderabad', 'Bangalore', 'Mumbai', 'Pune', 'Delhi', 'Chennai'];

function SkeletonCard({ index }) {
  return (
    <div
      className="glass-card overflow-hidden"
      style={{ animation: `slide-up 0.4s cubic-bezier(0.16,1,0.3,1) ${index * 60}ms both` }}
    >
      <div className="aspect-[4/3] skeleton" />
      <div className="p-4 space-y-3">
        <div className="h-5 skeleton w-1/3 rounded-lg" />
        <div className="h-4 skeleton w-3/4 rounded-lg" />
        <div className="h-3 skeleton w-1/2 rounded-lg" />
        <div className="flex gap-2 pt-2">
          <div className="h-3 skeleton w-16 rounded-lg" />
          <div className="h-3 skeleton w-12 rounded-lg" />
        </div>
        <div className="border-t border-white/20 pt-3 mt-2 flex items-center gap-2">
          <div className="w-7 h-7 skeleton rounded-full" />
          <div className="h-3 skeleton w-20 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const [searchCity, setSearchCity] = useState('');
  const [activeType, setActiveType] = useState('');
  const [page, setPage] = useState(1);
  const [heroVisible, setHeroVisible] = useState(false);
  const loaderRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => setHeroVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

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

  useEffect(() => { setPage(1); }, [activeType]);

  useEffect(() => {
    if (!loaderRef.current) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting && listings.length >= 12 && !isFetching) setPage((p) => p + 1); },
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

      {/* HERO — Liquid glass with aurora */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-500 to-accent-500 animate-aurora" />
        <div className="absolute top-10 left-[10%] w-48 sm:w-72 h-48 sm:h-72 bg-white/10 rounded-full blur-3xl animate-liquid-float" />
        <div className="absolute bottom-10 right-[15%] w-40 sm:w-64 h-40 sm:h-64 bg-accent-300/20 rounded-full blur-3xl animate-liquid-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 sm:w-96 h-64 sm:h-96 bg-primary-300/15 rounded-full blur-[80px] sm:blur-[100px] animate-liquid-float" style={{ animationDelay: '4s' }} />
        <div className="absolute -top-16 sm:-top-20 -right-16 sm:-right-20 w-56 sm:w-80 h-56 sm:h-80 bg-white/5 animate-morph" />

        <div className={`relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12 pb-10 sm:pb-14 transition-all duration-700 ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <div className="text-center mb-6 sm:mb-8">
            <div className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full glass text-white text-[11px] sm:text-xs font-medium mb-4">
              <Sparkles size={12} />
              India&#39;s Fastest Growing Room Finder
            </div>
            <h1 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl tracking-tight text-white mb-3">
              Find your next<br />
              <span className="text-white/90">home, effortlessly</span>
            </h1>
            <p className="text-white/70 text-sm sm:text-base max-w-md mx-auto">
              Verified rentals, shared rooms, and hostels across India. No brokers.
            </p>
          </div>

          {/* Liquid glass search panel */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
            <div className="glass-strong rounded-3xl p-3">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-500" />
                  <input
                    type="text"
                    value={searchCity}
                    onChange={(e) => setSearchCity(e.target.value)}
                    placeholder="Which city are you looking in?"
                    className="w-full pl-11 pr-4 py-3.5 bg-white/80 border border-white/40 rounded-2xl text-sm text-surface-900 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-white/50 focus:bg-white transition-all duration-200"
                  />
                </div>
                <button type="submit" className="btn-primary px-5 sm:px-7 py-3.5 rounded-2xl text-sm font-semibold shrink-0 ripple-container shadow-lg">
                  <Search size={16} />
                  Search
                </button>
              </div>
            </div>
          </form>

          {/* Category chips */}
          <div className="flex items-center justify-center gap-2 mt-5 flex-wrap">
            {CATEGORIES.map(({ type, label, icon: Icon }) => (
              <button
                key={type}
                onClick={() => navigate(type ? `/search?type=${type}` : '/search')}
                className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-300 ${
                  activeType === type
                    ? 'glass-strong text-primary-700 shadow-lg'
                    : 'glass text-white/80 hover:text-white hover:bg-white/20'
                }`}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* CATEGORY CARDS — Floating glass */}
      <section className="relative -mt-6 z-20 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 stagger-children">
          {CATEGORIES.filter((c) => c.type).map(({ type, label, icon: Icon, color }) => (
            <Link
              key={type}
              to={`/search?type=${type}`}
              className="glass-card glass-shimmer glass-glow p-5 flex flex-col items-center gap-3 text-center group"
            >
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                <Icon size={22} />
              </div>
              <div>
                <p className="text-sm font-semibold text-surface-800">{label}</p>
                <p className="text-xs text-surface-400 mt-0.5">Browse all</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* LISTINGS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-display font-bold text-lg text-surface-900">
              {activeType ? CATEGORIES.find((c) => c.type === activeType)?.label : 'Latest Listings'}
            </h2>
            <p className="text-xs text-surface-400 mt-0.5">
              {isLoading ? <span className="inline-block h-3 w-16 skeleton rounded" /> : `${listings.length} listings found`}
            </p>
          </div>
          <Link to="/search" className="flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors">
            View all <ArrowRight size={12} />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} index={i} />)
            : listings.map((listing, i) => (
                <div key={listing.id} style={{ animation: `slide-up 0.4s cubic-bezier(0.16,1,0.3,1) ${i * 50}ms both` }}>
                  <ListingCard listing={listing} />
                </div>
              ))
          }
        </div>

        {!isLoading && listings.length === 0 && (
          <div className="text-center py-20 animate-fade-in">
            <Building2 size={48} className="mx-auto mb-4 text-surface-200" />
            <p className="text-surface-500 font-medium">No listings found</p>
            <p className="text-surface-400 text-sm mt-1">Try a different category or city</p>
          </div>
        )}

        <div ref={loaderRef} className="h-12 flex items-center justify-center">
          {isFetching && !isLoading && (
            <div className="flex items-center gap-3 text-sm text-surface-400 animate-fade-in">
              <div className="w-5 h-5 border-2 border-primary-400 border-t-transparent rounded-full animate-spin-slow" />
              Loading more...
            </div>
          )}
        </div>
      </section>

      {/* TRUST BAR — Glass panel */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-6">
        <div className="glass-tinted rounded-3xl p-6 sm:p-8">
          <div className="grid grid-cols-3 gap-2 sm:gap-4 stagger-children">
            {[
              { Icon: Shield, value: '100%', label: 'Verified Owners' },
              { Icon: Star, value: '0%', label: 'Brokerage Fee' },
              { Icon: TrendingUp, value: '500+', label: 'Active Listings' },
            ].map(({ Icon, value, label }) => (
              <div key={label} className="flex items-center gap-2 sm:gap-3 justify-center sm:justify-start">
                <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-white/60 flex items-center justify-center shrink-0 shadow-sm">
                  <Icon size={16} className="text-primary-500 sm:text-primary-500" />
                </div>
                <div>
                  <p className="font-display font-bold text-sm sm:text-lg text-surface-900 leading-tight">{value}</p>
                  <p className="text-[10px] sm:text-xs text-surface-500">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CITIES — Glass pills */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-6">
        <h3 className="font-display font-bold text-sm text-surface-900 mb-3">Explore by City</h3>
        <div className="flex flex-wrap gap-2 stagger-children">
          {CITIES.map((city) => (
            <button
              key={city}
              onClick={() => navigate(`/search?city=${encodeURIComponent(city)}`)}
              className="glass-card px-5 py-2.5 rounded-2xl text-sm font-medium text-surface-700 hover:text-primary-600 transition-all duration-200 cursor-pointer"
            >
              {city}
            </button>
          ))}
        </div>
      </section>

      {/* CTA — Dark glass */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-10">
        <div className="glass-dark rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-white">
          <div className="text-center sm:text-left">
            <h3 className="font-display font-bold text-lg">Own a property?</h3>
            <p className="text-white/60 text-sm">List it for free. Reach verified tenants.</p>
          </div>
          <Link to="/register" className="btn bg-white/90 text-surface-900 hover:bg-white px-6 py-2.5 rounded-2xl text-sm font-semibold shrink-0 ripple-container shadow-lg w-full sm:w-auto text-center">
            Post Free Listing
          </Link>
        </div>
      </section>

      <footer className="border-t border-surface-100 py-6 px-4 text-center text-xs text-surface-400 bg-white">
        <p>&copy; {new Date().getFullYear()} Houziee &middot; Made with care in India</p>
      </footer>
    </div>
  );
}
