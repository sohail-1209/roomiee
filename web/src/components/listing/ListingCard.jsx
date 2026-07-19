// ListingCard — Google M3 style with hover elevation, ripple, smooth transitions
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, BedDouble, Bath, Maximize2, Users, Star, CalendarDays, LandPlot, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { formatRent, getPrimaryPhoto, timeAgo, truncate } from '../../utils/helpers';
import { useTranslation } from 'react-i18next';
import SaveButton from './SaveButton';
import Avatar from '../ui/Avatar';

const PLACEHOLDER = '/images/listing-placeholder.svg';

const GENDER_COLOR = {
  MALE: 'bg-primary-50 text-primary-700',
  FEMALE: 'bg-pink-50 text-pink-600',
  ANY: 'badge-gray',
};

function createRipple(e) {
  const card = e.currentTarget;
  const rect = card.getBoundingClientRect();
  const ripple = document.createElement('span');
  const size = Math.max(rect.width, rect.height) * 2;
  ripple.style.width = ripple.style.height = `${size}px`;
  ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
  ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
  ripple.className = 'ripple';
  ripple.style.background = 'rgba(13, 148, 136, 0.08)';
  card.appendChild(ripple);
  ripple.addEventListener('animationend', () => ripple.remove());
}

const GENDER_LABEL_KEYS = { MALE: 'maleOnlyBadge', FEMALE: 'femaleOnlyBadge', ANY: 'anyGender' };
const TYPE_CONFIG_KEYS = {
  HOUSE_RENTAL: { labelKey: 'houseRentalBadge', color: 'bg-primary-600/90 text-white' },
  ROOM_SHARING: { labelKey: 'roomSharingBadge', color: 'bg-accent-600/90 text-white' },
  HOSTEL: { labelKey: 'hostelPgBadge', color: 'bg-emerald-500/90 text-white' },
  LAND_SALE: { labelKey: 'landSaleBadge', color: 'bg-amber-500/90 text-white' },
};

