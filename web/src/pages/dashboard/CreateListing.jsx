import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { listingsAPI, uploadAPI } from '../../services/endpoints';
import PageHeader from '../../components/layout/PageHeader';
import { Input, Select, Textarea, Button } from '../../components/ui';

const STEPS = ['Basic Info', 'Location', 'Amenities', 'Room Details'];

const AMENITY_FIELDS = ['wifi','parking','washingMachine','ac','fridge','kitchen','lift','gym','security','powerBackup','waterSupply','cctv'];
const AMENITY_LABELS = { wifi:'WiFi', parking:'Parking', washingMachine:'Washing Machine', ac:'AC', fridge:'Fridge', kitchen:'Kitchen', lift:'Lift', gym:'Gym', security:'Security', powerBackup:'Power Backup', waterSupply:'Water Supply', cctv:'CCTV' };

const defaultForm = {
  title: '', description: '', type: 'HOUSE_RENTAL', rent: '', deposit: '', maintenance: '',
  address: '', city: '', state: '', pincode: '', latitude: '', longitude: '',
  bedrooms: '1', bathrooms: '1', balcony: false, parking: false, areaSqFt: '', furnished: false,
  availableFrom: '',
  amenities: Object.fromEntries(AMENITY_FIELDS.map((f) => [f, false])),
  roomSharing: { genderRequired: 'ANY', minAge: '', maxAge: '', smoking: false, drinking: false, vegOnly: false, petsAllowed: false, currentOccupants: '0', totalRooms: '1' },
};

