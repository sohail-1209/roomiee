// ListingFilters — sidebar filter panel.
// Collapsible on mobile. Calls onChange whenever any filter changes.
import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  SlidersHorizontal, X, ChevronDown, ChevronUp,
  Wifi, Wind, Car, Refrigerator, UtensilsCrossed, Dumbbell, Droplets, Fan,
} from 'lucide-react';

/* ── Constants ─────────────────────────────────────────────── */
const LISTING_TYPES = [
  { value: 'ALL', labelKey: 'all' },
  { value: 'HOUSE_RENTAL', labelKey: 'houseRentalBadge' },
  { value: 'ROOM_SHARING', labelKey: 'roomSharingBadge' },
  { value: 'HOSTEL', labelKey: 'hostelPgBadge' },
  { value: 'LAND_SALE', labelKey: 'landSaleBadge' },
];

const BEDROOM_OPTIONS = ['1', '2', '3', '4+'];

const GENDER_OPTIONS = [
  { value: 'ANY', labelKey: 'any' },
  { value: 'MALE', labelKey: 'male' },
  { value: 'FEMALE', labelKey: 'female' },
];

const AMENITY_OPTIONS = [
  { key: 'wifi',         labelKey: 'wifi',         Icon: Wifi },
  { key: 'ac',           labelKey: 'ac',           Icon: Wind },
  { key: 'parking',      labelKey: 'parking',      Icon: Car },
  { key: 'fridge',       labelKey: 'fridge',       Icon: Refrigerator },
  { key: 'kitchen',      labelKey: 'kitchen',      Icon: UtensilsCrossed },
  { key: 'gym',          labelKey: 'gym',          Icon: Dumbbell },
  { key: 'waterSupply',  labelKey: 'waterSupply',  Icon: Droplets },
  { key: 'ventilation',  labelKey: 'ventilation',  Icon: Fan },
];

const DEFAULT_FILTERS = {
  city: '',
  type: 'ALL',
  minRent: '',
  maxRent: '',
  bedrooms: '',
  furnished: false,
  gender: 'ANY',
  amenities: {},
};

