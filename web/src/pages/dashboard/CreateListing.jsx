import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Camera, Upload, X, Home, DoorOpen, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { listingsAPI, uploadAPI } from '../../services/endpoints';
import { useAuth } from '../../context/AuthContext';
import { compressImages, formatFileSize } from '../../utils/compressImage';
import PageHeader from '../../components/layout/PageHeader';
import LocationPicker from '../../components/LocationPicker';
import { Input, Select, Textarea, Button } from '../../components/ui';

const STEPS = ['basicInfo', 'locationStep', 'amenitiesStep', 'roomHostelDetails', 'photos'];

const AMENITY_FIELDS = ['wifi','parking','washingMachine','ac','fridge','kitchen','lift','gym','security','powerBackup','waterSupply','cctv','ventilation'];
const AMENITY_LABELS = { wifi:'wifi', parking:'parking', washingMachine:'washingMachine', ac:'ac', fridge:'fridge', kitchen:'kitchen', lift:'lift', gym:'gym', security:'security', powerBackup:'powerBackup', waterSupply:'waterSupply', cctv:'cctv', ventilation:'ventilation' };

const defaultForm = {
  title: '', description: '', type: 'HOUSE_RENTAL', rent: '', deposit: '', maintenance: '',
  address: '', city: '', state: '', pincode: '', latitude: '', longitude: '',
  bedrooms: '1', bathrooms: '1', balcony: false, parking: false, areaSqFt: '', furnished: false,
  availableFrom: '',
  amenities: Object.fromEntries(AMENITY_FIELDS.map((f) => [f, false])),
  roomSharing: { genderRequired: 'ANY', minAge: '', maxAge: '', smoking: false, drinking: false, vegOnly: false, petsAllowed: false, currentOccupants: '0', totalRooms: '1' },
  hostelSharing: { genderRequired: 'ANY', minAge: '', maxAge: '', smoking: false, drinking: false, vegOnly: false, petsAllowed: false, tiers: [{ sharingSize: '2', price: '', available: true }] },
};

