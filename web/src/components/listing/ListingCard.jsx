// ListingCard — reusable card used on Home, Search, Saved, and Dashboard pages.
// Navigates to /listing/:id (house) or /room/:id (room sharing) on click.
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, BedDouble, Bath, Maximize2, Users, Star, CalendarDays, LandPlot } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { formatRent, getPrimaryPhoto, timeAgo, truncate } from '../../utils/helpers';
import SaveButton from './SaveButton';
import Avatar from '../ui/Avatar';

const PLACEHOLDER = '/images/listing-placeholder.svg';

const GENDER_LABEL = { MALE: 'Male Only', FEMALE: 'Female Only', ANY: 'Any Gender' };
const GENDER_COLOR = {
  MALE: 'bg-primary-100 text-primary-700 badge',
  FEMALE: 'bg-pink-100 text-pink-700 badge',
  ANY: 'badge-gray',
};

const ListingCard = ({ listing, onSave, isSaved = false }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!listing) return null;

  const isHouse = listing.type === 'HOUSE_RENTAL';
  const isHostel = listing.type === 'HOSTEL';
  const isLand = listing.type === 'LAND_SALE';
  const detailPath = isLand ? `/land/${listing.id}` : isHouse ? `/listing/${listing.id}` : isHostel ? `/hostel/${listing.id}` : `/room/${listing.id}`;
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
      {/* Photo */}
      <div className="relative aspect-[4/3] overflow-hidden bg-surface-100 flex items-center justify-center">
        <img
          src={photoUrl}
          alt={listing.title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => { e.currentTarget.src = PLACEHOLDER; }}
        />

        {/* Type badge */}
        <span
          className={`absolute top-3 left-3 badge text-[11px] font-semibold shadow-sm backdrop-blur-sm
            ${isLand ? 'bg-amber-500/90 text-white' : isHouse ? 'bg-primary-600/90 text-white' : isHostel ? 'bg-emerald-500/90 text-white' : 'bg-accent-600/90 text-white'}`}
        >
          {isLand ? 'Land Sale' : isHouse ? 'House Rental' : isHostel ? 'Hostel / PG' : 'Room Sharing'}
        </span>

        {/* Booked badge */}
        {listing.status === 'RENTED' && (
          <span className="absolute top-3 left-1/2 -translate-x-1/2 bg-surface-900/80 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full">
            Booked
          </span>
        )}

        {/* Save button */}
        {(user || true) && (
          <div className="absolute top-3 right-3">
            <SaveButton
              listingId={listing.id}
              isSaved={isSaved}
              onToggle={onSave}
            />
          </div>
        )}

        {/* Time ago chip */}
        <span className="absolute bottom-3 right-3 bg-surface-900/60 backdrop-blur-sm text-white text-[11px] px-2 py-0.5 rounded-full font-medium">
          {timeAgo(listing.createdAt)}
        </span>
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-4 gap-2.5">

        {/* Rent */}
        <div className="flex items-baseline gap-1">
          <span className="text-xl font-bold text-surface-900 font-display">
            {formatRent(listing.rent)}
          </span>
          <span className="text-xs text-surface-400 font-medium">/mo</span>
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

        {/* Stats row */}
        {isLand ? (
          <div className="flex items-center gap-3 text-xs text-surface-600">
            {listing.areaSqFt != null && (
              <span className="flex items-center gap-1">
                <Maximize2 size={12} className="text-amber-500" />
                {listing.areaSqFt} sq.ft
              </span>
            )}
            <span className="flex items-center gap-1">
              <LandPlot size={12} className="text-amber-500" />
              For Sale
            </span>
          </div>
        ) : isHouse ? (
          <div className="flex items-center gap-3 text-xs text-surface-600">
            {listing.bedrooms != null && (
              <span className="flex items-center gap-1">
                <BedDouble size={12} className="text-primary-400" />
                {listing.bedrooms} {listing.bedrooms === 1 ? 'Bed' : 'Beds'}
              </span>
            )}
            {listing.bathrooms != null && (
              <span className="flex items-center gap-1">
                <Bath size={12} className="text-primary-400" />
                {listing.bathrooms} {listing.bathrooms === 1 ? 'Bath' : 'Baths'}
              </span>
            )}
            {listing.areaSqFt != null && (
              <span className="flex items-center gap-1">
                <Maximize2 size={12} className="text-primary-400" />
                {listing.areaSqFt} sq.ft
              </span>
            )}
          </div>
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
            <span className={GENDER_COLOR[listing.genderPreference] || 'badge-gray'}>
              <Users size={11} />
              {GENDER_LABEL[listing.genderPreference] ?? listing.genderPreference}
            </span>
          )
        )}

        {/* Available from */}
        {listing.availableFrom && (
          <div className="flex items-center gap-1 text-xs text-surface-500">
            <CalendarDays size={11} className="text-primary-400" />
            Available from{' '}
            {new Date(listing.availableFrom).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </div>
        )}

        {/* Divider */}
        <div className="border-t border-surface-100 mt-auto pt-2.5" />

        {/* Owner row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Avatar src={listing.owner?.profileImage} name={listing.owner?.name} size="sm" />
            <span className="text-xs font-medium text-surface-700 truncate max-w-[100px]">
              {listing.owner?.name ?? 'Owner'}
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
