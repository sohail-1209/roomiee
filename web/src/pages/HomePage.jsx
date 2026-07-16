// HomePage — main landing page for Houziee
import React, { useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Search, MapPin, Home, Users, ArrowRight, ChevronLeft, ChevronRight,
  Star, Shield, Zap, CheckCircle, TrendingUp, Building2, BedDouble, LandPlot,
} from 'lucide-react';
import { listingsAPI } from '../services/endpoints';
import ListingCard from '../components/listing/ListingCard';
import Navbar from '../components/layout/Navbar';
import { sessionCache } from '../utils/sessionCache';

const CITIES = [
  { name: 'Hyderabad', emoji: '🌆', count: '120+', bg: 'from-primary-500/10 to-primary-600/5' },
  { name: 'Bangalore', emoji: '🌳', count: '180+', bg: 'from-emerald-500/10 to-emerald-600/5' },
  { name: 'Mumbai',    emoji: '🌊', count: '95+',  bg: 'from-accent-500/10 to-accent-600/5' },
  { name: 'Pune',      emoji: '🏛️', count: '60+',  bg: 'from-amber-500/10 to-amber-600/5' },
  { name: 'Delhi',     emoji: '🕌', count: '75+',  bg: 'from-rose-500/10 to-rose-600/5' },
  { name: 'Chennai',   emoji: '🌴', count: '50+',  bg: 'from-teal-500/10 to-teal-600/5' },
];

const HOW_IT_WORKS = [
  {
    step: '01',
    Icon: Search,
    title: 'Search',
    desc: 'Browse thousands of verified rooms and houses across India. Filter by city, budget, and amenities.',
    color: 'text-primary-600 bg-primary-50',
  },
  {
    step: '02',
    Icon: Zap,
    title: 'Request',
    desc: 'Send a rental request to the owner directly. Get their contact once they accept.',
    color: 'text-accent-600 bg-accent-50',
  },
  {
    step: '03',
    Icon: CheckCircle,
    title: 'Move In',
    desc: 'Visit the place, sign the deal, and move into your perfect new home — hassle free.',
    color: 'text-success-600 bg-success-50',
  },
];

const STATS = [
  { value: '500+', label: 'Listings Goal', Icon: Building2 },
  { value: '10+', label: 'Cities Target',   Icon: MapPin },
  { value: '100%', label: 'Free to Use', Icon: Star },
];

