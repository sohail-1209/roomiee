// HomePage — Lightest glass hero, proper spacing, animated trust bar
import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Search, MapPin, Home, Users, BedDouble, LandPlot, SlidersHorizontal,
  ArrowRight, Sparkles, Shield, Building2, Star, TrendingUp, Zap, CheckCircle,
} from 'lucide-react';
import { listingsAPI } from '../services/endpoints';
import ListingCard from '../components/listing/ListingCard';
import Navbar from '../components/layout/Navbar';
import InstallBanner from '../components/ui/InstallBanner';
import { useTranslation } from 'react-i18next';
import Spinner from '../components/ui/Spinner';

const CATEGORIES = [
  { type: '', label: 'All', tKey: 'all', icon: SlidersHorizontal, color: 'from-surface-500 to-surface-600' },
  { type: 'HOUSE_RENTAL', label: 'Houses', tKey: 'houses', icon: Home, color: 'from-primary-500 to-primary-600' },
  { type: 'ROOM_SHARING', label: 'Rooms', tKey: 'rooms', icon: Users, color: 'from-accent-500 to-accent-600' },
  { type: 'HOSTEL', label: 'Hostels', tKey: 'hostels', icon: BedDouble, color: 'from-emerald-500 to-emerald-600' },
  { type: 'LAND_SALE', label: 'Land', tKey: 'land', icon: LandPlot, color: 'from-amber-500 to-amber-600' },
];

const CITIES = ['Hyderabad', 'Bangalore', 'Mumbai', 'Pune', 'Delhi', 'Chennai'];

const HERO_QUOTE_KEYS = [
  'roomInCity',
  'homeWithoutBrokers',
  'perfectFlatmate',
  'cozyPg',
  'dreamRental',
];

function AnimatedCounter({ target, duration = 1500, suffix = '' }) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting && !started) setStarted(true); },
      { threshold: 0.5 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    const num = parseInt(target.replace(/[^0-9]/g, ''), 10);
    if (isNaN(num)) { setCount(target); return; }
    let start = 0;
    const step = num / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= num) { setCount(num); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [started, target, duration]);

  return <span ref={ref}>{typeof count === 'number' ? count : count}{suffix || target.replace(/[0-9]/g, '')}</span>;
}