const ListingCard = ({ listing, onSave, isSaved = false, hideSave = false }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  if (!listing) return null;

  const isHouse = listing.type === 'HOUSE_RENTAL';
  const isHostel = listing.type === 'HOSTEL';
  const isLand = listing.type === 'LAND_SALE';
  const minHostelPrice = isHostel && listing.hostelSharing?.tiers?.length > 0
    ? Math.min(...listing.hostelSharing.tiers.map((t) => t.price))
    : 0;
  const detailPath = isLand ? `/land/${listing.id}` : isHouse ? `/listing/${listing.id}` : isHostel ? `/hostel/${listing.id}` : `/room/${listing.id}`;
  const photoUrl = getPrimaryPhoto(listing) || PLACEHOLDER;
  const typeConfigRaw = TYPE_CONFIG_KEYS[listing.type] || TYPE_CONFIG_KEYS.HOUSE_RENTAL;
  const typeConfig = { label: t(typeConfigRaw.labelKey), color: typeConfigRaw.color };

  const handleCardClick = (e) => {
    createRipple(e);
    setTimeout(() => navigate(detailPath), 150);
  };

  return (
    <article
      className="glass-card glass-shimmer cursor-pointer group overflow-hidden flex flex-col h-full"
      onClick={handleCardClick}
      role="link"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && navigate(detailPath)}
      aria-label={`${listing.title} – ${isHostel && minHostelPrice > 0 ? `From ${formatRent(minHostelPrice)}` : formatRent(listing.rent)} per month`}
    >
      {/* Photo */}
      <div className="relative aspect-[4/3] overflow-hidden bg-surface-100">
        <img
          src={photoUrl}
          alt={listing.title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          onError={(e) => { e.currentTarget.src = PLACEHOLDER; }}
        />

        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Type badge */}
        <span className={`absolute top-3 left-3 badge text-[11px] font-semibold shadow-sm backdrop-blur-sm ${typeConfig.color}`}>
          {typeConfig.label}
        </span>

        {/* Booked */}
        {listing.status === 'RENTED' && (
          <span className="absolute top-3 left-1/2 -translate-x-1/2 bg-surface-900/80 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full">
            {t('booked')}
          </span>
        )}

        {/* Save */}
        {!hideSave && (
          <div className="absolute top-3 right-3">
            <SaveButton listingId={listing.id} isSaved={isSaved} onToggle={onSave} />
          </div>
        )}

        {/* Time ago */}
        <span className="absolute bottom-3 right-3 bg-surface-900/60 backdrop-blur-sm text-white text-[11px] px-2.5 py-1 rounded-full font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-y-1 group-hover:translate-y-0">
          {timeAgo(listing.createdAt)}
        </span>
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-4 gap-2">
        {/* Rent */}
        <div className="flex items-baseline gap-1">
          <span className="text-xl font-bold text-surface-900 font-display">
            {isHostel && minHostelPrice > 0 ? (
              `${t('from') || 'From'} ${formatRent(minHostelPrice)}`
            ) : (
              formatRent(listing.rent)
            )}
          </span>
          <span className="text-xs text-surface-400 font-medium">{t('mo')}</span>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-surface-800 leading-snug text-sm line-clamp-2">
          {truncate(listing.title, 70)}
        </h3>

        {/* Location */}
        <div className="flex items-start gap-1 text-surface-500 text-xs">
          <MapPin size={12} className="flex-shrink-0 mt-0.5 text-primary-400" />
          <span className="line-clamp-1">
            {[listing.address, listing.city].filter(Boolean).join(', ')}
          </span>
        </div>

        {/* Expandable content area */}
        <div className={`relative flex-1 overflow-hidden transition-all duration-300 ${expanded ? '' : 'max-h-[80px]'}`}>
          {/* Stats */}
          <div className="flex items-center gap-3 text-xs text-surface-600 flex-wrap">
            {isLand ? (
              <>
                {listing.areaSqFt != null && (
                  <span className="flex items-center gap-1">
                    <Maximize2 size={12} className="text-amber-500" />
                    {listing.areaSqFt} {t('sqftUnit')}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <LandPlot size={12} className="text-amber-500" />
                  {t('forSale')}
                </span>
              </>
            ) : isHouse ? (
              <>
                {listing.bedrooms != null && (
                  <span className="flex items-center gap-1">
                    <BedDouble size={12} className="text-primary-400" />
                    {listing.bedrooms} {listing.bedrooms === 1 ? t('bed') : t('beds')}
                  </span>
                )}
                {listing.bathrooms != null && (
                  <span className="flex items-center gap-1">
                    <Bath size={12} className="text-primary-400" />
                    {listing.bathrooms} {listing.bathrooms === 1 ? t('bath') : t('baths')}
                  </span>
                )}
                {listing.areaSqFt != null && (
                  <span className="flex items-center gap-1">
                    <Maximize2 size={12} className="text-primary-400" />
                    {listing.areaSqFt} {t('sqftUnit')}
                  </span>
                )}
              </>
            ) : isHostel && listing.hostelSharing?.tiers?.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {listing.hostelSharing.tiers.filter((t) => t.available).slice(0, 3).map((t) => (
                  <span key={t.id} className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-primary-50 text-primary-700">
                    {t.sharingSize}-sharing · {formatRent(t.price)}
                  </span>
                ))}
              </div>
            ) : (
              listing.genderPreference && (
                <span className={`badge text-[11px] ${GENDER_COLOR[listing.genderPreference] || 'badge-gray'}`}>
                  <Users size={11} />
                  {t(GENDER_LABEL_KEYS[listing.genderPreference]) ?? listing.genderPreference}
                </span>
              )
            )}
          </div>

          {/* Available from */}
          {listing.availableFrom && (
            <div className="flex items-center gap-1 text-xs text-surface-500 mt-1.5">
              <CalendarDays size={11} className="text-primary-400" />
              {t('availableFromLabel')}{' '}
              {new Date(listing.availableFrom).toLocaleDateString('en-IN', {
                day: 'numeric', month: 'short', year: 'numeric',
              })}
            </div>
          )}

          {/* Fade overlay when collapsed */}
          {!expanded && (
            <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white/90 to-transparent pointer-events-none" />
          )}
        </div>

        {/* Expand/Collapse arrow */}
        <button
          onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }}
          className={`flex items-center justify-center gap-1 text-[11px] font-medium text-primary-500 hover:text-primary-600 transition-all duration-200 py-0.5 rounded-lg hover:bg-primary-50/50 ${expanded ? 'rotate-180' : ''}`}
        >
          <ChevronDown size={14} />
        </button>

        {/* Divider + Owner */}
        <div className="border-t border-surface-100 pt-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Avatar src={listing.owner?.profileImage} name={listing.owner?.name} size="sm" />
            <span className="text-xs font-medium text-surface-700 truncate max-w-[100px]">
              {listing.owner?.name ?? t('owner')}
            </span>
          </div>

          {listing.owner?.avgRating != null && listing.owner.avgRating > 0 && (
            <div className="flex items-center gap-0.5 text-xs text-amber-500 font-medium">
              <Star size={11} className="fill-amber-400 text-amber-400" />
              {Number(listing.owner.avgRating).toFixed(1)}
            </div>
          )}
        </div>
      </div>
    </article>
  );
};

export default ListingCard;