const CreateListing = () => {
  const { id } = useParams();
  const isEdit = !!id;
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(defaultForm);

  const [addressInput, setAddressInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const set = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));
  const setAmenity = (key, val) => setForm((prev) => ({ ...prev, amenities: { ...prev.amenities, [key]: val } }));
  const setRS = (key, val) => setForm((prev) => ({ ...prev, roomSharing: { ...prev.roomSharing, [key]: val } }));

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

  const { data: listingData, isLoading } = useQuery({
    queryKey: ['listing', id],
    queryFn: () => listingsAPI.getOne(id).then((r) => r.data.data),
    enabled: isEdit,
  });

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
      });
    }
  }, [listingData]);

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
      return isEdit ? listingsAPI.update(id, payload) : listingsAPI.create(payload);
    },
    onSuccess: ({ data }) => {
      toast.success(isEdit ? 'Listing saved!' : 'Listing created! Now add photos.');
      if (!isEdit) {
        navigate(`/dashboard/listings/${data.data.id}/edit`);
      } else {
        qc.invalidateQueries({ queryKey: ['myListings'] });
        navigate('/dashboard/listings');
      }
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Failed to save'),
  });

  const { mutate: deletePhoto } = useMutation({
    mutationFn: (photoId) => uploadAPI.deletePhoto(photoId),
    onSuccess: () => {
      toast.success('Photo deleted');
      qc.invalidateQueries({ queryKey: ['listing', id] });
    },
    onError: () => toast.error('Failed to delete photo'),
  });

  const handlePhotoUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fd = new FormData();
    for (let i = 0; i < files.length; i++) {
      fd.append('photos', files[i]);
    }

    try {
      toast.loading('Uploading photos...', { id: 'photo-upload' });
      await uploadAPI.listingPhotos(id, fd);
      toast.success('Photos uploaded!', { id: 'photo-upload' });
      qc.invalidateQueries({ queryKey: ['listing', id] });
    } catch {
      toast.error('Failed to upload photos', { id: 'photo-upload' });
    }
  };

  const steps = [
    // Step 0 — Basic Info
    <div key="basic" className="space-y-4">
      <Input label="Listing Title" value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Spacious 2BHK in Banjara Hills" />
      <Textarea label="Description" value={form.description} onChange={(e) => set('description', e.target.value)} rows={4} placeholder="Describe the property..." />
      <Select
        label="Listing Type"
        value={form.type}
        onChange={(e) => set('type', e.target.value)}
        options={[{ value: 'HOUSE_RENTAL', label: 'House Rental' }, { value: 'ROOM_SHARING', label: 'Room Sharing' }]}
      />
      <div className="grid grid-cols-3 gap-4">
        <Input label="Rent (₹/mo)" type="number" value={form.rent} onChange={(e) => set('rent', e.target.value)} />
        <Input label="Deposit (₹)" type="number" value={form.deposit} onChange={(e) => set('deposit', e.target.value)} />
        <Input label="Maintenance (₹)" type="number" value={form.maintenance} onChange={(e) => set('maintenance', e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input label="Bedrooms" type="number" value={form.bedrooms} onChange={(e) => set('bedrooms', e.target.value)} />
        <Input label="Bathrooms" type="number" value={form.bathrooms} onChange={(e) => set('bathrooms', e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input label="Area (sqft)" type="number" value={form.areaSqFt} onChange={(e) => set('areaSqFt', e.target.value)} />
        <Input label="Available From" type="date" value={form.availableFrom} onChange={(e) => set('availableFrom', e.target.value)} />
      </div>
      <div className="flex gap-6">
        {[['furnished', 'Furnished'], ['balcony', 'Has Balcony'], ['parking', 'Parking Available']].map(([key, label]) => (
          <label key={key} className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form[key]} onChange={(e) => set(key, e.target.checked)} className="w-4 h-4 accent-primary-600" />
            <span className="text-sm text-surface-700">{label}</span>
          </label>
        ))}
      </div>
    </div>,

    // Step 1 — Location
    <div key="location" className="space-y-4">
      <div className="relative">
        <Input
          label="Search Full Address"
          value={addressInput}
          onChange={(e) => {
            setAddressInput(e.target.value);
            setShowSuggestions(true);
            set('address', e.target.value);
          }}
          placeholder="Start typing your property address..."
          className="w-full"
        />
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute left-0 right-0 z-50 bg-white border border-surface-200 rounded-xl mt-1 shadow-lg max-h-48 overflow-y-auto py-1">
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
      <div className="grid grid-cols-2 gap-4">
        <Input label="City" value={form.city} onChange={(e) => set('city', e.target.value)} />
        <Input label="State" value={form.state} onChange={(e) => set('state', e.target.value)} />
      </div>
      <Input label="Pincode" value={form.pincode} onChange={(e) => set('pincode', e.target.value)} />
      <div className="grid grid-cols-2 gap-4">
        <Input label="Latitude" type="number" step="any" value={form.latitude} onChange={(e) => set('latitude', e.target.value)} placeholder="e.g. 17.3850" />
        <Input label="Longitude" type="number" step="any" value={form.longitude} onChange={(e) => set('longitude', e.target.value)} placeholder="e.g. 78.4867" />
      </div>
    </div>,

    // Step 2 — Amenities
    <div key="amenities" className="space-y-3">
      <p className="text-sm text-surface-500">Select all amenities available at this property</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {AMENITY_FIELDS.map((key) => (
          <label key={key} className={`flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${form.amenities[key] ? 'border-primary-500 bg-primary-50' : 'border-surface-200 hover:border-surface-300'}`}>
            <input type="checkbox" checked={form.amenities[key]} onChange={(e) => setAmenity(key, e.target.checked)} className="w-4 h-4 accent-primary-600" />
            <span className="text-sm font-medium text-surface-700">{AMENITY_LABELS[key]}</span>
          </label>
        ))}
      </div>
    </div>,

    // Step 3 — Room Sharing details (conditional)
    <div key="room" className="space-y-4">
      {form.type === 'ROOM_SHARING' ? (
        <>
          <Select label="Gender Preference" value={form.roomSharing.genderRequired} onChange={(e) => setRS('genderRequired', e.target.value)}
            options={[{ value: 'ANY', label: 'Any' }, { value: 'MALE', label: 'Male Only' }, { value: 'FEMALE', label: 'Female Only' }]} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Min Age" type="number" value={form.roomSharing.minAge} onChange={(e) => setRS('minAge', e.target.value)} />
            <Input label="Max Age" type="number" value={form.roomSharing.maxAge} onChange={(e) => setRS('maxAge', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Current Occupants" type="number" value={form.roomSharing.currentOccupants} onChange={(e) => setRS('currentOccupants', e.target.value)} />
            <Input label="Total Rooms" type="number" value={form.roomSharing.totalRooms} onChange={(e) => setRS('totalRooms', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[['smoking', 'Smoking Allowed'], ['drinking', 'Drinking Allowed'], ['vegOnly', 'Veg Only'], ['petsAllowed', 'Pets Allowed']].map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer p-3 border rounded-xl hover:bg-surface-50">
                <input type="checkbox" checked={form.roomSharing[key]} onChange={(e) => setRS(key, e.target.checked)} className="w-4 h-4 accent-primary-600" />
                <span className="text-sm text-surface-700">{label}</span>
              </label>
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-12 text-surface-400">
          <p className="text-4xl mb-3">🏠</p>
          <p className="font-medium">No room sharing details needed</p>
          <p className="text-sm">This is a house rental listing</p>
        </div>
      )}
    </div>,
  ];

  if (isEdit) {
    steps.push(
      <div key="photos" className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-surface-500">Upload photos of your property</p>
          <label className="btn-secondary btn-sm rounded-xl cursor-pointer flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold">
            <Plus size={14} /> Add Photo
            <input type="file" multiple accept="image/*" onChange={handlePhotoUpload} className="hidden" />
          </label>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-4">
          {listingData?.photos?.map((photo) => (
            <div key={photo.id} className="relative aspect-square rounded-2xl overflow-hidden group border border-surface-100">
              <img src={photo.url} alt="" className="w-full h-full object-cover" />
              <button
                onClick={() => deletePhoto(photo.id)}
                className="absolute top-2 right-2 bg-red-600 text-white p-1.5 rounded-full hover:bg-red-700 transition-colors opacity-0 group-hover:opacity-100 shadow-md"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const activeStepsList = isEdit ? [...STEPS, 'Photos'] : STEPS;

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center text-surface-400">
        <div className="w-10 h-10 border-3 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm font-medium">Loading listing details…</p>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-2xl mx-auto">
        <PageHeader title={isEdit ? "Edit Listing" : "Add New Listing"} subtitle={isEdit ? "Update your property details" : "Fill in the details to list your property"} />

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
          <h2 className="font-display font-semibold text-lg text-surface-900 mb-5">{activeStepsList[step]}</h2>
          {steps[step]}
        </div>

        <div className="flex justify-between mt-4">
          <Button variant="secondary" size="md" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
            Previous
          </Button>
          {step < activeStepsList.length - 1 ? (
            <Button variant="primary" size="md" onClick={() => setStep((s) => s + 1)}>Next</Button>
          ) : (
            <Button variant="primary" size="md" loading={isPending} onClick={() => save()}>
              🚀 {isEdit ? 'Save Listing' : 'Create Listing'}
            </Button>
          )}
        </div>
      </div>
    </>
  );
};

export default CreateListing;