function TrustStat({ Icon, value, label, delay }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true); },
      { threshold: 0.5 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`flex items-center gap-2 sm:gap-3 justify-center sm:justify-start transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-white/60 flex items-center justify-center shrink-0 shadow-sm">
        {visible ? (
          <Icon size={16} className="text-primary-500 animate-bounce-subtle" />
        ) : (
          <div className="w-4 h-4 skeleton rounded" />
        )}
      </div>
      <div>
        <p className="font-display font-bold text-sm sm:text-lg text-surface-900 leading-tight">
          {visible ? <AnimatedCounter target={value} /> : <span className="inline-block h-5 w-12 skeleton rounded" />}
        </p>
        <p className="text-[10px] sm:text-xs text-surface-500">{label}</p>
      </div>
    </div>
  );
}

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
  const { t } = useTranslation();
  const [searchCity, setSearchCity] = useState('');
  const [activeType, setActiveType] = useState('');
  const [page, setPage] = useState(1);
  const [heroVisible, setHeroVisible] = useState(false);
  const [quoteIdx, setQuoteIdx] = useState(0);
  const [typedText, setTypedText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const loaderRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => setHeroVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  // Typing animation
  useEffect(() => {
    const currentQuote = t(HERO_QUOTE_KEYS[quoteIdx]);
    let timeout;

    if (!isDeleting && typedText === currentQuote) {
      timeout = setTimeout(() => setIsDeleting(true), 2000);
    } else if (isDeleting && typedText === '') {
      setIsDeleting(false);
      setQuoteIdx((p) => (p + 1) % HERO_QUOTE_KEYS.length);
    } else {
      timeout = setTimeout(() => {
        setTypedText(
          isDeleting
            ? currentQuote.substring(0, typedText.length - 1)
            : currentQuote.substring(0, typedText.length + 1)
        );
      }, isDeleting ? 40 : 80);
    }
    return () => clearTimeout(timeout);
  }, [typedText, isDeleting, quoteIdx]);

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

      {/* HERO — Near-white with subtle teal tints */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary-50/80 via-white to-surface-50">
        {/* Subtle floating blobs */}
        <div className="absolute top-0 left-[15%] w-64 sm:w-96 h-64 sm:h-96 bg-primary-100/40 rounded-full blur-3xl animate-liquid-float" />
        <div className="absolute bottom-0 right-[10%] w-56 sm:w-80 h-56 sm:h-80 bg-accent-100/30 rounded-full blur-3xl animate-liquid-float" style={{ animationDelay: '3s' }} />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-72 sm:w-[500px] h-72 sm:h-[500px] bg-primary-50/50 rounded-full blur-[80px] animate-liquid-float" style={{ animationDelay: '1.5s' }} />

        <div className={`relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-10 sm:pt-14 pb-8 transition-all duration-700 ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <div className="text-center mb-6 sm:mb-8">
            <div className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-primary-50 text-primary-600 text-[11px] sm:text-xs font-medium mb-4 border border-primary-100">
              <Sparkles size={12} />
              {t('heroBadge')}
            </div>
            <h1 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl tracking-tight text-surface-900 mb-1">
              {t('heroFind')}
            </h1>
            <h2 className="font-caveat text-4xl sm:text-5xl lg:text-6xl font-bold text-primary-600 h-[1.2em] mb-3">
              {typedText}
              <span className="inline-block w-[3px] h-[0.8em] bg-primary-500 ml-0.5 align-middle animate-pulse" />
            </h2>
            <p className="text-surface-500 text-sm sm:text-base max-w-md mx-auto">
              {t('heroSubtitle')}
            </p>
          </div>

          {/* Search panel */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
            <div className="glass-strong rounded-3xl p-3">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-400" />
                  <input
                    type="text"
                    value={searchCity}
                    onChange={(e) => setSearchCity(e.target.value)}
                    placeholder={t('searchByCity')}
                    className="w-full pl-11 pr-4 py-3.5 bg-white/80 border border-surface-200/60 rounded-2xl text-xs text-surface-900 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 focus:bg-white transition-all duration-200"
                  />
                </div>
                <button type="submit" className="btn-primary px-5 sm:px-7 py-3.5 rounded-2xl text-sm font-semibold shrink-0 ripple-container shadow-lg">
                  <Search size={13} />
                </button>
              </div>
            </div>
          </form>

          {/* Category chips */}
          <div className="flex items-center justify-center gap-2 mt-5 flex-wrap">
            {CATEGORIES.map(({ type, tKey, icon: Icon }) => (
              <button
                key={type}
                onClick={() => navigate(type ? `/search?type=${type}` : '/search')}
                className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-300 ${activeType === type
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'bg-white text-surface-600 border border-surface-200 hover:border-primary-300 hover:text-primary-600 shadow-sm'
                  }`}
              >
                <Icon size={14} />
                {t(tKey)}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* CATEGORY CARDS — Trust bar style */}
      <section className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="glass-tinted rounded-3xl p-4 sm:p-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {CATEGORIES.filter((c) => c.type).map(({ type, tKey, icon: Icon, color }, idx) => (
              <Link
                key={type}
                to={`/search?type=${type}`}
                className="flex items-center gap-3 p-3 sm:p-4 rounded-2xl bg-white/60 hover:bg-white/80 transition-all duration-300 group shadow-sm hover:shadow-md"
                style={{ animation: `slide-up 0.4s cubic-bezier(0.16,1,0.3,1) ${idx * 80}ms both` }}
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform duration-300">
                  <Icon size={18} className="text-primary-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-surface-800">{t(tKey)}</p>
                  <p className="text-[10px] sm:text-xs text-surface-400">{t('viewAll')}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* LISTINGS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-8">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-display font-bold text-lg text-surface-900">
              {activeType ? t(CATEGORIES.find((c) => c.type === activeType)?.tKey || 'all') : 'Latest Listings'}
            </h2>
            <p className="text-xs text-surface-400 mt-0.5">
              {isLoading ? <span className="inline-block h-3 w-16 skeleton rounded" /> : `${listings.length} ${t('listingsFound')}`}
            </p>
          </div>
          <Link to="/search" className="flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors">
            {t('viewAll')} <ArrowRight size={12} />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} index={i} />)
            : listings.map((listing, i) => (
              <div key={listing.id} className="h-full" style={{ animation: `slide-up 0.4s cubic-bezier(0.16,1,0.3,1) ${i * 50}ms both` }}>
                <ListingCard listing={listing} />
              </div>
            ))
          }
        </div>

        {!isLoading && listings.length === 0 && (
          <div className="text-center py-20 animate-fade-in">
            <Building2 size={48} className="mx-auto mb-4 text-surface-200" />
            <p className="text-surface-500 font-medium">{t('noListingsFound')}</p>
            <p className="text-surface-400 text-sm mt-1">{t('tryDifferentCategory')}</p>
          </div>
        )}

        <div ref={loaderRef} className="h-12 flex items-center justify-center">
          {isFetching && !isLoading && (
            <div className="flex items-center gap-3 text-sm text-surface-400 animate-fade-in">
              <Spinner size="sm" />
              {t('loadingMore')}
            </div>
          )}
        </div>
      </section>

      {/* TRUST BAR — Animated loading */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-6 text-center">
        <h4 className="text-xs font-bold uppercase tracking-widest text-surface-400 mb-3">{t('our Goal') || 'OUR GOAL'}</h4>
        <div className="glass-tinted rounded-3xl p-6 sm:p-8">
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            <TrustStat Icon={Shield} value="100%" label={t('verifiedOwners')} delay={0} />
            <TrustStat Icon={Star} value="0%" label={t('brokerageFee')} delay={150} />
            <TrustStat Icon={TrendingUp} value="500+" label={t('activeListings')} delay={300} />
          </div>
        </div>
      </section>

      {/* CITIES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-6">
        <h3 className="font-display font-bold text-sm text-surface-900 mb-3">{t('exploreByCity')}</h3>
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

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-10">
        <div className="glass-dark rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-white">
          <div className="text-center sm:text-left">
            <h3 className="font-display font-bold text-lg">{t('ownProperty')}</h3>
            <p className="text-white/60 text-sm">{t('listForFree')}</p>
          </div>
          <Link to="/register" className="btn bg-white/90 text-surface-900 hover:bg-white px-6 py-2.5 rounded-2xl text-sm font-semibold shrink-0 ripple-container shadow-lg w-full sm:w-auto text-center">
            {t('postFreeListing')}
          </Link>
        </div>
      </section>

      <footer className="border-t border-surface-100 py-6 px-4 text-center text-xs text-surface-400 bg-white">
        <p>&copy; {new Date().getFullYear()} Quikden &middot; {t('madeInIndia')}</p>
      </footer>

      <InstallBanner />
    </div>
  );
}
