// ListingCard — reusable card used on Home, Search, Saved, and Dashboard pages.
// Navigates to /listing/:id (house) or /room/:id (room sharing) on click.
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, BedDouble, Bath, Maximize2, Users, Star, CalendarDays } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { formatRent, getPrimaryPhoto, timeAgo, truncate } from '../../utils/helpers';
import SaveButton from './SaveButton';
import AmenityBadge from './AmenityBadge';

const PLACEHOLDER = '/images/listing-placeholder.svg';

const GENDER_LABEL = { MALE: 'Male Only', FEMALE: 'Female Only', ANY: 'Any Gender' };
const GENDER_COLOR = {
  MALE: 'badge-primary',
  FEMALE: 'bg-pink-100 text-pink-700 badge',
  ANY: 'badge-gray',
};

/**
 * @param {object}   listing   - Full listing object from API
 * @param {Function} onSave    - Called after save/unsave toggles
 * @param {boolean}  isSaved   - Whether the current user has saved this listing
 */
const ListingCard = ({ listing, onSave, isSaved = false }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!listing) return null;

  const isHouse = listing.type === 'HOUSE_RENTAL';
  const detailPath = isHouse ? `/listing/${listing.id}` : `/room/${listing.id}`;
  const photoUrl = getPrimaryPhoto(listing) || PLACEHOLDER;

  const handleCardClick = () => navigate(detailPath);

  return (
    <article
      className="card-hover cursor-pointer group overflow-hidden flex flex-col"
      onClick={handleCardClick}
      role="link"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleCardClick()}
      aria-label={`${listing.title} – ${formatRent(listing.rent)} per month`}
    >
      {/* ── Photo ── */}
      <div className="relative aspect-[4/3] overflow-hidden bg-surface-100">
        <img
          src={photoUrl}
          alt={listing.title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => { e.currentTarget.src = PLACEHOLDER; }}
        />

        {/* Type badge — top-left */}
        <span
          className={`absolute top-3 left-3 badge text-xs font-semibold shadow-sm
            ${isHouse ? 'badge-primary' : 'bg-accent-100 text-accent-700 badge'}`}
        >
          {isHouse ? 'House Rental' : 'Room Sharing'}
        </span>

        {/* Save button — top-right (auth-gated) */}
        {(user || true) /* render always; SaveButton handles auth redirect */ && (
          <div className="absolute top-3 right-3">
            <SaveButton
              listingId={listing.id}
              isSaved={isSaved}
              onToggle={onSave}
            />
          </div>
        )}

        {/* Time ago chip */}
        <span className="absolute bottom-3 right-3 bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-0.5 rounded-full">
          {timeAgo(listing.createdAt)}
        </span>
      </div>

      {/* ── Body ── */}
      <div className="flex flex-col flex-1 p-4 gap-3">

        {/* Rent */}
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-surface-900 font-display">
            {formatRent(listing.rent)}
          </span>
          <span className="text-sm text-surface-400">/mo</span>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-surface-800 leading-snug text-sm line-clamp-2">
          {truncate(listing.title, 70)}
        </h3>

        {/* Location */}
        <div className="flex items-start gap-1 text-surface-500 text-xs">
          <MapPin size={13} className="flex-shrink-0 mt-0.5 text-primary-400" />
          <span className="line-clamp-1">
            {[listing.address, listing.city].filter(Boolean).join(', ')}
          </span>
        </div>

        {/* Stats row */}
        {isHouse ? (
          <div className="flex items-center gap-3 text-xs text-surface-600">
            {listing.bedrooms != null && (
              <span className="flex items-center gap-1">
                <BedDouble size={13} className="text-primary-400" />
                {listing.bedrooms} {listing.bedrooms === 1 ? 'Bed' : 'Beds'}
              </span>
            )}
            {listing.bathrooms != null && (
              <span className="flex items-center gap-1">
                <Bath size={13} className="text-primary-400" />
                {listing.bathrooms} {listing.bathrooms === 1 ? 'Bath' : 'Baths'}
              </span>
            )}
            {listing.areaSqFt != null && (
              <span className="flex items-center gap-1">
                <Maximize2 size={13} className="text-primary-400" />
                {listing.areaSqFt} sq.ft
              </span>
            )}
          </div>
        ) : (
          listing.genderPreference && (
            <span className={GENDER_COLOR[listing.genderPreference] || 'badge-gray'}>
              <Users size={11} />
              {GENDER_LABEL[listing.genderPreference] ?? listing.genderPreference}
            </span>
          )
        )}

        {/* Available from */}
        {listing.availableFrom && (
          <div className="flex items-center gap-1 text-xs text-surface-500">
            <CalendarDays size={12} className="text-primary-400" />
            Available from{' '}
            {new Date(listing.availableFrom).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </div>
        )}

        {/* Divider */}
        <hr className="border-surface-100" />

        {/* Owner row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {listing.owner?.profilePhoto ? (
              <img
                src={listing.owner.profilePhoto}
                alt={listing.owner.name}
                className="w-7 h-7 rounded-full object-cover ring-2 ring-surface-100"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold uppercase">
                {listing.owner?.name?.[0] ?? '?'}
              </div>
            )}
            <span className="text-xs font-medium text-surface-700 truncate max-w-[100px]">
              {listing.owner?.name ?? 'Owner'}
            </span>
          </div>

          {listing.owner?.rating != null && (
            <div className="flex items-center gap-0.5 text-xs text-amber-500 font-medium">
              <Star size={12} className="fill-amber-400 text-amber-400" />
              {Number(listing.owner.rating).toFixed(1)}
            </div>
          )}
        </div>

        {/* CTA */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); navigate(detailPath); }}
          className="btn-primary btn-sm w-full mt-auto"
        >
          View Details
        </button>
      </div>
    </article>
  );
};

export default ListingCard;
