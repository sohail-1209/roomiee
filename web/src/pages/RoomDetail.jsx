// Room Detail Page — reuses same components as ListingDetail but for Room Sharing
// Shares MapView, NearbyPlaces, ReviewCard, Navbar components
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { MapPin, Heart, MessageCircle } from 'lucide-react';
import { listingsAPI, requestsAPI, savedAPI } from '../services/endpoints';
import { useAuth } from '../context/AuthContext';
import { formatRent } from '../utils/helpers';
import MapView from '../components/MapView';
import NearbyPlaces from '../components/NearbyPlaces';
import ReviewCard from '../components/ReviewCard';
import ReviewForm from '../components/ReviewForm';
import ImageGallery from '../components/ImageGallery';
import Navbar from '../components/layout/Navbar';
import SEO from '../components/SEO';
import JsonLd from '../components/JsonLd';
import Breadcrumbs from '../components/Breadcrumbs';
import { Modal, Button, Badge, Avatar, StarRating } from '../components/ui';
import PageLoader from '../components/ui/PageLoader';

const RoomDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { t } = useTranslation();
  const [requestMsg, setRequestMsg] = useState('');

  const RuleTag = ({ label, allowed }) => (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium ${allowed ? 'bg-success-50 text-success-600' : 'bg-danger-50 text-danger-500'}`}>
      <span>{allowed ? '✅' : '❌'}</span> {label} {allowed ? t('allowed') : t('notAllowed')}
    </div>
  );
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [localSaved, setLocalSaved] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['listing', id],
    queryFn: () => listingsAPI.getOne(id).then((r) => r.data.data),
  });

  useEffect(() => {
    if (data) {
      setLocalSaved(data.isSaved);
    }
  }, [data?.isSaved]);

  const { mutate: sendRequest, isPending: requesting } = useMutation({
    mutationFn: () => requestsAPI.create({ listingId: id, message: requestMsg, price: data?.rent }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['requests'] });
      qc.invalidateQueries({ queryKey: ['listings'] });
      toast.success(t('requestSent'));
      setShowRequestModal(false);
    },
    onError: (err) => toast.error(err?.response?.data?.message || t('failedToSend')),
  });

  const { mutate: toggleSave } = useMutation({
    mutationFn: (currentlySaved) => currentlySaved ? savedAPI.unsave(id) : savedAPI.save(id),
    onMutate: (currentlySaved) => {
      setLocalSaved(!currentlySaved);
    },
    onSuccess: (res, currentlySaved) => {
      qc.invalidateQueries({ queryKey: ['listing', id] });
      qc.invalidateQueries({ queryKey: ['saved'] });
      toast.success(currentlySaved ? t('removedFromSaved') : t('saved'));
    },
    onError: (err, currentlySaved) => {
      setLocalSaved(currentlySaved);
      toast.error(t('somethingWrong') || 'Something went wrong');
    },
  });

  if (isLoading) return <PageLoader />;

  const rs = data?.roomSharing;
  const photos = data?.photos || [];
  const primaryPhoto = photos.find((p) => p.isPrimary)?.url || photos[0]?.url || 'https://res.cloudinary.com/dldgj84bm/image/upload/v1784198779/ChatGPT_Image_Jul_16_2026_04_15_03_PM_wtomms.png';

  const listingSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: data?.title,
    description: `${data?.title} - Shared room in ${data?.city}. Rent: ₹${data?.rent}${data?.rentPeriod === 'per year' ? '/yr' : data?.rentPeriod === 'custom' ? '' : '/month'}.`,
    image: primaryPhoto,
    url: `https://quikden.in/room/${id}`,
    offers: {
      '@type': 'Offer',
      price: data?.rent,
      priceCurrency: 'INR',
      availability: data?.status === 'ACTIVE' ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
    brand: { '@type': 'Organization', name: 'Quikden' },
  };

  return (
    <>
      <SEO
        title={`${data?.title} — Shared Room in ${data?.city}`}
        description={`${data?.title} available in ${data?.city}. Shared room, ₹${data?.rent}${data?.rentPeriod === 'per year' ? '/yr' : data?.rentPeriod === 'custom' ? '' : '/month'}. ${rs?.genderRequired ? rs.genderRequired + ' preferred' : 'All genders'}. Zero brokerage on Quikden.`}
        image={primaryPhoto}
        url={`/room/${id}`}
        type="article"
        city={data?.city}
      />
      <JsonLd data={listingSchema} />
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumbs items={[
          { label: 'Home', href: '/' },
          { label: 'Search', href: '/search' },
          { label: data?.title },
        ]} />
        {/* Gallery */}
        <ImageGallery photos={photos} title={data?.title} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="warning">{t('roomSharing')}</Badge>
                {rs?.genderRequired !== 'ANY' && <Badge variant="primary">{rs?.genderRequired === 'FEMALE' ? t('femaleOnly') : t('maleOnly')}</Badge>}
              </div>
              <h1 className="font-display font-bold text-3xl text-surface-900 mb-2">{data?.title}</h1>
              <div className="flex items-center gap-2 text-surface-500 text-sm">
                <MapPin size={15} /> {data?.address}, {data?.city}
              </div>
            </div>

            {/* Roommate preferences */}
            {rs && (
              <div className="card p-5">
                <h2 className="font-display font-semibold text-lg mb-4">{t('roommatePreferences')}</h2>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {rs.minAge && <div className="text-sm"><span className="text-surface-400">{t('age')}</span> <span className="font-medium">{rs.minAge}–{rs.maxAge || '∞'}</span></div>}
                  {rs.occupationPref !== 'ANY' && <div className="text-sm"><span className="text-surface-400">{t('occupation')}</span> <span className="font-medium">{rs.occupationPref}</span></div>}
                  <div className="text-sm"><span className="text-surface-400">{t('currentOccupants')}</span> <span className="font-medium">{rs.currentOccupants}/{rs.totalRooms}</span></div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <RuleTag label={t('smoking')} allowed={rs.smoking} />
                  <RuleTag label={t('drinking')} allowed={rs.drinking} />
                  <RuleTag label={t('vegOnly')} allowed={rs.vegOnly} />
                  <RuleTag label={t('pets')} allowed={rs.petsAllowed} />
                </div>
              </div>
            )}

            <div className="card p-5">
              <h2 className="font-display font-semibold text-lg mb-3">{t('description')}</h2>
              <p className="text-surface-600 leading-relaxed">{data?.description}</p>
            </div>

            <div className="card p-5">
              <h2 className="font-display font-semibold text-lg mb-4">{t('location')}</h2>
              <MapView lat={data?.latitude} lng={data?.longitude} title={data?.title} className="h-64" />
              <p className="text-xs text-success-600 mt-2 text-center font-medium">{t('exactLocation')}</p>
            </div>

            <NearbyPlaces lat={data?.latitude} lng={data?.longitude} />

            {/* Reviews */}
            {data?.reviews?.length > 0 && (
              <div>
                <h2 className="font-display font-semibold text-lg mb-4">{t('reviews')}</h2>
                <div className="space-y-3">
                  {data.reviews.map((r) => <ReviewCard key={r.id} review={r} />)}
                </div>
              </div>
            )}
          </div>

          {/* Right */}
          <div>
            <div className="card p-6 sticky top-24 space-y-4">
              <div>
                <span className="font-display font-bold text-3xl text-surface-900">{formatRent(data?.rent)}</span>
                <span className="text-surface-400 text-sm">
                  {data?.rentPeriod === 'per year' ? '/year' : data?.rentPeriod === 'custom' ? '' : (t('month') || '/month')}
                </span>
              </div>
              <div className="text-sm text-surface-600 space-y-1">
                <div className="flex justify-between"><span>{t('deposit')}</span><span className="font-medium">{formatRent(data?.deposit)}</span></div>
                <div className="flex justify-between"><span>{t('availableFrom')}</span><span className="font-medium">{new Date(data?.availableFrom).toLocaleDateString('en-IN')}</span></div>
              </div>

              {user ? (
                <div className="space-y-2">
                  {user.id === data?.ownerId ? (
                    <Button variant="primary" size="lg" className="w-full" onClick={() => navigate(`/dashboard/listings/${data?.id}/edit`)}>
                      {t('editListing')}
                    </Button>
                  ) : data?.status !== 'ACTIVE' ? (
                    <div className={`w-full p-3 rounded-xl text-center text-sm font-medium ${
                      data?.status === 'RENTED' ? 'bg-primary-50 text-primary-700' : 'bg-amber-50 text-amber-700'
                    }`}>
                      {data?.status === 'RENTED' ? t('bookedMessage') : t('inactiveMessage')}
                    </div>
                  ) : (
                    <Button variant="primary" size="lg" className="w-full" onClick={() => setShowRequestModal(true)}>
                      <MessageCircle size={18} /> {t('sendRequest')}
                    </Button>
                  )}
                  <Button variant="outline" size="md" className="w-full" onClick={() => toggleSave(localSaved)}>
                    <Heart size={16} className={localSaved ? 'fill-red-500 text-red-500' : 'text-surface-450 group-hover:text-red-400'} />
                    {localSaved ? t('saved') : t('saveListing')}
                  </Button>
                </div>
              ) : (
                <Button variant="primary" size="lg" className="w-full" onClick={() => navigate('/login')}>{t('loginToRequest')}</Button>
              )}

              <div className="flex items-center gap-3 pt-4 border-t border-surface-100">
                <Avatar src={data?.owner?.profileImage} name={data?.owner?.name} size="md" />
                <div className="flex-1">
                  <p className="font-semibold text-sm">{data?.owner?.name}</p>
                  <div className="flex items-center gap-1 text-xs text-surface-400">
                    <StarRating value={data?.owner?.avgRating || 0} size={12} />
                    <span>{data?.owner?.avgRating?.toFixed(1) || t('new')}</span>
                    <span>({data?.owner?.totalRatings || 0})</span>
                  </div>
                </div>
              </div>

              {user && user.id !== data?.ownerId && (
                <Button variant="outline" size="md" className="w-full" onClick={() => setShowReviewForm(true)}>
                  {t('writeReview')}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <Modal isOpen={showRequestModal} onClose={() => setShowRequestModal(false)} title={t('requestToShareRoom')} size="sm">
        <div className="space-y-4">
          <textarea value={requestMsg} onChange={(e) => setRequestMsg(e.target.value)} placeholder={t('introduceShare')} rows={4} className="input resize-none" />
          <div className="flex gap-3">
            <Button variant="secondary" size="md" className="flex-1" onClick={() => setShowRequestModal(false)}>{t('cancel')}</Button>
            <Button variant="primary" size="md" className="flex-1" loading={requesting} onClick={() => sendRequest()}>{t('sendRequest')}</Button>
          </div>
        </div>
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

export default RoomDetail;