/* ── Sub-components ─────────────────────────────────────────── */
const SectionHeader = ({ title, open, onToggle }) => (
  <button
    type="button"
    onClick={onToggle}
    className="flex items-center justify-between w-full py-2 text-sm font-semibold text-surface-700 hover:text-surface-900"
  >
    {title}
    {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
  </button>
);

const ToggleButton = ({ active, onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${
      active
        ? 'bg-primary-600 text-white shadow-sm'
        : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
    }`}
  >
    {children}
  </button>
);

/* ── Main Component ─────────────────────────────────────────── */
/**
 * @param {object}   filters    - Current filter state
 * @param {Function} onChange   - Called with (newFilters) whenever a filter changes
 */
const ListingFilters = ({ filters = DEFAULT_FILTERS, onChange }) => {
  const { t } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sections, setSections] = useState({
    city: true,
    type: true,
    budget: true,
    bedrooms: true,
    furnished: true,
    gender: true,
    amenities: true,
  });

  const toggleSection = (key) =>
    setSections((s) => ({ ...s, [key]: !s[key] }));

  const update = useCallback(
    (patch) => onChange?.({ ...DEFAULT_FILTERS, ...filters, ...patch }),
    [filters, onChange]
  );

  const resetAll = () => onChange?.(DEFAULT_FILTERS);

  const isRoomSharing =
    filters.type === 'ROOM_SHARING';
  const isHostel = filters.type === 'HOSTEL';
  const showGenderFilter = isRoomSharing || isHostel;

  const hasActiveFilters =
    filters.city ||
    (filters.type && filters.type !== 'ALL') ||
    filters.minRent ||
    filters.maxRent ||
    filters.bedrooms ||
    filters.furnished ||
    (filters.gender && filters.gender !== 'ANY') ||
    Object.values(filters.amenities ?? {}).some(Boolean);

  /* ── Panel ── */
  const Panel = () => (
    <div className="flex flex-col gap-0 divide-y divide-surface-100">

      {/* Reset */}
      {hasActiveFilters && (
        <div className="pb-3">
          <button
            type="button"
            onClick={resetAll}
            className="btn-ghost btn-sm gap-1 text-danger-500 hover:bg-danger-50 hover:text-danger-600"
          >
            <X size={13} /> {t('resetAll')}
          </button>
        </div>
      )}

      {/* City */}
      <div className="py-3">
        <SectionHeader
          title={t('city')}
          open={sections.city}
          onToggle={() => toggleSection('city')}
        />
        {sections.city && (
          <input
            type="text"
            className="input text-sm mt-2"
            placeholder={t('cityPlaceholder')}
            value={filters.city ?? ''}
            onChange={(e) => update({ city: e.target.value })}
          />
        )}
      </div>

      {/* Listing type */}
      <div className="py-3">
        <SectionHeader
          title={t('listingTypeFilter')}
          open={sections.type}
          onToggle={() => toggleSection('type')}
        />
        {sections.type && (
          <div className="grid grid-cols-3 gap-1.5 mt-2">
            {LISTING_TYPES.map(({ value, labelKey }) => (
              <ToggleButton
                key={value}
                active={filters.type === value}
                onClick={() => update({ type: value, gender: 'ANY' })}
              >
                {t(labelKey)}
              </ToggleButton>
            ))}
          </div>
        )}
      </div>

      {/* Budget */}
      <div className="py-3">
        <SectionHeader
          title={t('budgetMonth')}
          open={sections.budget}
          onToggle={() => toggleSection('budget')}
        />
        {sections.budget && (
          <div className="flex gap-2 mt-2">
            <input
              type="number"
              className="input text-sm"
              placeholder={t('min')}
              min={0}
              value={filters.minRent ?? ''}
              onChange={(e) => update({ minRent: e.target.value })}
            />
            <input
              type="number"
              className="input text-sm"
              placeholder={t('max')}
              min={0}
              value={filters.maxRent ?? ''}
              onChange={(e) => update({ maxRent: e.target.value })}
            />
          </div>
        )}
      </div>

      {/* Bedrooms (house rental only) */}
      {!isRoomSharing && !isHostel && (
        <div className="py-3">
          <SectionHeader
            title={t('bedrooms')}
            open={sections.bedrooms}
            onToggle={() => toggleSection('bedrooms')}
          />
          {sections.bedrooms && (
            <div className="flex gap-2 mt-2">
              {BEDROOM_OPTIONS.map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() =>
                    update({ bedrooms: filters.bedrooms === val ? '' : val })
                  }
                  className={`btn btn-sm flex-1 ${
                    filters.bedrooms === val ? 'btn-primary' : 'btn-secondary'
                  }`}
                >
                  {val}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Furnished */}
      <div className="py-3">
        <SectionHeader
          title={t('furnished')}
          open={sections.furnished}
          onToggle={() => toggleSection('furnished')}
        />
        {sections.furnished && (
          <label className="flex items-center gap-3 mt-2 cursor-pointer select-none">
            <div
              role="checkbox"
              aria-checked={!!filters.furnished}
              tabIndex={0}
              onClick={() => update({ furnished: !filters.furnished })}
              onKeyDown={(e) =>
                e.key === ' ' && update({ furnished: !filters.furnished })
              }
              className={`relative w-10 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-400 ${
                filters.furnished ? 'bg-primary-600' : 'bg-surface-200'
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${
                  filters.furnished ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </div>
            <span className="text-sm text-surface-700">{t('fullyFurnished')}</span>
          </label>
        )}
      </div>

      {/* Gender (room sharing / hostel only) */}
      {showGenderFilter && (
        <div className="py-3">
          <SectionHeader
            title={t('genderPreference')}
            open={sections.gender}
            onToggle={() => toggleSection('gender')}
          />
          {sections.gender && (
            <div className="flex gap-2 mt-2">
              {GENDER_OPTIONS.map(({ value, labelKey }) => (
                <ToggleButton
                  key={value}
                  active={filters.gender === value}
                  onClick={() => update({ gender: value })}
                >
                  {t(labelKey)}
                </ToggleButton>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Amenities */}
      <div className="py-3">
        <SectionHeader
          title={t('amenities')}
          open={sections.amenities}
          onToggle={() => toggleSection('amenities')}
        />
        {sections.amenities && (
          <div className="grid grid-cols-2 gap-y-2 gap-x-3 mt-2">
            {AMENITY_OPTIONS.map(({ key, labelKey, Icon }) => {
              const checked = !!(filters.amenities?.[key]);
              return (
                <label
                  key={key}
                  className="flex items-center gap-2 cursor-pointer select-none group"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() =>
                      update({
                        amenities: {
                          ...(filters.amenities ?? {}),
                          [key]: !checked,
                        },
                      })
                    }
                    className="w-4 h-4 accent-primary-600 rounded"
                  />
                  <Icon size={13} className="text-primary-500 flex-shrink-0" />
                  <span className="text-xs text-surface-700 group-hover:text-surface-900">
                    {t(labelKey)}
                  </span>
                </label>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* ── Mobile toggle button ── */}
      <div className="lg:hidden mb-4">
        <button
          type="button"
          onClick={() => setMobileOpen((o) => !o)}
          className="btn-outline btn-md gap-2 w-full"
        >
          <SlidersHorizontal size={16} />
          {mobileOpen ? t('hideFilters') : t('showFilters')}
          {hasActiveFilters && (
            <span className="badge badge-primary text-xs">{t('active')}</span>
          )}
        </button>

        {/* Mobile collapsible panel */}
        <div
          className={`overflow-hidden transition-all duration-300 ${
            mobileOpen ? 'max-h-[1000px] opacity-100 mt-3' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="card p-4">
            <Panel />
          </div>
        </div>
      </div>

      {/* ── Desktop sidebar (always visible) ── */}
      <aside className="hidden lg:block">
        <div className="card p-5 sticky top-24">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-base text-surface-800 flex items-center gap-2">
              <SlidersHorizontal size={16} className="text-primary-500" />
              {t('filters')}
            </h2>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetAll}
                className="text-xs text-danger-500 hover:text-danger-600 font-medium flex items-center gap-1"
              >
                <X size={12} /> {t('reset')}
              </button>
            )}
          </div>
          <Panel />
        </div>
      </aside>
    </>
  );
};

export default ListingFilters;
