// Hostel Detail Page — shows sharing tiers, rules, and booking
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { MapPin, BedDouble, Heart, MessageCircle } from 'lucide-react';
import { listingsAPI, requestsAPI, savedAPI } from '../services/endpoints';
import { useAuth } from '../context/AuthContext';
import { formatRent } from '../utils/helpers';
import MapView from '../components/MapView';
import NearbyPlaces from '../components/NearbyPlaces';
import ReviewCard from '../components/ReviewCard';
import ReviewForm from '../components/ReviewForm';
import ImageGallery from '../components/ImageGallery';
import Navbar from '../components/layout/Navbar';
import { Modal, Button, Badge, Avatar, StarRating } from '../components/ui';

const RuleTag = ({ label, allowed }) => (
  <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium ${allowed ? 'bg-success-50 text-success-600' : 'bg-danger-50 text-danger-500'}`}>
    <span>{allowed ? '✅' : '❌'}</span> {label} {allowed ? 'Allowed' : 'Not Allowed'}
  </div>
);

const HostelDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [requestMsg, setRequestMsg] = useState('');
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedTier, setSelectedTier] = useState(null);
  const [showReviewForm, setShowReviewForm] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['listing', id],
    queryFn: () => listingsAPI.getOne(id).then((r) => r.data.data),
  });

  const { mutate: sendRequest, isPending: requesting } = useMutation({
    mutationFn: () => requestsAPI.create({ listingId: id, message: requestMsg }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['requests'] });
      qc.invalidateQueries({ queryKey: ['listings'] });
      toast.success('Request sent!');
      setShowRequestModal(false);
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Failed'),
  });

  const { mutate: toggleSave } = useMutation({
    mutationFn: () => data?.isSaved ? savedAPI.unsave(id) : savedAPI.save(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['listing', id] });
      qc.invalidateQueries({ queryKey: ['saved'] });
      toast.success(data?.isSaved ? 'Removed' : '❤️ Saved!');
    },
  });

  if (isLoading) return <><Navbar /><div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" /></div></>;

  const hs = data?.hostelSharing;
  const tiers = hs?.tiers || [];
  const availableTiers = tiers.filter((t) => t.available);
  const photos = data?.photos || [];

  return (
    <>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Gallery */}
        <ImageGallery photos={photos} title={data?.title} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="success">🏨 Hostel / PG</Badge>
                {hs?.genderRequired !== 'ANY' && <Badge variant="primary">{hs?.genderRequired === 'FEMALE' ? '👩 Female Only' : '👨 Male Only'}</Badge>}
              </div>
              <h1 className="font-display font-bold text-3xl text-surface-900 mb-2">{data?.title}</h1>
              <div className="flex items-center gap-2 text-surface-500 text-sm">
                <MapPin size={15} /> {data?.address}, {data?.city}
              </div>
            </div>

            {/* Sharing Tiers */}
            {availableTiers.length > 0 && (
              <div className="card p-5">
                <h2 className="font-display font-semibold text-lg mb-4">Sharing Options</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {availableTiers.map((tier) => (
                    <div
                      key={tier.id}
                      onClick={() => setSelectedTier(tier)}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all text-center ${
                        selectedTier?.id === tier.id
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-surface-200 hover:border-primary-300'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-1 mb-2">
                        <BedDouble size={16} className="text-primary-500" />
                        <span className="font-bold text-lg text-surface-900">{tier.sharingSize}</span>
                      </div>
                      <p className="text-xs text-surface-500 mb-1">sharing</p>
                      <p className="font-display font-bold text-primary-600">{formatRent(tier.price)}<span className="text-xs font-normal text-surface-400">/mo</span></p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rules */}
            {hs && (
              <div className="card p-5">
                <h2 className="font-display font-semibold text-lg mb-4">House Rules</h2>
                <div className="grid grid-cols-2 gap-2">
                  <RuleTag label="Smoking" allowed={hs.smoking} />
                  <RuleTag label="Drinking" allowed={hs.drinking} />
                  <RuleTag label="Veg Only" allowed={hs.vegOnly} />
                  <RuleTag label="Pets" allowed={hs.petsAllowed} />
                </div>
              </div>
            )}

            <div className="card p-5">
              <h2 className="font-display font-semibold text-lg mb-3">Description</h2>
              <p className="text-surface-600 leading-relaxed">{data?.description}</p>
            </div>

            <div className="card p-5">
              <h2 className="font-display font-semibold text-lg mb-4">Location</h2>
              <MapView lat={data?.latitude} lng={data?.longitude} title={data?.title} className="h-64" />
              <p className="text-xs text-success-600 mt-2 text-center font-medium">📍 Exact location</p>
            </div>

            <NearbyPlaces lat={data?.latitude} lng={data?.longitude} />

            {/* Reviews */}
            {data?.reviews?.length > 0 && (
              <div>
                <h2 className="font-display font-semibold text-lg mb-4">Reviews</h2>
                <div className="space-y-3">
                  {data.reviews.map((r) => <ReviewCard key={r.id} review={r} />)}
                </div>
              </div>
            )}
          </div>

          {/* Right */}
          <div>
            <div className="card p-6 sticky top-24 space-y-4">
              {/* Price range */}
              <div>
                {availableTiers.length > 0 ? (
                  <div>
                    <span className="text-sm text-surface-400">Starting from</span>
                    <div className="flex items-baseline gap-1">
                      <span className="font-display font-bold text-3xl text-surface-900">
                        {formatRent(Math.min(...availableTiers.map((t) => t.price)))}
                      </span>
                      <span className="text-surface-400 text-sm">/mo</span>
                    </div>
                  </div>
                ) : (
                  <div>
                    <span className="font-display font-bold text-3xl text-surface-900">{formatRent(data?.rent)}</span>
                    <span className="text-surface-400 text-sm">/month</span>
                  </div>
                )}
              </div>

              <div className="text-sm text-surface-600 space-y-1">
                <div className="flex justify-between"><span>Deposit</span><span className="font-medium">{formatRent(data?.deposit)}</span></div>
                <div className="flex justify-between"><span>Available From</span><span className="font-medium">{new Date(data?.availableFrom).toLocaleDateString('en-IN')}</span></div>
                {selectedTier && (
                  <div className="flex justify-between text-primary-600 font-medium pt-2 border-t border-surface-100">
                    <span>Selected</span>
                    <span>{selectedTier.sharingSize}-sharing · {formatRent(selectedTier.price)}/mo</span>
                  </div>
                )}
              </div>

              {user ? (
                <div className="space-y-2">
                  {user.id === data?.ownerId ? (
                    <Button variant="primary" size="lg" className="w-full" onClick={() => navigate(`/dashboard/listings/${data?.id}/edit`)}>
                      Edit Listing
                    </Button>
                  ) : data?.status !== 'ACTIVE' ? (
                    <div className={`w-full p-3 rounded-xl text-center text-sm font-medium ${
                      data?.status === 'RENTED' ? 'bg-primary-50 text-primary-700' : 'bg-amber-50 text-amber-700'
                    }`}>
                      {data?.status === 'RENTED' ? '🏠 This listing is fully booked' : '⏸️ This listing is currently inactive'}
                    </div>
                  ) : (
                    <Button variant="primary" size="lg" className="w-full" onClick={() => setShowRequestModal(true)}>
                      <MessageCircle size={18} /> Send Request
                    </Button>
                  )}
                  <Button variant={data?.isSaved ? 'primary' : 'outline'} size="md" className="w-full" onClick={() => toggleSave()}>
                    <Heart size={16} className={data?.isSaved ? 'fill-white' : ''} />
                    {data?.isSaved ? 'Saved' : 'Save Listing'}
                  </Button>
                </div>
              ) : (
                <Button variant="primary" size="lg" className="w-full" onClick={() => navigate('/login')}>Login to Request</Button>
              )}

              <div className="flex items-center gap-3 pt-4 border-t border-surface-100">
                <Avatar src={data?.owner?.profileImage} name={data?.owner?.name} size="md" />
                <div className="flex-1">
                  <p className="font-semibold text-sm">{data?.owner?.name}</p>
                  <div className="flex items-center gap-1 text-xs text-surface-400">
                    <StarRating value={data?.owner?.avgRating || 0} size={12} />
                    <span>{data?.owner?.avgRating?.toFixed(1) || 'New'}</span>
                    <span>({data?.owner?.totalRatings || 0})</span>
                  </div>
                </div>
              </div>

              {user && user.id !== data?.ownerId && (
                <Button variant="outline" size="md" className="w-full" onClick={() => setShowReviewForm(true)}>
                  Write a Review
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <Modal isOpen={showRequestModal} onClose={() => setShowRequestModal(false)} title="Request to Stay" size="sm">
        <div className="space-y-4">
          {selectedTier && (
            <div className="p-3 bg-primary-50 rounded-xl text-sm text-primary-700 font-medium">
              Selected: {selectedTier.sharingSize}-sharing at {formatRent(selectedTier.price)}/mo
            </div>
          )}
          <textarea value={requestMsg} onChange={(e) => setRequestMsg(e.target.value)} placeholder="Introduce yourself — occupation, lifestyle, move-in date..." rows={4} className="input resize-none" />
          <div className="flex gap-3">
            <Button variant="secondary" size="md" className="flex-1" onClick={() => setShowRequestModal(false)}>Cancel</Button>
            <Button variant="primary" size="md" className="flex-1" loading={requesting} onClick={() => sendRequest()}>Send Request</Button>
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

export default HostelDetail;
