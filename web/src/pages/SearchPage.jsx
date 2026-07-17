import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Sparkles, Search, SlidersHorizontal, ArrowUpDown, Home, Building2, Users, LandPlot, Grid } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import ListingFilters from '../components/listing/ListingFilters';
import ListingGrid from '../components/listing/ListingGrid';
import { searchAPI, listingsAPI } from '../services/endpoints';
import { Button, Input, Select } from '../components/ui/index.js';

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useTranslation();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isAiMode, setIsAiMode] = useState(false);
  const [aiQuery, setAiQuery] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [parsedAiFilters, setParsedAiFilters] = useState(null);

  // Sync search parameters from URL
  const filters = {
    q: searchParams.get('q') || '',
    type: searchParams.get('type') || '',
    city: searchParams.get('city') || '',
    minRent: searchParams.get('minRent') || '',
    maxRent: searchParams.get('maxRent') || '',
    bedrooms: searchParams.get('bedrooms') || '',
    furnished: searchParams.get('furnished') || '',
    gender: searchParams.get('gender') || '',
    amenities: {
      wifi: searchParams.get('wifi') === 'true',
      ac: searchParams.get('ac') === 'true',
      parking: searchParams.get('parking') === 'true',
      fridge: searchParams.get('fridge') === 'true',
      kitchen: searchParams.get('kitchen') === 'true',
      gym: searchParams.get('gym') === 'true',
    },
    page: searchParams.get('page') || '1',
    limit: '12',
  };

  const updateFilters = (newFilters) => {
    const updated = { ...filters, ...newFilters, page: '1' }; // Reset to page 1 on filter change
    // Clean empty values
    Object.keys(updated).forEach((key) => {
      if (!updated[key] || updated[key] === 'false') {
        searchParams.delete(key);
      } else if (key === 'amenities' && typeof updated[key] === 'object') {
        // Flatten amenities object into individual params
        Object.entries(updated[key]).forEach(([ak, av]) => {
          if (av) searchParams.set(ak, 'true');
          else searchParams.delete(ak);
        });
        searchParams.delete('amenities');
      } else {
        searchParams.set(key, updated[key]);
      }
    });
    setSearchParams(searchParams);
  };

  // Fetch results via react-query
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['listings-search', searchParams.toString()],
    queryFn: () => {
      // If we have AI parsed filters, merge them, otherwise search normally
      const params = Object.fromEntries(searchParams.entries());
      return listingsAPI.getAll(params).then((r) => r.data);
    },
  });

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    updateFilters({ q: filters.q });
  };

  const handleAiSearchSubmit = async (e) => {
    e.preventDefault();
    if (!aiQuery.trim()) return;
    setAiLoading(true);
    setParsedAiFilters(null);
    try {
      const { data } = await searchAPI.aiSearch(aiQuery);
      if (data.success) {
        // Set search params from parsed filters
        const parsed = data.parsedFilters || {};
        setParsedAiFilters(parsed);
        toast.success(t('aiParsed'));

        // Convert parsed filters to URL search params
        const newParams = new URLSearchParams();
        if (parsed.city) newParams.set('city', parsed.city);
        if (parsed.maxRent) newParams.set('maxRent', String(parsed.maxRent));
        if (parsed.minRent) newParams.set('minRent', String(parsed.minRent));
        if (parsed.type) newParams.set('type', parsed.type);
        if (parsed.gender) newParams.set('gender', parsed.gender);
        if (parsed.bedrooms) newParams.set('bedrooms', String(parsed.bedrooms));
        if (parsed.furnished) newParams.set('furnished', 'true');
        if (parsed.wifi) newParams.set('wifi', 'true');
        if (parsed.ac) newParams.set('ac', 'true');
        if (parsed.parking) newParams.set('parking', 'true');
        newParams.set('page', '1');

        setSearchParams(newParams);
      }
    } catch (err) {
      toast.error(t('aiFailed'));
      updateFilters({ q: aiQuery });
    } finally {
      setAiLoading(false);
    }
  };

  const handleResetFilters = () => {
    setSearchParams(new URLSearchParams());
    setParsedAiFilters(null);
    setAiQuery('');
  };

  const totalPages = data?.pagination?.pages || 1;
  const currentPage = parseInt(filters.page);

  return (
    <div className="min-h-screen bg-surface-50 font-sans">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* ─── Search & AI Toggle Bar ──────────────────────────────────────── */}
        <div className="card p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* AI Switch */}
            <div className="flex items-center gap-3 bg-surface-100 p-1 rounded-xl w-full md:w-auto">
              <button
                onClick={() => setIsAiMode(false)}
                className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all ${!isAiMode
                  ? 'bg-gradient-to-r from-primary-600 to-accent-600 text-white shadow-sm'
                  : 'text-surface-500 hover:text-surface-900'
                  }`}
              >
                <Search size={16} /> {t('basicSearch')}
              </button>
              <button
                onClick={() => setIsAiMode(true)}
                className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all ${isAiMode
                  ? 'bg-gradient-to-r from-primary-600 to-indigo-600 text-white shadow-sm'
                  : 'text-surface-500 hover:text-surface-900'
                  }`}
              >
                <Sparkles size={16} /> {t('aiSearch')}
              </button>
            </div>

            {/* Forms */}
            <div className="w-full md:flex-1">
              {!isAiMode ? (
                <form onSubmit={handleSearchSubmit} className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      placeholder={t('searchPlaceholder')}
                      value={filters.q}
                      onChange={(e) => updateFilters({ q: e.target.value })}
                      className=""
                    />
                  </div>
                  <Button type="submit" variant="primary">
                    <Search />
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleAiSearchSubmit} className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      placeholder={t('aiPlaceholder')}
                      value={aiQuery}
                      onChange={(e) => setAiQuery(e.target.value)}
                      className="pr-10 border-primary-300 focus:ring-primary-500 focus:border-primary-500"
                    />
                    <Sparkles className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-500 animate-pulse" size={18} />
                  </div>
                  <Button type="submit" variant="primary" loading={aiLoading}>
                    {t('askAi')}
                  </Button>
                </form>
              )}
            </div>

            {/* Mobile Filter Button */}
            <button
              onClick={() => setIsFilterOpen(true)}
              className="lg:hidden w-full md:w-auto btn btn-secondary flex items-center justify-center gap-2"
            >
                  <SlidersHorizontal size={16} /> {t('filters')}
            </button>
          </div>

          {/* AI Filter Badges */}
          {parsedAiFilters && (
            <div className="flex flex-wrap gap-2 mt-3 items-center border-t border-surface-100 pt-3">
              <span className="text-xs font-semibold text-primary-700 bg-primary-50 px-2 py-1 rounded-md flex items-center gap-1">
                <Sparkles size={12} /> {t('aiFilters')}
              </span>
              {Object.entries(parsedAiFilters).map(([key, val]) => {
                if (!val || val === 'ANY') return null;
                return (
                  <span key={key} className="badge badge-gray capitalize text-xs">
                    {key}: {String(val)}
                  </span>
                );
              })}
              <button
                onClick={handleResetFilters}
                className="text-xs text-danger-500 hover:underline ml-auto font-medium"
              >
                {t('clearAiSearch')}
              </button>
            </div>
          )}
        </div>

        {/* Mobile Categories Scroll (Capsules) */}
        <div className="lg:hidden flex gap-2 overflow-x-auto pb-4 pt-1 no-scrollbar scroll-smooth">
          {[
            { value: '', label: t('all') || 'All', icon: Grid },
            { value: 'HOUSE_RENTAL', label: t('house') || 'House', icon: Home },
            { value: 'HOSTEL', label: t('hostels') || 'Hostels', icon: Building2 },
            { value: 'ROOM_SHARING', label: t('roomSharing') || 'Room Sharing', icon: Users },
            { value: 'LAND_SALE', label: t('land') || 'Land', icon: LandPlot },
          ].map((cat) => {
            const isActive = filters.type === cat.value;
            const Icon = cat.icon;
            return (
              <button
                key={cat.value}
                onClick={() => updateFilters({ type: cat.value })}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 border shrink-0 shadow-sm ${
                  isActive
                    ? 'bg-gradient-to-r from-primary-600 to-accent-600 text-white border-transparent scale-102 font-bold'
                    : 'bg-white text-surface-600 border-surface-200 hover:border-primary-300 hover:text-surface-900 active:bg-surface-50'
                }`}
              >
                <Icon size={13} className={isActive ? 'text-white' : 'text-surface-450'} />
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* ─── Main Grid Layout ────────────────────────────────────────────── */}
        <div className="flex gap-8">
          {/* Sidebar Filters (Desktop) */}
          <div className="hidden lg:block w-72 flex-shrink-0">
            <div className="card p-5 sticky top-24">
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-surface-100">
                <h3 className="font-display font-semibold text-base text-surface-900 flex items-center gap-2">
              <SlidersHorizontal size={16} /> {t('filters')}
                </h3>
                <button
                  onClick={handleResetFilters}
                  className="text-xs text-primary-600 hover:underline font-medium"
                >
                  {t('resetAll')}
                </button>
              </div>
              <ListingFilters
                filters={filters}
                onChange={(changed) => updateFilters(changed)}
              />
            </div>
          </div>

          {/* Results column */}
          <div className="flex-grow">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-surface-500 font-medium">
                {t('showing', { count: data?.data?.length || 0 })}
              </p>
              <div className="flex items-center gap-2">
                <ArrowUpDown size={14} className="text-surface-400" />
                <select
                  onChange={(e) => updateFilters({ sort: e.target.value })}
                  className="bg-transparent border-none text-sm text-surface-600 focus:outline-none cursor-pointer font-medium"
                >
                  <option value="newest">{t('newestFirst')}</option>
                  <option value="rent_asc">{t('rentLowHigh')}</option>
                  <option value="rent_desc">{t('rentHighLow')}</option>
                  <option value="popular">{t('mostPopular')}</option>
                </select>
              </div>
            </div>

            <ListingGrid listings={data?.data || []} isLoading={isLoading} />

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => updateFilters({ page: String(currentPage - 1) })}
                >
                  {t('prev')}
                </Button>
                {Array.from({ length: totalPages }).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => updateFilters({ page: String(idx + 1) })}
                    className={`w-9 h-9 rounded-xl text-sm font-semibold flex items-center justify-center border transition-all ${currentPage === idx + 1
                      ? 'bg-primary-600 border-primary-600 text-white shadow-sm'
                      : 'bg-surface-50/80 border-surface-200 text-surface-600 hover:bg-surface-50'
                      }`}
                  >
                    {idx + 1}
                  </button>
                ))}
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => updateFilters({ page: String(currentPage + 1) })}
                >
                  {t('next')}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />

      {/* Mobile Filters Modal */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden bg-surface-950/40 backdrop-blur-sm animate-fade-in">
          <div className="ml-auto w-full max-w-sm h-full bg-surface-50/95 backdrop-blur-xl shadow-xl flex flex-col animate-slide-up">
            <div className="p-4 border-b border-surface-100 flex items-center justify-between">
              <h3 className="font-display font-semibold text-lg text-surface-900">{t('filters')}</h3>
              <button
                onClick={() => setIsFilterOpen(false)}
                className="text-surface-400 hover:text-surface-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <ListingFilters
                filters={filters}
                onChange={(changed) => updateFilters(changed)}
              />
            </div>
            <div className="p-4 border-t border-surface-100 flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={handleResetFilters}>
                {t('reset')}
              </Button>
              <Button variant="primary" className="flex-1" onClick={() => setIsFilterOpen(false)}>
                {t('apply')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchPage;
