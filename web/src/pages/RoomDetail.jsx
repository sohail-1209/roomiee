// Room Detail Page — reuses same components as ListingDetail but for Room Sharing
// Shares MapView, NearbyPlaces, ReviewCard, Navbar components
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { MapPin, Users, Cigarette, Wine, Leaf, Cat, Calendar, Eye, Heart, MessageCircle } from 'lucide-react';
import { listingsAPI, requestsAPI, savedAPI } from '../services/endpoints';
import { useAuth } from '../context/AuthContext';
import { formatRent, timeAgo } from '../utils/helpers';
import MapView from '../components/MapView';
import NearbyPlaces from '../components/NearbyPlaces';
import Navbar from '../components/layout/Navbar';
import { Modal, Button, Badge, Avatar } from '../components/ui';

const RuleTag = ({ label, allowed }) => (
  <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium ${allowed ? 'bg-success-50 text-success-600' : 'bg-danger-50 text-danger-500'}`}>
    <span>{allowed ? '✅' : '❌'}</span> {label} {allowed ? 'Allowed' : 'Not Allowed'}
  </div>
);

const RoomDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [activePhoto, setActivePhoto] = useState(0);
  const [requestMsg, setRequestMsg] = useState('');
  const [showRequestModal, setShowRequestModal] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['listing', id],
    queryFn: () => listingsAPI.getOne(id).then((r) => r.data.data),
  });

  const { mutate: sendRequest, isPending: requesting } = useMutation({
    mutationFn: () => requestsAPI.create({ listingId: id, message: requestMsg }),
    onSuccess: () => { toast.success('Request sent!'); setShowRequestModal(false); },
    onError: (err) => toast.error(err?.response?.data?.message || 'Failed'),
  });

  const { mutate: toggleSave } = useMutation({
    mutationFn: () => data?.isSaved ? savedAPI.unsave(id) : savedAPI.save(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['listing', id] }); toast.success(data?.isSaved ? 'Removed' : '❤️ Saved!'); },
  });

  if (isLoading) return <><Navbar /><div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" /></div></>;

  const rs = data?.roomSharing;
  const photos = data?.photos || [];

  return (
    <>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Gallery */}
        <div className="grid grid-cols-4 gap-2 rounded-2xl overflow-hidden h-72 mb-8">
          <div className="col-span-4 sm:col-span-3">
            <img
              src={photos[activePhoto]?.url || 'https://placehold.co/800x400?text=No+Photo'}
              alt={data?.title}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="hidden sm:flex flex-col gap-2">
            {photos.slice(0, 3).map((p, i) => (
              <button key={p.id} onClick={() => setActivePhoto(i)} className={`flex-1 rounded-xl overflow-hidden border-2 ${activePhoto === i ? 'border-primary-500' : 'border-transparent'}`}>
                <img src={p.url} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="warning">🤝 Room Sharing</Badge>
                {rs?.genderRequired !== 'ANY' && <Badge variant="primary">{rs?.genderRequired === 'FEMALE' ? '👩 Female Only' : '👨 Male Only'}</Badge>}
              </div>
              <h1 className="font-display font-bold text-3xl text-surface-900 mb-2">{data?.title}</h1>
              <div className="flex items-center gap-2 text-surface-500 text-sm">
                <MapPin size={15} /> {data?.address}, {data?.city}
              </div>
            </div>

            {/* Roommate preferences */}
            {rs && (
              <div className="card p-5">
                <h2 className="font-display font-semibold text-lg mb-4">Roommate Preferences</h2>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {rs.minAge && <div className="text-sm"><span className="text-surface-400">Age:</span> <span className="font-medium">{rs.minAge}–{rs.maxAge || '∞'}</span></div>}
                  {rs.occupationPref !== 'ANY' && <div className="text-sm"><span className="text-surface-400">Occupation:</span> <span className="font-medium">{rs.occupationPref}</span></div>}
                  <div className="text-sm"><span className="text-surface-400">Current occupants:</span> <span className="font-medium">{rs.currentOccupants}/{rs.totalRooms}</span></div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <RuleTag label="Smoking" allowed={rs.smoking} />
                  <RuleTag label="Drinking" allowed={rs.drinking} />
                  <RuleTag label="Veg Only" allowed={rs.vegOnly} />
                  <RuleTag label="Pets" allowed={rs.petsAllowed} />
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
            </div>

            <NearbyPlaces lat={data?.latitude} lng={data?.longitude} />
          </div>

          {/* Right */}
          <div>
            <div className="card p-6 sticky top-24 space-y-4">
              <div>
                <span className="font-display font-bold text-3xl text-surface-900">{formatRent(data?.rent)}</span>
                <span className="text-surface-400 text-sm">/month</span>
              </div>
              <div className="text-sm text-surface-600 space-y-1">
                <div className="flex justify-between"><span>Deposit</span><span className="font-medium">{formatRent(data?.deposit)}</span></div>
                <div className="flex justify-between"><span>Available From</span><span className="font-medium">{new Date(data?.availableFrom).toLocaleDateString('en-IN')}</span></div>
              </div>

              {user ? (
                <div className="space-y-2">
                  {user.id === data?.ownerId ? (
                    <Button variant="primary" size="lg" className="w-full" onClick={() => navigate(`/dashboard/listings/${data?.id}/edit`)}>
                      Edit Listing
                    </Button>
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
                <div>
                  <p className="font-semibold text-sm">{data?.owner?.name}</p>
                  <p className="text-xs text-surface-400">⭐ {data?.owner?.avgRating?.toFixed(1) || 'New'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal isOpen={showRequestModal} onClose={() => setShowRequestModal(false)} title="Request to Share Room" size="sm">
        <div className="space-y-4">
          <textarea value={requestMsg} onChange={(e) => setRequestMsg(e.target.value)} placeholder="Introduce yourself — occupation, lifestyle, move-in date..." rows={4} className="input resize-none" />
          <div className="flex gap-3">
            <Button variant="secondary" size="md" className="flex-1" onClick={() => setShowRequestModal(false)}>Cancel</Button>
            <Button variant="primary" size="md" className="flex-1" loading={requesting} onClick={() => sendRequest()}>Send Request</Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default RoomDetail;