const HScrollRow = ({ children, isLoading, skeletonCount = 4 }) => {
  const scrollRef = useRef(null);

  const scroll = (dir) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir * 300, behavior: 'smooth' });
  };

  if (isLoading) {
    return (
      <div className="flex gap-5 overflow-hidden">
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <div key={i} className="card flex-none w-72 overflow-hidden">
            <div className="skeleton aspect-[4/3] w-full" />
            <div className="p-4 flex flex-col gap-3">
              <div className="skeleton h-6 w-2/5 rounded-lg" />
              <div className="skeleton h-4 w-4/5 rounded-lg" />
              <div className="skeleton h-3 w-3/5 rounded-lg" />
              <div className="skeleton h-9 w-full rounded-xl mt-2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="relative group/scroll">
      <button
        onClick={() => scroll(-1)}
        className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm shadow-soft border border-surface-200/60 flex items-center justify-center text-surface-600 hover:text-primary-600 hover:border-primary-300 transition-all opacity-0 group-hover/scroll:opacity-100 focus:opacity-100"
        aria-label="Scroll left"
      >
        <ChevronLeft size={18} />
      </button>

      <div
        ref={scrollRef}
        className="flex gap-5 overflow-x-auto pb-3 scroll-smooth"
        style={{ scrollbarWidth: 'none' }}
      >
        {children}
      </div>

      <button
        onClick={() => scroll(1)}
        className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm shadow-soft border border-surface-200/60 flex items-center justify-center text-surface-600 hover:text-primary-600 hover:border-primary-300 transition-all opacity-0 group-hover/scroll:opacity-100 focus:opacity-100"
        aria-label="Scroll right"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
};

const ScrollCard = ({ listing }) => (
  <div className="flex-none w-72">
    <ListingCard listing={listing} />
  </div>
);

export default function HomePage() {
  const navigate = useNavigate();
  const [city, setCity] = useState('');
  const [listingType, setListingType] = useState('ALL');

  const { data: houseData, isLoading: houseLoading } = useQuery({
    queryKey: ['home-house-listings'],
    queryFn: async () => {
      const res = await listingsAPI.getAll({ type: 'HOUSE_RENTAL', limit: 6 });
      const data = res.data?.data ?? res.data ?? [];
      sessionCache.set('home-house', data, 10 * 60 * 1000);
      return data;
    },
    initialData: () => sessionCache.get('home-house') ?? undefined,
    select: (data) => data ?? [],
    staleTime: 1000 * 60 * 5,
  });

  const { data: roomData, isLoading: roomLoading } = useQuery({
    queryKey: ['home-room-listings'],
    queryFn: async () => {
      const res = await listingsAPI.getAll({ type: 'ROOM_SHARING', limit: 6 });
      const data = res.data?.data ?? res.data ?? [];
      sessionCache.set('home-room', data, 10 * 60 * 1000);
      return data;
    },
    initialData: () => sessionCache.get('home-room') ?? undefined,
    select: (data) => data ?? [],
    staleTime: 1000 * 60 * 5,
  });

  const { data: hostelData, isLoading: hostelLoading } = useQuery({
    queryKey: ['home-hostel-listings'],
    queryFn: async () => {
      const res = await listingsAPI.getAll({ type: 'HOSTEL', limit: 6 });
      const data = res.data?.data ?? res.data ?? [];
      sessionCache.set('home-hostel', data, 10 * 60 * 1000);
      return data;
    },
    initialData: () => sessionCache.get('home-hostel') ?? undefined,
    select: (data) => data ?? [],
    staleTime: 1000 * 60 * 5,
  });

  const { data: landData, isLoading: landLoading } = useQuery({
    queryKey: ['home-land-listings'],
    queryFn: async () => {
      const res = await listingsAPI.getAll({ type: 'LAND_SALE', limit: 6 });
      const data = res.data?.data ?? res.data ?? [];
      sessionCache.set('home-land', data, 10 * 60 * 1000);
      return data;
    },
    initialData: () => sessionCache.get('home-land') ?? undefined,
    select: (data) => data ?? [],
    staleTime: 1000 * 60 * 5,
  });

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (city) params.set('city', city);
    if (listingType !== 'ALL') params.set('type', listingType);
    navigate(`/search?${params.toString()}`);
  };

  const handleCityClick = (cityName) => {
    navigate(`/search?city=${encodeURIComponent(cityName)}`);
  };

  return (
    <div className="min-h-screen bg-surface-50">
      <Navbar />

      {/* ═══════════════════════════════════════════════════════════════════
          HERO SECTION
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary-50/50 via-surface-50 to-surface-50 pt-8 pb-20 sm:pt-12 sm:pb-28">

        {/* Subtle dot grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'radial-gradient(circle, #0d9488 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        {/* Gradient orbs */}
        <div className="pointer-events-none absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-primary-400/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 w-[400px] h-[400px] rounded-full bg-accent-400/10 blur-3xl" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 badge bg-primary-100/80 text-primary-700 px-4 py-1.5 text-sm font-medium mb-6">
            <TrendingUp size={14} />
            India's Fastest Growing Room Finder
          </div>

          {/* Headline */}
          <h1 className="font-display font-bold text-4xl sm:text-5xl lg:text-6xl leading-[1.1] tracking-tight text-surface-900 mb-5">
            Find Your{' '}
            <span className="gradient-text">Perfect Room</span>
            <br />
            in India
          </h1>

          {/* Subheadline */}
          <p className="text-surface-500 text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Thousands of verified house rentals and shared rooms across
            Hyderabad, Bangalore, Mumbai &amp; more — no broker fees.
          </p>

          {/* Search bar */}
          <form
            onSubmit={handleSearch}
            className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto"
          >
            <div className="relative flex-1">
              <MapPin
                size={17}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary-400 pointer-events-none"
              />
              <input
                type="text"
                className="input pl-10 pr-4 h-12 text-sm shadow-soft"
                placeholder="Enter city — Hyderabad, Bangalore..."
                value={city}
                onChange={(e) => setCity(e.target.value)}
                aria-label="City"
              />
            </div>

            <div className="flex rounded-xl border border-surface-200 bg-white p-1 gap-1 shrink-0">
              {[
                { value: 'ALL',          label: 'All',     Ic: null },
                { value: 'HOUSE_RENTAL', label: 'House',   Ic: Home },
                { value: 'ROOM_SHARING', label: 'Room',    Ic: Users },
                { value: 'HOSTEL',       label: 'Hostel',  Ic: BedDouble },
                { value: 'LAND_SALE',    label: 'Land',    Ic: LandPlot },
              ].map(({ value, label, Ic }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setListingType(value)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    listingType === value
                      ? 'bg-primary-50 text-primary-700 shadow-sm border border-primary-200/60'
                      : 'text-surface-500 hover:text-surface-700 hover:bg-surface-50'
                  }`}
                >
                  {Ic && <Ic size={14} />}
                  {label}
                </button>
              ))}
            </div>

            <button type="submit" className="btn-primary btn-lg shrink-0 h-12 px-6 shadow-glow-primary">
              <Search size={18} />
              Search
            </button>
          </form>

          {/* Quick picks */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-sm text-surface-500">
            <span>Popular:</span>
            {['Hyderabad', 'Bangalore', 'Mumbai', 'Pune'].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => handleCityClick(c)}
                className="badge bg-surface-100 text-surface-600 hover:bg-primary-50 hover:text-primary-700 transition-colors cursor-pointer"
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          MISSION + STATS BAR
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-12 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center mb-8">
          <h2 className="font-display font-bold text-2xl sm:text-3xl text-surface-900 mb-3">
            We aim to make finding a home <span className="gradient-text">effortless</span>
          </h2>
          <p className="text-surface-500 text-sm sm:text-base max-w-xl mx-auto">
            No brokers, no hidden fees. Connect directly with owners, compare options, and move into your next home with confidence.
          </p>
        </div>
        <div className="gradient-bg py-6 rounded-2xl shadow-soft-lg">
          <div className="max-w-4xl mx-auto px-4">
            <p className="text-white/50 text-xs text-center mb-4 font-medium tracking-wide uppercase">Our Targets</p>
            <div className="grid grid-cols-3 divide-x divide-white/20">
              {STATS.map(({ value, label, Icon }) => (
                <div key={label} className="flex flex-col items-center gap-1 text-white px-4">
                  <Icon size={20} className="opacity-80" />
                  <span className="font-display font-bold text-2xl sm:text-3xl">{value}</span>
                  <span className="text-white/70 text-xs sm:text-sm font-medium">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          POPULAR CITIES
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-16 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="section-title">Popular Cities</h2>
            <p className="section-subtitle">Explore rentals in India's top cities</p>
          </div>
          <Link
            to="/search"
            className="btn-ghost btn-sm gap-1.5 text-primary-600 hidden sm:flex"
          >
            View all <ArrowRight size={15} />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {CITIES.map(({ name, emoji, count, bg }) => (
            <button
              key={name}
              type="button"
              onClick={() => handleCityClick(name)}
              className={`card card-hover group p-5 flex flex-col items-center gap-2 text-center bg-gradient-to-br ${bg} border-0 cursor-pointer`}
            >
              <span className="text-3xl group-hover:scale-110 transition-transform duration-200 select-none">
                {emoji}
              </span>
              <span className="font-semibold text-surface-800 text-sm">{name}</span>
              <span className="badge bg-surface-100 text-surface-500 text-xs">{count} listings</span>
            </button>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          FEATURED HOUSE RENTALS
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-12 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="section-title flex items-center gap-2">
              <Home size={22} className="text-primary-500" />
              Featured House Rentals
            </h2>
            <p className="section-subtitle">Fully verified homes ready to move in</p>
          </div>
          <Link
            to="/search?type=HOUSE_RENTAL"
            className="btn-outline btn-sm gap-1.5 hidden sm:flex"
          >
            View all <ArrowRight size={15} />
          </Link>
        </div>

        <HScrollRow isLoading={houseLoading} skeletonCount={4}>
          {(houseData ?? []).map((listing) => (
            <ScrollCard key={listing.id} listing={listing} />
          ))}
          {!houseLoading && houseData?.length > 0 && (
            <div className="flex-none w-52 flex items-center justify-center">
              <Link
                to="/search?type=HOUSE_RENTAL"
                className="btn-outline btn-md flex-col gap-2 h-auto py-6 px-8 text-center"
              >
                <ArrowRight size={20} className="text-primary-500" />
                <span className="text-sm font-medium">See all<br />House Rentals</span>
              </Link>
            </div>
          )}
        </HScrollRow>

        <div className="mt-5 sm:hidden text-center">
          <Link to="/search?type=HOUSE_RENTAL" className="btn-outline btn-md gap-2">
            See all House Rentals <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          ROOM SHARING
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-12 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="section-title flex items-center gap-2">
              <Users size={22} className="text-accent-500" />
              Room Sharing
            </h2>
            <p className="section-subtitle">Affordable shared spaces with great roommates</p>
          </div>
          <Link
            to="/search?type=ROOM_SHARING"
            className="btn-outline btn-sm gap-1.5 hidden sm:flex"
          >
            View all <ArrowRight size={15} />
          </Link>
        </div>

        <HScrollRow isLoading={roomLoading} skeletonCount={4}>
          {(roomData ?? []).map((listing) => (
            <ScrollCard key={listing.id} listing={listing} />
          ))}
          {!roomLoading && roomData?.length > 0 && (
            <div className="flex-none w-52 flex items-center justify-center">
              <Link
                to="/search?type=ROOM_SHARING"
                className="btn-outline btn-md flex-col gap-2 h-auto py-6 px-8 text-center"
              >
                <ArrowRight size={20} className="text-accent-500" />
                <span className="text-sm font-medium">See all<br />Room Sharing</span>
              </Link>
            </div>
          )}
        </HScrollRow>

        <div className="mt-5 sm:hidden text-center">
          <Link to="/search?type=ROOM_SHARING" className="btn-outline btn-md gap-2">
            See all Room Sharing <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          HOSTELS / PG
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-12 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="section-title flex items-center gap-2">
              <BedDouble size={22} className="text-primary-500" />
              Hostels & PGs
            </h2>
            <p className="section-subtitle">Affordable shared accommodation with flexible tiers</p>
          </div>
          <Link
            to="/search?type=HOSTEL"
            className="btn-outline btn-sm gap-1.5 hidden sm:flex"
          >
            View all <ArrowRight size={15} />
          </Link>
        </div>

        <HScrollRow isLoading={hostelLoading} skeletonCount={4}>
          {(hostelData ?? []).map((listing) => (
            <ScrollCard key={listing.id} listing={listing} />
          ))}
          {!hostelLoading && hostelData?.length > 0 && (
            <div className="flex-none w-52 flex items-center justify-center">
              <Link
                to="/search?type=HOSTEL"
                className="btn-outline btn-md flex-col gap-2 h-auto py-6 px-8 text-center"
              >
                <ArrowRight size={20} className="text-primary-500" />
                <span className="text-sm font-medium">See all<br />Hostels & PGs</span>
              </Link>
            </div>
          )}
        </HScrollRow>

        <div className="mt-5 sm:hidden text-center">
          <Link to="/search?type=HOSTEL" className="btn-outline btn-md gap-2">
            See all Hostels & PGs <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          LAND FOR SALE
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-16 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-surface-900 font-display flex items-center gap-2">
                <LandPlot size={24} className="text-amber-500" /> Land for Sale
              </h2>
              <p className="text-surface-500 text-sm mt-1">Plots and land available for purchase</p>
            </div>
            <Link to="/search?type=LAND_SALE" className="hidden sm:flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700">
              View all <ArrowRight size={15} />
            </Link>
          </div>

          {landLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="card animate-pulse h-80" />
              ))}
            </div>
          ) : (landData ?? []).length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {(landData ?? []).slice(0, 6).map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-surface-400">
              <LandPlot size={40} className="mx-auto mb-3 opacity-50" />
              <p>No land listings yet. Check back soon!</p>
            </div>
          )}

          <div className="mt-5 sm:hidden text-center">
            <Link to="/search?type=LAND_SALE" className="btn-outline btn-md gap-2">
              See all Land for Sale <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          HOW IT WORKS
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-20 px-4 sm:px-6 bg-surface-50/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="section-title text-3xl sm:text-4xl">How Houziee Works</h2>
            <p className="section-subtitle mt-2 text-base max-w-xl mx-auto">
              Find your perfect room in 3 simple steps — no broker, no hidden fees.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 relative">
            <div className="hidden sm:block absolute top-12 left-[calc(16.67%+1rem)] right-[calc(16.67%+1rem)] h-px bg-gradient-to-r from-primary-200 via-accent-200 to-success-200 z-0" />

            {HOW_IT_WORKS.map(({ step, Icon, title, desc, color }) => (
              <div key={step} className="relative z-10 flex flex-col items-center text-center gap-4">
                <span className="absolute -top-3 -right-2 sm:static sm:mb-0 font-display font-bold text-5xl text-surface-100 select-none leading-none z-0">
                  {step}
                </span>
                <div className={`relative w-20 h-20 rounded-2xl flex items-center justify-center shadow-soft ${color} z-10 mx-auto`}>
                  <Icon size={32} strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg text-surface-900 mb-1">{title}</h3>
                  <p className="text-surface-500 text-sm leading-relaxed max-w-xs mx-auto">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-14">
            <Link to="/search" className="btn-primary btn-lg gap-2 shadow-glow-primary">
              <Search size={18} />
              Start Searching Now
            </Link>
            <p className="mt-3 text-xs text-surface-400 flex items-center justify-center gap-1">
              <Shield size={12} className="text-success-500" />
              100% verified listings · No broker fees
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          FOOTER CTA BAND
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="gradient-bg py-16 px-4 text-center text-white">
        <h2 className="font-display font-bold text-3xl sm:text-4xl mb-3 leading-tight">
          Are you a Property Owner?
        </h2>
        <p className="text-white/80 mb-8 max-w-md mx-auto">
          List your property for free and reach thousands of verified tenants across India.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/register"
            className="btn bg-white text-primary-700 hover:bg-white/90 btn-lg shadow-xl font-semibold"
          >
            Post a Listing — It's Free
          </Link>
          <Link
            to="/search"
            className="btn border-2 border-white/30 text-white hover:bg-white/10 btn-lg font-semibold"
          >
            Browse Listings
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-surface-900 text-surface-400 text-center py-6 text-sm">
        &copy; {new Date().getFullYear()} Houziee &middot; Made with care in India
      </footer>
    </div>
  );
}
