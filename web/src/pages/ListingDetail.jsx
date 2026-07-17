// Listing Detail Page — main property detail page
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import {
  MapPin, Bed, Bath, Square, Car, Wind, Wifi, Refrigerator,
  WashingMachine, Dumbbell, Shield, Share2, Flag,
  Calendar, Eye, Heart, MessageCircle
} from 'lucide-react';

import { listingsAPI, requestsAPI, savedAPI } from '../services/endpoints';
import { useAuth } from '../context/AuthContext';
import { formatRent, formatNumber, getAmenityList, timeAgo } from '../utils/helpers';
import MapView from '../components/MapView';
import NearbyPlaces from '../components/NearbyPlaces';
import ReviewCard from '../components/ReviewCard';
import ReviewForm from '../components/ReviewForm';
import ImageGallery from '../components/ImageGallery';
import Navbar from '../components/layout/Navbar';
import { Modal, Button, Avatar, Spinner, StarRating } from '../components/ui';
import PageLoader from '../components/ui/PageLoader';

const amenityIcons = {
  WiFi: Wifi, AC: Wind, Parking: Car, Fridge: Refrigerator,
  'Washing Machine': WashingMachine, Gym: Dumbbell, Security: Shield,
};

const ListingDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [requestMsg, setRequestMsg] = useState('');
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const { t } = useTranslation();

  const [localSaved, setLocalSaved] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['listing', id],
    queryFn: () => listingsAPI.getOne(id).then((r) => r.data.data),
  });

  useEffect(() => {
    if (data) {
      setLocalSaved(data.isSaved);
    }
  }, [data?.isSaved]);

  const { mutate: sendRequest, isPending: requesting } = useMutation({
    mutationFn: () => requestsAPI.create({ listingId: id, message: requestMsg }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['requests'] });
      qc.invalidateQueries({ queryKey: ['listings'] });
      toast.success(t('requestSent'));
      setShowRequestModal(false);
    },
    onError: (err) => toast.error(err?.response?.data?.message || t('failedToSend')),
  });

  const { mutate: toggleSave } = useMutation({
    mutationFn: () => localSaved ? savedAPI.unsave(id) : savedAPI.save(id),
    onMutate: () => {
      setLocalSaved((prev) => !prev);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['listing', id] });
      qc.invalidateQueries({ queryKey: ['saved'] });
      toast.success(localSaved ? t('saved') : t('removedFromSaved'));
    },
    onError: () => {
      setLocalSaved((prev) => !prev);
      toast.error(t('somethingWrong'));
    },
  });

  if (isLoading) return <PageLoader />;
  if (isError || !data) return (
    <>
      <Navbar />
      <div className="min-h-screen flex items-center justify-center text-surface-500">{t('listingNotFound')}</div>
    </>
  );

  const photos = data.photos || [];
  const amenities = getAmenityList(data.amenities);

  return (
    <>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ─ Photo Gallery ─────────────────────────────── */}
        <ImageGallery photos={photos} title={data.title} />

        {/* ─ Main Content ──────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left — details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <div>
              <h1 className="font-display font-bold text-3xl text-surface-900 mb-2">{data.title}</h1>
              <div className="flex items-center gap-2 text-surface-500 text-sm mb-3">
                <MapPin size={15} /> {data.address}, {data.city}, {data.state}
              </div>
              <div className="flex items-center gap-4 text-sm text-surface-400">
                <span className="flex items-center gap-1"><Eye size={14} /> {formatNumber(data.views)} {t('views')}</span>
                <span className="flex items-center gap-1"><Calendar size={14} /> {t('listed')} {timeAgo(data.createdAt)}</span>
              </div>
            </div>

            {/* Key stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { icon: Bed, label: t('bedrooms'), value: data.bedrooms },
                { icon: Bath, label: t('bathrooms'), value: data.bathrooms },
                { icon: Square, label: t('area'), value: data.areaSqFt ? `${data.areaSqFt} sqft` : t('na') },
                { icon: Car, label: t('parking'), value: data.parking ? t('yesLabel') : t('noLabel') },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="card p-4 text-center">
                  <Icon size={20} className="text-primary-500 mx-auto mb-1" />
                  <p className="text-xs text-surface-400">{label}</p>
                  <p className="font-semibold text-surface-900">{value}</p>
                </div>
              ))}
            </div>

            {/* Description */}
            <div className="card p-5">
              <h2 className="font-display font-semibold text-lg mb-3">{t('aboutThisPlace')}</h2>
              <p className="text-surface-600 leading-relaxed whitespace-pre-line">{data.description}</p>
            </div>

            {/* Amenities */}
            {amenities.length > 0 && (
              <div className="card p-5">
                <h2 className="font-display font-semibold text-lg mb-4">{t('amenities')}</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {amenities.map((a) => {
                    const Icon = amenityIcons[a] || Shield;
                    return (
                      <div key={a} className="flex items-center gap-2 p-3 bg-primary-50 rounded-xl">
                        <Icon size={16} className="text-primary-600" />
                        <span className="text-sm text-primary-700 font-medium">{a}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Map */}
            <div className="card p-5">
              <h2 className="font-display font-semibold text-lg mb-4">{t('location')}</h2>
              <MapView lat={data.latitude} lng={data.longitude} title={data.title} className="h-64" />
              {data.isLocationExact ? (
                <p className="text-xs text-success-600 mt-2 text-center font-medium">{t('exactLocation')}</p>
              ) : (
                <p className="text-xs text-amber-600 mt-2 text-center font-medium">{t('approxLocation')}</p>
              )}
            </div>

            {/* Nearby Places */}
            <NearbyPlaces lat={data.latitude} lng={data.longitude} />

            {/* Reviews */}
            {data.reviews?.length > 0 && (
              <div>
                <h2 className="font-display font-semibold text-lg mb-4">{t('reviews')}</h2>
                <div className="space-y-3">
                  {data.reviews.map((r) => <ReviewCard key={r.id} review={r} />)}
                </div>
              </div>
            )}
          </div>

          {/* Right — pricing + CTA */}
          <div className="space-y-4">
            {/* Pricing card */}
            <div className="card p-6 sticky top-24">
              <div className="mb-4">
                <span className="font-display font-bold text-3xl text-surface-900">{formatRent(data.rent)}</span>
                <span className="text-surface-400 text-sm">{t('month')}</span>
              </div>
              <div className="space-y-2 text-sm mb-5">
                <div className="flex justify-between text-surface-600">
                  <span>{t('deposit')}</span>
                  <span className="font-medium">{formatRent(data.deposit)}</span>
                </div>
                {data.maintenance > 0 && (
                  <div className="flex justify-between text-surface-600">
                    <span>{t('maintenance')}</span>
                    <span className="font-medium">{formatRent(data.maintenance)}{t('mo')}</span>
                  </div>
                )}
                <div className="flex justify-between text-surface-600">
                  <span>{t('availableFrom')}</span>
                  <span className="font-medium">{new Date(data.availableFrom).toLocaleDateString('en-IN')}</span>
                </div>
              </div>

              {/* Actions */}
              {user ? (
                <>
                  {user.id === data.ownerId ? (
                    <Button
                      variant="primary"
                      size="lg"
                      className="w-full mb-3"
                      onClick={() => navigate(`/dashboard/listings/${data.id}/edit`)}
                    >
                      Edit Listing
                    </Button>
                  ) : data.status !== 'ACTIVE' ? (
                    <div className={`w-full mb-3 p-3 rounded-xl text-center text-sm font-medium ${
                      data.status === 'RENTED' ? 'bg-primary-50 text-primary-700' : 'bg-amber-50 text-amber-700'
                    }`}>
                      {data.status === 'RENTED' ? t('bookedMessage') : t('inactiveMessage')}
                    </div>
                  ) : (
                    <Button
                      variant="primary"
                      size="lg"
                      className="w-full mb-3"
                      onClick={() => setShowRequestModal(true)}
                    >
                      <MessageCircle size={18} /> {t('sendRequest')}
                    </Button>
                  )}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="md"
                      className="flex-1"
                      onClick={() => toggleSave()}
                    >
                      <Heart size={16} className={localSaved ? 'fill-red-500 text-red-500' : 'text-surface-450 group-hover:text-red-400'} />
                      {localSaved ? t('saved') : t('save')}
                    </Button>
                    <Button variant="secondary" size="md" onClick={() => setShowReportModal(true)}>
                      <Flag size={16} />
                    </Button>
                    <Button variant="secondary" size="md" onClick={() => { navigator.share?.({ url: window.location.href }); }}>
                      <Share2 size={16} />
                    </Button>
                  </div>
                </>
              ) : (
                <Button variant="primary" size="lg" className="w-full" onClick={() => navigate('/login')}>
                  {t('loginToContact')}
                </Button>
              )}
            </div>

            {/* Owner card */}
            <div className="card p-5">
              <h3 className="font-display font-semibold text-base mb-3">{t('listedBy')}</h3>
              <div className="flex items-center gap-3">
                <Avatar src={data.owner?.profileImage} name={data.owner?.name} size="md" />
                <div className="flex-1">
                  <p className="font-semibold text-surface-900">{data.owner?.name}</p>
                  <div className="flex items-center gap-1 text-sm">
                    <StarRating value={data.owner?.avgRating || 0} size={13} />
                    <span className="font-medium">{data.owner?.avgRating?.toFixed(1) || t('new')}</span>
                    <span className="text-surface-400">({data.owner?.totalRatings || 0})</span>
                  </div>
                </div>
              </div>
              {user && user.id !== data.ownerId && (
                  <Button variant="outline" size="md" className="w-full mt-3" onClick={() => setShowReviewForm(true)}>
                    {t('writeReview')}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─ Request Modal ──────────────────────────────── */}
      <Modal isOpen={showRequestModal} onClose={() => setShowRequestModal(false)} title={t('sendRentalRequest')} size="sm">
        <div className="space-y-4">
          <p className="text-sm text-surface-600">
            {t('sendRequestDesc')}
          </p>
          <textarea
            value={requestMsg}
            onChange={(e) => setRequestMsg(e.target.value)}
            placeholder={t('introduceYourself')}
            rows={4}
            className="input resize-none"
          />
          <div className="flex gap-3">
            <Button variant="secondary" size="md" className="flex-1" onClick={() => setShowRequestModal(false)}>{t('cancel')}</Button>
            <Button variant="primary" size="md" className="flex-1" loading={requesting} onClick={() => sendRequest()}>
              {t('sendRequest')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ─ Report Modal ───────────────────────────────── */}
      <Modal isOpen={showReportModal} onClose={() => setShowReportModal(false)} title={t('reportListing')} size="sm">
        <ReportForm listingId={id} onClose={() => setShowReportModal(false)} />
      </Modal>

      <ReviewForm
        isOpen={showReviewForm}
        onClose={() => setShowReviewForm(false)}
        receiverId={data?.ownerId}
        listingId={id}
        listingTitle={data?.title}
      />
    </>
  );
};

// Inline report form (used only here)
const REPORT_REASON_KEYS = [
  { value: 'FAKE_LISTING', key: 'fakeListing' },
  { value: 'WRONG_PRICE', key: 'wrongPrice' },
  { value: 'ALREADY_RENTED', key: 'alreadyRented' },
  { value: 'SPAM', key: 'spam' },
  { value: 'DUPLICATE', key: 'duplicate' },
  { value: 'WRONG_LOCATION', key: 'wrongLocation' },
  { value: 'SCAM', key: 'scam' },
  { value: 'OTHER', key: 'other' },
];

import { reportsAPI } from '../services/endpoints';

const ReportForm = ({ listingId, onClose }) => {
  const [reason, setReason] = useState('FAKE_LISTING');
  const [details, setDetails] = useState('');
  const { t } = useTranslation();
  const { mutate, isPending } = useMutation({
    mutationFn: () => reportsAPI.create({ listingId, reason, details }),
    onSuccess: () => { toast.success(t('reportSubmitted')); onClose(); },
    onError: () => toast.error(t('failedToSubmitReport')),
  });
  return (
    <div className="space-y-4">
      <select value={reason} onChange={(e) => setReason(e.target.value)} className="input">
        {REPORT_REASON_KEYS.map((r) => <option key={r.value} value={r.value}>{t(r.key)}</option>)}
      </select>
      <textarea value={details} onChange={(e) => setDetails(e.target.value)} placeholder={t('additionalDetails')} rows={3} className="input resize-none" />
      <div className="flex gap-3">
        <Button variant="secondary" size="md" className="flex-1" onClick={onClose}>{t('cancel')}</Button>
        <Button variant="danger" size="md" className="flex-1" loading={isPending} onClick={() => mutate()}>{t('submitReport')}</Button>
      </div>
    </div>
  );
};

export default ListingDetail;