const CreateListing = () => {
  const { id } = useParams();
  const location = useLocation();
  const fromBooking = location.state?.fromBooking;
  const isEdit = !!id;
  const isFromBooking = !!fromBooking && !isEdit;
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    ...defaultForm,
    ...(user?.role === 'TENANT' ? { type: 'ROOM_SHARING' } : {}),
  });

  const [addressInput, setAddressInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null); // null = "Other room"
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [deletingPhotoIds, setDeletingPhotoIds] = useState(new Set());

  const set = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));
  const setAmenity = (key, val) => setForm((prev) => ({ ...prev, amenities: { ...prev.amenities, [key]: val } }));
  const setRS = (key, val) => setForm((prev) => ({ ...prev, roomSharing: { ...prev.roomSharing, [key]: val } }));
  const setHS = (key, val) => setForm((prev) => ({ ...prev, hostelSharing: { ...prev.hostelSharing, [key]: val } }));
  const setHSTier = (index, key, val) => setForm((prev) => {
    const tiers = [...prev.hostelSharing.tiers];
    tiers[index] = { ...tiers[index], [key]: val };
    return { ...prev, hostelSharing: { ...prev.hostelSharing, tiers } };
  });
  const addHSTier = () => setForm((prev) => ({
    ...prev,
    hostelSharing: {
      ...prev.hostelSharing,
      tiers: [...prev.hostelSharing.tiers, { sharingSize: '', price: '', available: true }],
    },
  }));
  const removeHSTier = (index) => setForm((prev) => ({
    ...prev,
    hostelSharing: {
      ...prev.hostelSharing,
      tiers: prev.hostelSharing.tiers.filter((_, i) => i !== index),
    },
  }));

  // Auto-fetch suggestions on addressInput change
  useEffect(() => {
    if (addressInput.length < 4) {
      setSuggestions([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setSuggestionsLoading(true);
      try {
        const res = await fetch(
          `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(addressInput)}&apiKey=c471b4637f644bbaa597b0103c703121&filter=countrycode:in&limit=5`
        );
        const data = await res.json();
        setSuggestions(data.features || []);
      } catch (err) {
        console.error('Geoapify autocomplete error', err);
      } finally {
        setSuggestionsLoading(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [addressInput]);

  const { data: listingData, isLoading, isFetching } = useQuery({
    queryKey: ['listing', id],
    queryFn: () => listingsAPI.getOne(id).then((r) => r.data.data),
    enabled: isEdit,
  });

  // Fetch tenant's accepted bookings (only for new listings by tenants)
  const { data: bookingsData, isLoading: bookingsLoading } = useQuery({
    queryKey: ['tenant-bookings'],
    queryFn: () => listingsAPI.getMyBookings().then((r) => r.data.data),
    enabled: user?.role === 'TENANT' && !isEdit,
  });
  const acceptedBookings = bookingsData || [];

  useEffect(() => {
    if (listingData) {
      setAddressInput(listingData.address || '');
      setForm({
        title: listingData.title || '',
        description: listingData.description || '',
        type: listingData.type || 'HOUSE_RENTAL',
        rent: listingData.rent || '',
        deposit: listingData.deposit || '',
        maintenance: listingData.maintenance || '',
        address: listingData.address || '',
        city: listingData.city || '',
        state: listingData.state || '',
        pincode: listingData.pincode || '',
        latitude: listingData.latitude || '',
        longitude: listingData.longitude || '',
        bedrooms: String(listingData.bedrooms || '1'),
        bathrooms: String(listingData.bathrooms || '1'),
        balcony: listingData.balcony || false,
        parking: listingData.parking || false,
        areaSqFt: listingData.areaSqFt || '',
        furnished: listingData.furnished || false,
        availableFrom: listingData.availableFrom ? new Date(listingData.availableFrom).toISOString().split('T')[0] : '',
        amenities: listingData.amenities ? {
          wifi: listingData.amenities.wifi || false,
          parking: listingData.amenities.parking || false,
          washingMachine: listingData.amenities.washingMachine || false,
          ac: listingData.amenities.ac || false,
          fridge: listingData.amenities.fridge || false,
          kitchen: listingData.amenities.kitchen || false,
          lift: listingData.amenities.lift || false,
          gym: listingData.amenities.gym || false,
          security: listingData.amenities.security || false,
          powerBackup: listingData.amenities.powerBackup || false,
          waterSupply: listingData.amenities.waterSupply || false,
          cctv: listingData.amenities.cctv || false,
        } : defaultForm.amenities,
        roomSharing: listingData.roomSharing ? {
          genderRequired: listingData.roomSharing.genderRequired || 'ANY',
          minAge: listingData.roomSharing.minAge || '',
          maxAge: listingData.roomSharing.maxAge || '',
          smoking: listingData.roomSharing.smoking || false,
          drinking: listingData.roomSharing.drinking || false,
          vegOnly: listingData.roomSharing.vegOnly || false,
          petsAllowed: listingData.roomSharing.petsAllowed || false,
          currentOccupants: String(listingData.roomSharing.currentOccupants || '0'),
          totalRooms: String(listingData.roomSharing.totalRooms || '1'),
        } : defaultForm.roomSharing,
        hostelSharing: listingData.hostelSharing ? {
          genderRequired: listingData.hostelSharing.genderRequired || 'ANY',
          minAge: listingData.hostelSharing.minAge || '',
          maxAge: listingData.hostelSharing.maxAge || '',
          smoking: listingData.hostelSharing.smoking || false,
          drinking: listingData.hostelSharing.drinking || false,
          vegOnly: listingData.hostelSharing.vegOnly || false,
          petsAllowed: listingData.hostelSharing.petsAllowed || false,
          tiers: listingData.hostelSharing.tiers?.length > 0
            ? listingData.hostelSharing.tiers.map((t) => ({
                sharingSize: String(t.sharingSize),
                price: String(t.price),
                available: t.available,
              }))
            : [{ sharingSize: '2', price: '', available: true }],
        } : defaultForm.hostelSharing,
      });
    }
  }, [listingData]);

  // Pre-fill from booking
  useEffect(() => {
    if (isFromBooking && fromBooking) {
      setAddressInput(fromBooking.address || '');
      setForm((prev) => ({
        ...prev,
        type: 'ROOM_SHARING',
        title: `Room sharing at ${fromBooking.title}`,
        address: fromBooking.address || '',
        city: fromBooking.city || '',
        state: fromBooking.state || '',
        pincode: fromBooking.pincode || '',
        latitude: fromBooking.latitude || '',
        longitude: fromBooking.longitude || '',
      }));
    }
  }, [isFromBooking, fromBooking]);

  // Pre-fill from selected booking (tenant flow)
  useEffect(() => {
    if (selectedBooking && selectedBooking !== 'other' && selectedBooking.listing) {
      const listing = selectedBooking.listing;
      setAddressInput(listing.address || '');
      setForm((prev) => ({
        ...prev,
        type: 'ROOM_SHARING',
        title: `Room sharing at ${listing.title}`,
        address: listing.address || '',
        city: listing.city || '',
        state: listing.state || '',
        pincode: listing.pincode || '',
        latitude: listing.latitude || '',
        longitude: listing.longitude || '',
      }));
    }
  }, [selectedBooking]);

  const { mutate: save, isPending } = useMutation({
    mutationFn: () => {
      // Parse numeric inputs
      const payload = {
        ...form,
        rent: Number(form.rent),
        deposit: Number(form.deposit),
        maintenance: Number(form.maintenance || 0),
        bedrooms: Number(form.bedrooms),
        bathrooms: Number(form.bathrooms),
        areaSqFt: form.areaSqFt ? Number(form.areaSqFt) : null,
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
      };
      if (form.type === 'ROOM_SHARING') {
        payload.roomSharing = {
          ...form.roomSharing,
          minAge: form.roomSharing.minAge ? Number(form.roomSharing.minAge) : null,
          maxAge: form.roomSharing.maxAge ? Number(form.roomSharing.maxAge) : null,
          currentOccupants: Number(form.roomSharing.currentOccupants),
          totalRooms: Number(form.roomSharing.totalRooms),
        };
      }
      if (form.type === 'HOSTEL') {
        payload.hostelSharing = {
          ...form.hostelSharing,
          minAge: form.hostelSharing.minAge ? Number(form.hostelSharing.minAge) : null,
          maxAge: form.hostelSharing.maxAge ? Number(form.hostelSharing.maxAge) : null,
          tiers: form.hostelSharing.tiers.map((t) => ({
            sharingSize: Number(t.sharingSize),
            price: Number(t.price),
            available: t.available,
          })),
        };
      }
      if (isFromBooking || (selectedBooking && selectedBooking !== 'other')) {
        const booking = fromBooking || selectedBooking;
        payload.bookingId = booking.listing?.id || booking.listingId || booking.id;
        return listingsAPI.createFromBooking(payload);
      }
      return isEdit ? listingsAPI.update(id, payload) : listingsAPI.create(payload);
    },
    onSuccess: ({ data }) => {
      toast.success(isEdit ? t('listingSaved') : t('listingCreated'));
      qc.invalidateQueries({ queryKey: ['myListings'] });
      qc.invalidateQueries({ queryKey: ['listings'] });
      qc.invalidateQueries({ queryKey: ['myBookings'] });
      if (!isEdit) {
        qc.invalidateQueries({ queryKey: ['listing', data.data.id] });
        navigate(`/dashboard/listings/${data.data.id}/edit`);
      } else {
        qc.invalidateQueries({ queryKey: ['listing', id] });
        navigate('/dashboard/listings');
      }
    },
    onError: (err) => toast.error(err?.response?.data?.message || t('failedToSave')),
  });

  const { mutate: deletePhoto } = useMutation({
    mutationFn: (photoId) => {
      setDeletingPhotoIds((prev) => new Set(prev).add(photoId));
      return uploadAPI.deletePhoto(photoId);
    },
    onSuccess: (_, photoId) => {
      toast.success(t('photoDeleted') || 'Photo deleted!');
      qc.invalidateQueries({ queryKey: ['listing', id] });
      setDeletingPhotoIds((prev) => { const s = new Set(prev); s.delete(photoId); return s; });
    },
    onError: (_, photoId) => {
      toast.error(t('failedToDeletePhoto') || 'Failed to delete photo.');
      setDeletingPhotoIds((prev) => { const s = new Set(prev); s.delete(photoId); return s; });
    },
  });

  const handlePhotoUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingPhotos(true);
    try {
      toast.loading(t('compressingPhotos') || 'Compressing photos...', { id: 'photo-upload' });
      const results = await compressImages(files, { maxWidth: 1200, maxHeight: 900, maxSizeKB: 50 });

      // Show compression results
      const summary = results.map((r) => `${formatFileSize(r.originalSize)} → ${formatFileSize(r.compressedSize)}`).join('\n');
      toast.success(`${t('compressedCount', { count: results.length }) || `Compressed ${results.length} images`}\n${summary}`, { id: 'photo-upload', duration: 4000 });

      const fd = new FormData();
      results.forEach((r) => fd.append('photos', r.file));

      toast.loading(t('uploadingPhotos') || 'Uploading photos...', { id: 'photo-upload' });
      await uploadAPI.listingPhotos(id, fd);
      toast.success(t('photosUploaded') || 'Photos uploaded successfully!', { id: 'photo-upload' });

      // Wait for refetch to complete before hiding the skeleton
      await qc.refetchQueries({ queryKey: ['listing', id] });
    } catch {
      toast.error(t('failedToUploadPhotos') || 'Failed to upload photos.', { id: 'photo-upload' });
    } finally {
      setUploadingPhotos(false);
    }
  };

  const steps = [
    // Step 0 — Basic Info
    <div key="basic" className="space-y-4">
      <Input label={t('listingTitle') || 'Listing Title'} value={form.title} onChange={(e) => set('title', e.target.value)} placeholder={t('titlePlaceholder') || 'Enter listing title...'} />
      <Textarea label={t('description') || 'Description'} value={form.description} onChange={(e) => set('description', e.target.value)} rows={4} placeholder={t('describeProperty') || 'Describe your property...'} />
      <Select
        label={t('listingType') || 'Listing Type'}
        value={form.type}
        onChange={(e) => set('type', e.target.value)}
        options={
          user?.role === 'TENANT'
            ? [{ value: 'ROOM_SHARING', label: t('roomSharingType') || 'Room Sharing' }]
            : [
                { value: 'HOUSE_RENTAL', label: t('houseRental') || 'House Rental' },
                { value: 'ROOM_SHARING', label: t('roomSharingType') || 'Room Sharing' },
                { value: 'HOSTEL', label: t('hostelPg') || 'Hostel & PG' },
                { value: 'LAND_SALE', label: t('landSaleType') || 'Land Sale' }
              ]
        }
        disabled={user?.role === 'TENANT'}
      />

      {/* Hostel Sharing Tiers — shown right after type selection */}
      {form.type === 'HOSTEL' && (
        <div className="border-t border-surface-100 pt-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-surface-700">{t('sharingPricing') || 'Sharing & Pricing'}</p>
            <button type="button" onClick={addHSTier} className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
              <Plus size={14} /> {t('addTier') || 'Add Tier'}
            </button>
          </div>
          <div className="space-y-3">
            {form.hostelSharing.tiers.map((tier, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3 p-3 bg-surface-50 rounded-xl">
                <div className="flex-1">
                  <Input label={t('noOfSharing') || 'Sharing Size'} type="number" value={tier.sharingSize} onChange={(e) => setHSTier(idx, 'sharingSize', e.target.value)} placeholder={t('sharingPlaceholder') || 'e.g. 2, 3'} />
                </div>
                <div className="flex-1">
                  <Input label={t('pricePerMo') || 'Price / Month'} type="number" value={tier.price} onChange={(e) => setHSTier(idx, 'price', e.target.value)} placeholder={t('pricePlaceholder') || 'e.g. 5000'} />
                </div>
                <label className="flex items-center gap-2 cursor-pointer min-h-[44px] sm:pb-2">
                  <input type="checkbox" checked={tier.available} onChange={(e) => setHSTier(idx, 'available', e.target.checked)} className="w-5 h-5 accent-primary-600" />
                  <span className="text-xs text-surface-600">{t('availableLabel') || 'Available'}</span>
                </label>
                {form.hostelSharing.tiers.length > 1 && (
                  <button type="button" onClick={() => removeHSTier(idx)} className="p-2 text-red-500 hover:text-red-600 pb-2">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-surface-400 mt-2">{t('addDifferentSharing') || 'Add different sharing types if available.'}</p>
        </div>
      )}

      {form.type !== 'HOSTEL' && form.type !== 'LAND_SALE' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input label={t('rentMo') || 'Rent / Month (₹)'} type="number" value={form.rent} onChange={(e) => set('rent', e.target.value)} />
            <Input label={t('deposit₹') || 'Deposit (₹)'} type="number" value={form.deposit} onChange={(e) => set('deposit', e.target.value)} />
            <Input label={t('maintenance₹') || 'Maintenance (₹)'} type="number" value={form.maintenance} onChange={(e) => set('maintenance', e.target.value)} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label={t('bedroomsLabel') || 'Bedrooms'} type="number" value={form.bedrooms} onChange={(e) => set('bedrooms', e.target.value)} />
            <Input label={t('bathroomsLabel') || 'Bathrooms'} type="number" value={form.bathrooms} onChange={(e) => set('bathrooms', e.target.value)} />
          </div>
        </>
      )}

      {form.type === 'HOSTEL' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label={t('deposit₹') || 'Deposit (₹)'} type="number" value={form.deposit} onChange={(e) => set('deposit', e.target.value)} />
          <Input label={t('availableFrom') || 'Available From'} type="date" value={form.availableFrom} onChange={(e) => set('availableFrom', e.target.value)} />
        </div>
      )}

      {form.type === 'LAND_SALE' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label={t('totalPrice₹') || 'Total Price (₹)'} type="number" value={form.rent} onChange={(e) => set('rent', e.target.value)} placeholder={t('totalPricePlaceholder') || 'Total price'} />
            <Input label={t('areaSqft') || 'Area (sq ft)'} type="number" value={form.areaSqFt} onChange={(e) => set('areaSqFt', e.target.value)} placeholder={t('areaPlaceholder') || 'Area'} />
          </div>
          <Input label={t('availableFrom') || 'Available From'} type="date" value={form.availableFrom} onChange={(e) => set('availableFrom', e.target.value)} />
        </>
      )}

      {form.type !== 'HOSTEL' && form.type !== 'LAND_SALE' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label={t('areaSqft') || 'Area (sq ft)'} type="number" value={form.areaSqFt} onChange={(e) => set('areaSqFt', e.target.value)} />
          <Input label={t('availableFrom') || 'Available From'} type="date" value={form.availableFrom} onChange={(e) => set('availableFrom', e.target.value)} />
        </div>
      )}

      {form.type !== 'LAND_SALE' && (
        <div className="flex flex-wrap gap-4 sm:gap-6">
          {[['furnished', t('furnished') || 'Furnished'], ['balcony', t('hasBalcony') || 'Has Balcony'], ['parking', t('parkingAvailable') || 'Parking Available']].map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 cursor-pointer min-h-[44px]">
              <input type="checkbox" checked={form[key]} onChange={(e) => set(key, e.target.checked)} className="w-5 h-5 accent-primary-600" />
              <span className="text-sm text-surface-700">{label}</span>
            </label>
          ))}
        </div>
      )}
    </div>,

    // Step 1 — Location
    <div key="location" className="space-y-4">
      {/* 1. Address Search input */}
      <div className="relative">
        <Input
          label={t('searchFullAddress') || 'Search Full Address'}
          value={addressInput}
          onChange={(e) => {
            setAddressInput(e.target.value);
            setShowSuggestions(true);
            set('address', e.target.value);
          }}
          placeholder={t('startTypingAddress') || 'Start typing address...'}
          className="w-full"
        />
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute left-0 right-0 z-50 bg-surface-50/95 backdrop-blur-xl border border-surface-200/60 rounded-xl mt-1 shadow-lg max-h-48 overflow-y-auto py-1">
            {suggestions.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  const props = s.properties;
                  setAddressInput(props.formatted);
                  setForm((prev) => ({
                    ...prev,
                    address: props.formatted || prev.address,
                    city: props.city || prev.city || '',
                    state: props.state || prev.state || '',
                    pincode: props.postcode || prev.pincode || '',
                    latitude: String(props.lat || prev.latitude),
                    longitude: String(props.lon || prev.longitude),
                  }));
                  setSuggestions([]);
                  setShowSuggestions(false);
                }}
                className="w-full text-left px-4 py-2 hover:bg-surface-50 text-sm text-surface-700 truncate border-none outline-none block"
              >
                📍 {s.properties.formatted}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 2. Unified Location Map Picker */}
      <div className="border-t border-surface-100 pt-4 mt-4">
        <p className="text-sm font-semibold text-surface-700 mb-3">{t('exactLocationLabel') || 'Pin Exact Location'}</p>
        <LocationPicker
          latitude={form.latitude ? Number(form.latitude) : null}
          longitude={form.longitude ? Number(form.longitude) : null}
          onChange={(lat, lng) => {
            set('latitude', String(lat));
            set('longitude', String(lng));
          }}
          onAddressFill={(data) => {
            if (data.address) setAddressInput(data.address);
            setForm((prev) => ({
              ...prev,
              address: data.address || prev.address,
              city: data.city || prev.city,
              state: data.state || prev.state,
              pincode: data.pincode || prev.pincode,
              latitude: data.latitude ? String(data.latitude) : prev.latitude,
              longitude: data.longitude ? String(data.longitude) : prev.longitude,
            }));
          }}
        />
      </div>

      {/* 3. Address Detail Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label={t('city') || 'City'} value={form.city} onChange={(e) => set('city', e.target.value)} />
        <Input label={t('state') || 'State'} value={form.state} onChange={(e) => set('state', e.target.value)} />
      </div>
      <Input label={t('pincode') || 'Pincode'} value={form.pincode} onChange={(e) => set('pincode', e.target.value)} />

      {/* 4. Manual Coordinate Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label={t('latitude') || 'Latitude'} type="number" step="any" value={form.latitude} onChange={(e) => set('latitude', e.target.value)} placeholder={t('latPlaceholder') || 'Latitude'} />
        <Input label={t('longitude') || 'Longitude'} type="number" step="any" value={form.longitude} onChange={(e) => set('longitude', e.target.value)} placeholder={t('lngPlaceholder') || 'Longitude'} />
      </div>
    </div>,

    // Step 2 — Amenities
    <div key="amenities" className="space-y-3">
      <p className="text-sm text-surface-500">{t('selectAmenities') || 'Select Amenities'}</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {AMENITY_FIELDS.map((key) => (
          <label key={key} className={`flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all min-h-[48px] ${form.amenities[key] ? 'border-primary-500 bg-primary-50' : 'border-surface-200 hover:border-surface-300'}`}>
            <input type="checkbox" checked={form.amenities[key]} onChange={(e) => setAmenity(key, e.target.checked)} className="w-5 h-5 accent-primary-600" />
            <span className="text-sm font-medium text-surface-700">{t(AMENITY_LABELS[key]) || key}</span>
          </label>
        ))}
      </div>
    </div>,

    // Step 3 — Room Sharing / Hostel details (conditional)
    <div key="room" className="space-y-4">
      {form.type === 'ROOM_SHARING' ? (
        <>
          <Select label={t('genderPreference') || 'Gender Preference'} value={form.roomSharing.genderRequired} onChange={(e) => setRS('genderRequired', e.target.value)}
            options={[{ value: 'ANY', label: t('any') || 'Any' }, { value: 'MALE', label: t('maleOnlyBadge') || 'Male' }, { value: 'FEMALE', label: t('femaleOnlyBadge') || 'Female' }]} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label={t('minAge') || 'Minimum Age'} type="number" value={form.roomSharing.minAge} onChange={(e) => setRS('minAge', e.target.value)} />
            <Input label={t('maxAge') || 'Maximum Age'} type="number" value={form.roomSharing.maxAge} onChange={(e) => setRS('maxAge', e.target.value)} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label={t('currentOccupantsLabel') || 'Current Occupants'} type="number" value={form.roomSharing.currentOccupants} onChange={(e) => setRS('currentOccupants', e.target.value)} />
            <Input label={t('totalRooms') || 'Total Rooms'} type="number" value={form.roomSharing.totalRooms} onChange={(e) => setRS('totalRooms', e.target.value)} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              ['smoking', t('smokingAllowed') || 'Smoking Allowed'],
              ['drinking', t('drinkingAllowed') || 'Drinking Allowed'],
              ['vegOnly', t('vegOnlyLabel') || 'Veg Only'],
              ['petsAllowed', t('petsAllowed') || 'Pets Allowed']
            ].map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer min-h-[44px] p-3 border rounded-xl hover:bg-surface-50">
                <input type="checkbox" checked={form.roomSharing[key]} onChange={(e) => setRS(key, e.target.checked)} className="w-5 h-5 accent-primary-600" />
                <span className="text-sm text-surface-700">{label}</span>
              </label>
            ))}
          </div>
        </>
      ) : form.type === 'HOSTEL' ? (
        <>
          <Select label={t('genderPreference') || 'Gender Preference'} value={form.hostelSharing.genderRequired} onChange={(e) => setHS('genderRequired', e.target.value)}
            options={[{ value: 'ANY', label: t('any') || 'Any' }, { value: 'MALE', label: t('maleOnlyBadge') || 'Male' }, { value: 'FEMALE', label: t('femaleOnlyBadge') || 'Female' }]} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label={t('minAge') || 'Minimum Age'} type="number" value={form.hostelSharing.minAge} onChange={(e) => setHS('minAge', e.target.value)} />
            <Input label={t('maxAge') || 'Maximum Age'} type="number" value={form.hostelSharing.maxAge} onChange={(e) => setHS('maxAge', e.target.value)} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              ['smoking', t('smokingAllowed') || 'Smoking Allowed'],
              ['drinking', t('drinkingAllowed') || 'Drinking Allowed'],
              ['vegOnly', t('vegOnlyLabel') || 'Veg Only'],
              ['petsAllowed', t('petsAllowed') || 'Pets Allowed']
            ].map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer min-h-[44px] p-3 border rounded-xl hover:bg-surface-50">
                <input type="checkbox" checked={form.hostelSharing[key]} onChange={(e) => setHS(key, e.target.checked)} className="w-5 h-5 accent-primary-600" />
                <span className="text-sm text-surface-700">{label}</span>
              </label>
            ))}
          </div>
          <p className="text-xs text-surface-400 text-center pt-2">{t('sharingPricingSet') || 'Pricing tiers are configured in Step 0.'}</p>
        </>
      ) : (
        <div className="text-center py-12 text-surface-400">
          <p className="text-4xl mb-3">🏠</p>
          <p className="font-medium">{t('noRoomSharingDetails') || 'No special sharing details required.'}</p>
          <p className="text-sm">{t('thisIsHouseRental') || 'This is configured as a complete house rental.'}</p>
        </div>
      )}
    </div>,
  ];

  if (isEdit) {
    steps.push(
      <div key="photos" className="space-y-4">
        <p className="text-sm text-surface-500">{t('addPhotosInstruction') || 'Upload photos to showcase your property.'}</p>

        {/* Existing photos + Uploading placeholder overlay */}
        {(listingData?.photos?.length > 0 || uploadingPhotos || isFetching) && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {listingData?.photos?.map((photo, idx) => {
              const isDeleting = deletingPhotoIds.has(photo.id);
              return (
              <div key={photo.id} className={`relative aspect-square rounded-2xl overflow-hidden group border bg-surface-100 ${isDeleting ? 'border-red-300' : 'border-surface-100'}`}>
                {/* Skeleton placeholder — visible until img loads */}
                <div className="absolute inset-0 bg-surface-100 animate-pulse flex items-center justify-center transition-opacity duration-300 photo-skeleton">
                  <div className="h-5 w-5 border-2 border-surface-300 border-t-transparent rounded-full animate-spin" />
                </div>
                <img
                  src={photo.url}
                  alt=""
                  className={`w-full h-full object-cover relative z-[1] opacity-0 transition-opacity duration-300 ${isDeleting ? 'grayscale' : ''}`}
                  onLoad={(e) => {
                    e.currentTarget.classList.remove('opacity-0');
                    e.currentTarget.classList.add('opacity-100');
                    const skel = e.currentTarget.parentElement?.querySelector('.photo-skeleton');
                    if (skel) skel.style.opacity = '0';
                  }}
                />

                {/* Deleting overlay */}
                {isDeleting && (
                  <div className="absolute inset-0 z-[3] bg-red-600/60 backdrop-blur-[2px] flex flex-col items-center justify-center gap-1.5 animate-pulse">
                    <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span className="text-[10px] font-bold text-white tracking-wide uppercase">Deleting...</span>
                  </div>
                )}

                {idx === 0 && !isDeleting && (
                  <span className="absolute top-2 left-2 z-[2] bg-primary-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{t('cover') || 'Cover'}</span>
                )}
                {!isDeleting && (
                  <button
                    onClick={() => deletePhoto(photo.id)}
                    className="absolute top-2 right-2 z-[2] bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition-colors md:opacity-0 md:group-hover:opacity-100 shadow-md min-w-[36px] min-h-[36px] flex items-center justify-center"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              );
            })}
            
            {/* Pulsing loading animation card */}
            {(uploadingPhotos || isFetching) && (
              <div className="relative aspect-square rounded-2xl overflow-hidden border border-primary-200 bg-primary-50/30 flex flex-col items-center justify-center gap-2 shadow-inner animate-pulse">
                <div className="h-6 w-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-[10px] font-bold text-primary-700 tracking-wide uppercase">{t('uploading') || 'Uploading...'}</span>
              </div>
            )}
          </div>
        )}

        {/* Upload area */}
        <label className="flex flex-col items-center justify-center gap-2 p-8 border-2 border-dashed border-surface-300 rounded-2xl cursor-pointer hover:border-primary-400 hover:bg-primary-50/50 transition-all">
          <div className="p-3 bg-surface-100 rounded-xl">
            <Upload size={24} className="text-surface-500" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-surface-700">{t('clickToUpload') || 'Click to upload files'}</p>
            <p className="text-xs text-surface-400 mt-1">{t('imagesCompressed') || 'Images are automatically optimized.'}</p>
          </div>
          <input
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            onChange={handlePhotoUpload}
            className="hidden"
          />
        </label>
      </div>
    );
  } else {
    steps.push(
      <div key="photos" className="space-y-4">
        <div className="text-center py-12 text-surface-400">
          <div className="p-4 bg-surface-100 rounded-2xl inline-block mb-4">
            <Camera size={32} className="text-surface-300" />
          </div>
          <p className="font-medium text-surface-600">{t('addPhotosAfter') || 'Photos can be uploaded after saving.'}</p>
          <p className="text-sm mt-1">{t('uploadOnceSaved') || 'You will be able to upload photos once the listing is created.'}</p>
        </div>
      </div>
    );
  }

  const activeStepsList = STEPS;

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center text-surface-400">
        <div className="flex flex-col items-center gap-3">
          <svg viewBox="0 0 64 64" fill="none" className="w-14 h-14">
            <rect x="16" y="30" width="32" height="24" rx="3" fill="#e2e8f0" stroke="#0d9488" strokeWidth="2">
              <animate attributeName="opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite" />
            </rect>
            <path d="M12 32 L32 14 L52 32" stroke="#0d9488" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none">
              <animate attributeName="stroke-dasharray" values="0,100;60,40;0,100" dur="2.5s" repeatCount="indefinite" />
            </path>
            <rect x="27" y="38" width="10" height="16" rx="2" fill="#0d9488" opacity="0.3">
              <animate attributeName="opacity" values="0.3;0.6;0.3" dur="1.5s" repeatCount="indefinite" />
            </rect>
          </svg>
          <div className="flex gap-1">
            <div className="w-1.5 h-1.5 bg-primary-400 rounded-full animate-bounce" />
            <div className="w-1.5 h-1.5 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
            <div className="w-1.5 h-1.5 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
          </div>
          <p className="text-sm font-medium">{t('loadingListing')}</p>
        </div>
      </div>
    );
  }

  // Tenant booking selection screen (before the form)
  const showBookingSelector = user?.role === 'TENANT' && !isEdit && !isFromBooking && selectedBooking === null && !form._started;

  if (showBookingSelector) {
    return (
      <div className="max-w-2xl mx-auto">
        <PageHeader title={t('createRoomSharingTitle')} subtitle={t('chooseBookedHouse')} />
        <div className="card p-6 mt-6 space-y-4">
          {bookingsLoading ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3 text-surface-500">
              <svg viewBox="0 0 64 64" fill="none" className="w-16 h-16">
                <rect x="16" y="30" width="32" height="24" rx="3" fill="#f1f5f9" stroke="#0d9488" strokeWidth="2">
                  <animate attributeName="opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite" />
                </rect>
                <path d="M12 32 L32 14 L52 32" stroke="#0d9488" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none">
                  <animate attributeName="stroke-dasharray" values="0,100;60,40;0,100" dur="2.5s" repeatCount="indefinite" />
                </path>
                <rect x="27" y="38" width="10" height="16" rx="2" fill="#0d9488" opacity="0.3">
                  <animate attributeName="opacity" values="0.3;0.6;0.3" dur="1.5s" repeatCount="indefinite" />
                </rect>
              </svg>
              <div className="flex gap-1.5 mt-1">
                <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
              </div>
              <p className="text-sm font-medium">{t('loadingBookings') || 'Loading your booked houses...'}</p>
            </div>
          ) : (
            <>
              {acceptedBookings.length > 0 && (
                <>
                  <p className="text-sm font-semibold text-surface-700">{t('yourBookedHouses')}</p>
                  <div className="space-y-3">
                    {acceptedBookings.map((booking) => (
                      <button
                        key={booking.id}
                        type="button"
                        onClick={() => {
                          setSelectedBooking(booking);
                          setForm((prev) => ({ ...prev, _started: true }));
                          setAddressInput(booking.listing?.address || '');
                          setForm((prev) => ({
                            ...prev,
                            _started: true,
                            type: 'ROOM_SHARING',
                            title: `Room sharing at ${booking.listing?.title || 'my place'}`,
                            address: booking.listing?.address || '',
                            city: booking.listing?.city || '',
                            state: booking.listing?.state || '',
                            pincode: booking.listing?.pincode || '',
                            latitude: booking.listing?.latitude || '',
                            longitude: booking.listing?.longitude || '',
                          }));
                        }}
                        className="w-full flex items-center gap-4 p-4 rounded-xl border border-surface-200 hover:border-primary-400 hover:bg-primary-50/50 transition-all text-left"
                      >
                        <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0">
                          <Home size={20} className="text-primary-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-surface-900 text-sm truncate">{booking.listing?.title}</p>
                          <div className="flex items-center gap-1 text-xs text-surface-400 mt-0.5">
                            <MapPin size={11} />
                            {[booking.listing?.address, booking.listing?.city].filter(Boolean).join(', ')}
                          </div>
                        </div>
                        <span className="text-xs font-medium text-primary-600 shrink-0">{t('selectArrow')}</span>
                      </button>
                    ))}
                  </div>
                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-surface-200" /></div>
                    <div className="relative flex justify-center"><span className="bg-surface-50/80 px-3 text-xs text-surface-400">{t('or')}</span></div>
                  </div>
                </>
              )}
            </>
          )}
          <button
            type="button"
            onClick={() => {
              setSelectedBooking('other');
              setForm((prev) => ({ ...prev, _started: true, type: 'ROOM_SHARING' }));
            }}
            className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-dashed border-surface-300 hover:border-primary-400 hover:bg-primary-50/50 transition-all text-left"
          >
            <div className="w-12 h-12 rounded-xl bg-surface-100 flex items-center justify-center flex-shrink-0">
              <DoorOpen size={20} className="text-surface-500" />
            </div>
            <div>
              <p className="font-semibold text-surface-900 text-sm">{t('otherRoom')}</p>
              <p className="text-xs text-surface-400 mt-0.5">{t('listRoomNotIn')}</p>
            </div>
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-2xl mx-auto">
        <PageHeader title={isEdit ? t('editListing') : isFromBooking ? t('createFromBooking') : t('addNewListingBtn')} subtitle={isEdit ? t('updateDetails') : isFromBooking ? t('shareBookedProperty') : t('fillDetails')} />

        {/* Progress */}
        <div className="flex items-center gap-2 my-6">
          {activeStepsList.map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 transition-all ${i <= step ? 'bg-primary-600 text-white' : 'bg-surface-200 text-surface-400'}`}>
                {i < step ? '✓' : i + 1}
              </div>
              {i < activeStepsList.length - 1 && <div className={`h-1 flex-1 rounded-full transition-all ${i < step ? 'bg-primary-500' : 'bg-surface-200'}`} />}
            </div>
          ))}
        </div>

        <div className="card p-6">
          <h2 className="font-display font-semibold text-lg text-surface-900 mb-5">{t(activeStepsList[step])}</h2>
          {steps[step]}
        </div>

        <div className="flex flex-col sm:flex-row justify-between gap-3 mt-4">
          <Button variant="secondary" size="lg" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0} className="w-full sm:w-auto min-h-[48px]">
            {t('previous')}
          </Button>
          {step < activeStepsList.length - 1 ? (
            <Button variant="primary" size="lg" onClick={() => setStep((s) => s + 1)} className="w-full sm:w-auto min-h-[48px]">{t('next')}</Button>
          ) : (
            <Button variant="primary" size="lg" loading={isPending} onClick={() => save()} className="w-full sm:w-auto min-h-[48px]">
              {isEdit ? t('saveListing') : t('createListing')}
            </Button>
          )}
        </div>
      </div>
    </>
  );
};

export default CreateListing;
