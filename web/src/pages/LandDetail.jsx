// LandDetail — detail page for land/plot sales
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { MapPin, Share2, Flag, Calendar, Eye, MessageCircle, LandPlot } from 'lucide-react';

import { listingsAPI, savedAPI } from '../services/endpoints';
import { useAuth } from '../context/AuthContext';
import { formatRent, formatNumber, timeAgo } from '../utils/helpers';
import MapView from '../components/MapView';
import NearbyPlaces from '../components/NearbyPlaces';
import ReviewCard from '../components/ReviewCard';
import ReviewForm from '../components/ReviewForm';
import ImageGallery from '../components/ImageGallery';
import Navbar from '../components/layout/Navbar';
import SaveButton from '../components/listing/SaveButton';
import { Modal, Button, Avatar, Spinner } from '../components/ui';
import PageLoader from '../components/ui/PageLoader';

export default function LandDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();
  const { t } = useTranslation();

  const { data, isLoading } = useQuery({
    queryKey: ['listing', id],
    queryFn: () => listingsAPI.getOne(id).then((r) => r.data.data),
  });

  const { mutate: toggleSave } = useMutation({
    mutationFn: () => savedAPI.toggle(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['listing', id] }),
  });

  const [showReport, setShowReport] = useState(false);
  const [showContact, setShowContact] = useState(false);

  if (isLoading) return <PageLoader />;
  if (!data) return <div className="min-h-screen flex items-center justify-center text-surface-500">{t('landNotFound')}</div>;

  const photos = data.photos || [];
  const isOwner = user?.id === data.ownerId;

  return (
    <div className="min-h-screen bg-surface-50">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 pt-24 pb-16">
        {/* Gallery */}
        {photos.length > 0 && (
          <div className="mb-8">
            <ImageGallery photos={photos} title={data.title} />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left — Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title + badges */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="badge bg-amber-100 text-amber-700">
                  <LandPlot size={12} /> {t('landSale')}
                </span>
                <span className="text-xs text-surface-400">{timeAgo(data.createdAt)}</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-surface-900 font-display">{data.title}</h1>
              <div className="flex items-center gap-1 mt-2 text-surface-500 text-sm">
                <MapPin size={14} className="text-primary-400" />
                {[data.address, data.city, data.state].filter(Boolean).join(', ')}
              </div>
            </div>

            {/* Key stats */}
            <div className="card p-5">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="text-center p-3 bg-amber-50 rounded-xl">
                  <p className="text-2xl font-bold text-amber-700 font-display">{formatRent(data.rent)}</p>
                  <p className="text-xs text-surface-500 mt-1">{t('totalPrice')}</p>
                </div>
                {data.areaSqFt && (
                  <div className="text-center p-3 bg-primary-50 rounded-xl">
                    <p className="text-2xl font-bold text-primary-700 font-display">{data.areaSqFt}</p>
                    <p className="text-xs text-surface-500 mt-1">{t('sqft')}</p>
                  </div>
                )}
                <div className="text-center p-3 bg-surface-50 rounded-xl">
                  <p className="text-sm font-semibold text-surface-700">{data.status}</p>
                  <p className="text-xs text-surface-500 mt-1">{t('status')}</p>
                </div>
              </div>
            </div>

            {/* Description */}
            {data.description && (
              <div className="card p-5">
                <h2 className="font-display font-semibold text-lg mb-3">{t('description')}</h2>
                <p className="text-surface-600 text-sm leading-relaxed whitespace-pre-line">{data.description}</p>
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

            <NearbyPlaces lat={data.latitude} lng={data.longitude} />

            {/* Reviews */}
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display font-semibold text-lg">{t('reviews')}</h2>
                {user && !isOwner && (
                  <ReviewForm listingId={data.id} receiverId={data.ownerId} />
                )}
              </div>
              {data.reviews?.length > 0 ? (
                <div className="space-y-3">
                  {data.reviews.map((review) => <ReviewCard key={review.id} review={review} />)}
                </div>
              ) : (
                <p className="text-sm text-surface-400 text-center py-4">{t('noReviewsYet')}</p>
              )}
            </div>
          </div>

          {/* Right — Sidebar */}
          <div>
            <div className="card p-6 sticky top-24 space-y-4">
              {/* Price */}
              <div className="text-center p-4 bg-amber-50 rounded-2xl">
                <p className="text-3xl font-bold text-amber-700 font-display">{formatRent(data.rent)}</p>
                <p className="text-sm text-surface-500">{t('totalPrice')}</p>
              </div>

              {/* Available from */}
              {data.availableFrom && (
                <div className="flex items-center gap-2 text-sm text-surface-600">
                  <Calendar size={14} className="text-primary-400" />
                  {t('availableFromLabel')} {new Date(data.availableFrom).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              )}

              {/* Views */}
              <div className="flex items-center gap-2 text-xs text-surface-400">
                <Eye size={13} /> {formatNumber(data.views)} {t('views')}
              </div>

              {/* Actions */}
              {!isOwner && (
                <div className="space-y-2 pt-2">
                  <Button onClick={() => setShowContact(true)} className="w-full" variant="primary">
                    <MessageCircle size={16} /> {t('contactOwner')}
                  </Button>
                  <div className="flex gap-2">
                    <SaveButton listingId={data.id} isSaved={data.isSaved} onToggle={toggleSave} className="flex-1" />
                    <button onClick={() => setShowReport(true)} className="btn-outline btn-sm flex-1 gap-1">
                      <Flag size={14} /> {t('report')}
                    </button>
                  </div>
                </div>
              )}

              {/* Share */}
              <button onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success(t('copied')); }} className="btn-ghost btn-sm w-full gap-1 text-surface-500">
                <Share2 size={14} /> {t('shareListing')}
              </button>

              {/* Owner info */}
              <hr className="border-surface-100" />
              <div className="flex items-center gap-3">
                <Avatar src={data.owner?.profileImage} name={data.owner?.name} size="md" />
                <div>
                  <p className="text-sm font-semibold text-surface-800">{data.owner?.name}</p>
                  <p className="text-xs text-surface-400">{t('owner')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Contact modal */}
      <Modal isOpen={showContact} onClose={() => setShowContact(false)} title={t('contactOwner')}>
        <div className="space-y-3 text-sm">
          {data.owner?.name && <p><strong>{t('nameLabel')}</strong> {data.owner.name}</p>}
          <p className="text-surface-500">{t('chatToContact')}</p>
          <Button onClick={() => { setShowContact(false); navigate('/dashboard/requests'); }} className="w-full" variant="primary">{t('goToRequests')}</Button>
        </div>
      </Modal>

      {/* Report modal */}
      <Modal isOpen={showReport} onClose={() => setShowReport(false)} title={t('reportListing')}>
        <p className="text-sm text-surface-500">{t('contactSupport')}</p>
      </Modal>
    </div>
  );
}
