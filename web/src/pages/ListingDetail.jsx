// Listing Detail Page — main property detail page
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import toast from 'react-hot-toast';
import {
  MapPin, Bed, Bath, Square, Car, Wind, Wifi, Refrigerator,
  WashingMachine, Dumbbell, Shield, Star, Share2, Flag,
  Calendar, Eye, Heart, Phone, MessageCircle
} from 'lucide-react';

import { listingsAPI, requestsAPI, savedAPI } from '../services/endpoints';
import { useAuth } from '../context/AuthContext';
import { formatRent, getAmenityList, timeAgo } from '../utils/helpers';
import MapView from '../components/MapView';
import NearbyPlaces from '../components/NearbyPlaces';
import ReviewCard from '../components/ReviewCard';
import Navbar from '../components/layout/Navbar';
import { Modal, Button, Badge, Avatar, Spinner } from '../components/ui';

const amenityIcons = {
  WiFi: Wifi, AC: Wind, Parking: Car, Fridge: Refrigerator,
  'Washing Machine': WashingMachine, Gym: Dumbbell, Security: Shield,
};

const ListingDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [activePhoto, setActivePhoto] = useState(0);
  const [requestMsg, setRequestMsg] = useState('');
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['listing', id],
    queryFn: () => listingsAPI.getOne(id).then((r) => r.data.data),
  });

  const { mutate: sendRequest, isPending: requesting } = useMutation({
    mutationFn: () => requestsAPI.create({ listingId: id, message: requestMsg }),
    onSuccess: () => {
      toast.success('Request sent! The owner will be notified.');
      setShowRequestModal(false);
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Failed to send request'),
  });

  const { mutate: toggleSave } = useMutation({
    mutationFn: () => data?.isSaved ? savedAPI.unsave(id) : savedAPI.save(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['listing', id] });
      toast.success(data?.isSaved ? 'Removed from saved' : '❤️ Saved!');
    },
  });

  if (isLoading) return (
    <>
      <Navbar />
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    </>
  );
  if (isError || !data) return (
    <>
      <Navbar />
      <div className="min-h-screen flex items-center justify-center text-surface-500">Listing not found.</div>
    </>
  );

  const photos = data.photos || [];
  const amenities = getAmenityList(data.amenities);

  return (
    <>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ─ Photo Gallery ─────────────────────────────── */}
        <div className="grid grid-cols-4 gap-2 rounded-2xl overflow-hidden h-80 sm:h-[420px] mb-8">
          {/* Main photo */}
          <div className="col-span-4 sm:col-span-3 relative">
            <img
              src={photos[activePhoto]?.url || 'https://placehold.co/800x420?text=No+Photo'}
              alt={data.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-4 left-4 flex gap-2">
              <Badge variant={data.type === 'HOUSE_RENTAL' ? 'primary' : 'warning'}>
                {data.type === 'HOUSE_RENTAL' ? '🏠 House Rental' : '🤝 Room Sharing'}
              </Badge>
              {data.furnished && <Badge variant="success">Furnished</Badge>}
            </div>
          </div>
          {/* Thumbnail strip */}
          <div className="hidden sm:flex flex-col gap-2">
            {photos.slice(0, 3).map((p, i) => (
              <button key={p.id} onClick={() => setActivePhoto(i)} className={`flex-1 rounded-lg overflow-hidden border-2 transition-all ${activePhoto === i ? 'border-primary-500' : 'border-transparent'}`}>
                <img src={p.url} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
            {photos.length > 3 && (
              <div className="flex-1 rounded-lg bg-surface-800 text-white flex items-center justify-center text-sm font-medium">
                +{photos.length - 3}
              </div>
            )}
          </div>
        </div>

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
                <span className="flex items-center gap-1"><Eye size={14} /> {data.views} views</span>
                <span className="flex items-center gap-1"><Calendar size={14} /> Listed {timeAgo(data.createdAt)}</span>
              </div>
            </div>

            {/* Key stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { icon: Bed, label: 'Bedrooms', value: data.bedrooms },
                { icon: Bath, label: 'Bathrooms', value: data.bathrooms },
                { icon: Square, label: 'Area', value: data.areaSqFt ? `${data.areaSqFt} sqft` : 'N/A' },
                { icon: Car, label: 'Parking', value: data.parking ? 'Yes' : 'No' },
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
              <h2 className="font-display font-semibold text-lg mb-3">About this place</h2>
              <p className="text-surface-600 leading-relaxed whitespace-pre-line">{data.description}</p>
            </div>

            {/* Amenities */}
            {amenities.length > 0 && (
              <div className="card p-5">
                <h2 className="font-display font-semibold text-lg mb-4">Amenities</h2>
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
              <h2 className="font-display font-semibold text-lg mb-4">Location</h2>
              <MapView lat={data.latitude} lng={data.longitude} title={data.title} className="h-64" />
              <p className="text-xs text-surface-400 mt-2 text-center">Exact location shared after request is accepted</p>
            </div>

            {/* Nearby Places */}
            <NearbyPlaces lat={data.latitude} lng={data.longitude} />

            {/* Reviews */}
            {data.reviews?.length > 0 && (
              <div>
                <h2 className="font-display font-semibold text-lg mb-4">Reviews</h2>
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
                <span className="text-surface-400 text-sm">/month</span>
              </div>
              <div className="space-y-2 text-sm mb-5">
                <div className="flex justify-between text-surface-600">
                  <span>Deposit</span>
                  <span className="font-medium">{formatRent(data.deposit)}</span>
                </div>
                {data.maintenance > 0 && (
                  <div className="flex justify-between text-surface-600">
                    <span>Maintenance</span>
                    <span className="font-medium">{formatRent(data.maintenance)}/mo</span>
                  </div>
                )}
                <div className="flex justify-between text-surface-600">
                  <span>Available From</span>
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
                  ) : (
                    <Button
                      variant="primary"
                      size="lg"
                      className="w-full mb-3"
                      onClick={() => setShowRequestModal(true)}
                    >
                      <MessageCircle size={18} /> Send Request
                    </Button>
                  )}
                  <div className="flex gap-2">
                    <Button
                      variant={data.isSaved ? 'primary' : 'outline'}
                      size="md"
                      className="flex-1"
                      onClick={() => toggleSave()}
                    >
                      <Heart size={16} className={data.isSaved ? 'fill-white' : ''} />
                      {data.isSaved ? 'Saved' : 'Save'}
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
                  Login to Contact Owner
                </Button>
              )}
            </div>

            {/* Owner card */}
            <div className="card p-5">
              <h3 className="font-display font-semibold text-base mb-3">Listed by</h3>
              <div className="flex items-center gap-3">
                <Avatar src={data.owner?.profileImage} name={data.owner?.name} size="md" />
                <div>
                  <p className="font-semibold text-surface-900">{data.owner?.name}</p>
                  <div className="flex items-center gap-1 text-sm">
                    <Star size={13} className="text-accent-400 fill-accent-400" />
                    <span className="font-medium">{data.owner?.avgRating?.toFixed(1) || 'New'}</span>
                    <span className="text-surface-400">({data.owner?.totalRatings} reviews)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─ Request Modal ──────────────────────────────── */}
      <Modal isOpen={showRequestModal} onClose={() => setShowRequestModal(false)} title="Send Rental Request" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-surface-600">
            Send a request to the owner. They'll get notified and can accept or reject.
          </p>
          <textarea
            value={requestMsg}
            onChange={(e) => setRequestMsg(e.target.value)}
            placeholder="Introduce yourself — occupation, move-in date, number of people..."
            rows={4}
            className="input resize-none"
          />
          <div className="flex gap-3">
            <Button variant="secondary" size="md" className="flex-1" onClick={() => setShowRequestModal(false)}>Cancel</Button>
            <Button variant="primary" size="md" className="flex-1" loading={requesting} onClick={() => sendRequest()}>
              Send Request
            </Button>
          </div>
        </div>
      </Modal>

      {/* ─ Report Modal ───────────────────────────────── */}
      <Modal isOpen={showReportModal} onClose={() => setShowReportModal(false)} title="Report Listing" size="sm">
        <ReportForm listingId={id} onClose={() => setShowReportModal(false)} />
      </Modal>
    </>
  );
};

// Inline report form (used only here)
const REPORT_REASONS = [
  { value: 'FAKE_LISTING', label: 'Fake Listing' },
  { value: 'WRONG_PRICE', label: 'Wrong Price' },
  { value: 'ALREADY_RENTED', label: 'Already Rented' },
  { value: 'SPAM', label: 'Spam' },
  { value: 'DUPLICATE', label: 'Duplicate' },
  { value: 'WRONG_LOCATION', label: 'Wrong Location' },
  { value: 'SCAM', label: 'Scam' },
  { value: 'OTHER', label: 'Other' },
];

import { reportsAPI } from '../services/endpoints';

const ReportForm = ({ listingId, onClose }) => {
  const [reason, setReason] = useState('FAKE_LISTING');
  const [details, setDetails] = useState('');
  const { mutate, isPending } = useMutation({
    mutationFn: () => reportsAPI.create({ listingId, reason, details }),
    onSuccess: () => { toast.success('Report submitted'); onClose(); },
    onError: () => toast.error('Failed to submit report'),
  });
  return (
    <div className="space-y-4">
      <select value={reason} onChange={(e) => setReason(e.target.value)} className="input">
        {REPORT_REASONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
      </select>
      <textarea value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Additional details (optional)" rows={3} className="input resize-none" />
      <div className="flex gap-3">
        <Button variant="secondary" size="md" className="flex-1" onClick={onClose}>Cancel</Button>
        <Button variant="danger" size="md" className="flex-1" loading={isPending} onClick={() => mutate()}>Submit Report</Button>
      </div>
    </div>
  );
};

export default ListingDetail;
