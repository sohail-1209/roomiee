// NearbyPlaces — fetches nearby POIs via Geoapify Places API
import { useState, useEffect, useCallback } from 'react';
import { Hospital, GraduationCap, Train, Bus, ShoppingBag, Dumbbell, Landmark, Fuel, Utensils, TreePine, Navigation, RefreshCw } from 'lucide-react';

const GEOAPIFY_KEY = 'c471b4637f644bbaa597b0103c703121';

const CATEGORIES = [
  { key: 'hospital', label: 'Hospital', icon: Hospital, geoapify: 'healthcare.hospital,healthcare.clinic_or_praxis', color: 'text-red-500' },
  { key: 'college', label: 'College', icon: GraduationCap, geoapify: 'education.school,education.university,education.college', color: 'text-blue-500' },
  { key: 'metro', label: 'Metro', icon: Train, geoapify: 'public_transport.subway', color: 'text-purple-500' },
  { key: 'bus', label: 'Bus Stop', icon: Bus, geoapify: 'public_transport.bus', color: 'text-green-500' },
  { key: 'grocery', label: 'Grocery', icon: ShoppingBag, geoapify: 'commercial.supermarket,commercial.convenience', color: 'text-amber-500' },
  { key: 'gym', label: 'Gym', icon: Dumbbell, geoapify: 'sport.fitness.gym,sport.fitness.fitness_centre', color: 'text-orange-500' },
  { key: 'bank', label: 'ATM', icon: Landmark, geoapify: 'service.financial.bank,service.financial.atm', color: 'text-teal-500' },
  { key: 'petrol', label: 'Petrol', icon: Fuel, geoapify: 'service.vehicle.fuel', color: 'text-slate-500' },
  { key: 'restaurant', label: 'Restaurant', icon: Utensils, geoapify: 'catering.restaurant,catering.cafe,catering.fast_food', color: 'text-rose-500' },
  { key: 'park', label: 'Park', icon: TreePine, geoapify: 'leisure.park', color: 'text-emerald-500' },
];

const fetchWithRetry = async (url, retries = 2, delay = 1000) => {
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return res;
      if (i < retries) await new Promise(r => setTimeout(r, delay * (i + 1)));
    } catch (err) {
      if (i < retries) await new Promise(r => setTimeout(r, delay * (i + 1)));
      else throw err;
    }
  }
  throw new Error('Failed after retries');
};

const fetchAllCategories = async (lat, lng, radius = 2000) => {
  const allCategories = CATEGORIES.map(c => c.geoapify).join(',');
  const url = `https://api.geoapify.com/v2/places?categories=${allCategories}&filter=circle:${lng},${lat},${radius}&limit=50&apiKey=${GEOAPIFY_KEY}`;

  const res = await fetchWithRetry(url);
  const data = await res.json();
  return data.features || [];
};

const categorizeFeature = (feature) => {
  const cats = feature.properties?.categories || '';
  if (cats.includes('healthcare')) return 'hospital';
  if (cats.includes('education')) return 'college';
  if (cats.includes('subway')) return 'metro';
  if (cats.includes('public_transport') && cats.includes('bus')) return 'bus';
  if (cats.includes('commercial') && !cats.includes('service')) return 'grocery';
  if (cats.includes('sport.fitness')) return 'gym';
  if (cats.includes('service.financial')) return 'bank';
  if (cats.includes('service.vehicle.fuel')) return 'petrol';
  if (cats.includes('catering')) return 'restaurant';
  if (cats.includes('leisure.park')) return 'park';
  return null;
};

const NearbyPlaces = ({ lat, lng }) => {
  const [places, setPlaces] = useState({});
  const [activeCategory, setActiveCategory] = useState('hospital');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadAllPlaces = useCallback(async () => {
    if (!lat || !lng) return;

    setLoading(true);
    setError(false);

    try {
      const features = await fetchAllCategories(lat, lng);

      const grouped = {};
      CATEGORIES.forEach(c => { grouped[c.key] = []; });

      features.forEach((f) => {
        const category = categorizeFeature(f);
        if (category && grouped[category]) {
          grouped[category].push({
            id: f.properties?.place_id || Math.random(),
            name: f.properties?.name || f.properties?.address_line1 || 'Nearby Place',
            lat: f.geometry?.coordinates?.[1],
            lng: f.geometry?.coordinates?.[0],
          });
        }
      });

      Object.keys(grouped).forEach(key => {
        grouped[key] = grouped[key].slice(0, 5);
      });

      setPlaces(grouped);
    } catch (err) {
      console.error('Nearby places error:', err.message);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [lat, lng]);

  useEffect(() => {
    loadAllPlaces();
  }, [loadAllPlaces]);

  const current = places[activeCategory] || [];
  const cat = CATEGORIES.find((c) => c.key === activeCategory);
  const Icon = cat?.icon;

  const openInMaps = (place) => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}&travelmode=walking`, '_blank');
  };

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-semibold text-lg text-surface-900">Nearby Places</h3>
        <button onClick={loadAllPlaces} disabled={loading} className="p-2 hover:bg-surface-100 rounded-lg transition-colors" title="Refresh">
          <RefreshCw size={16} className={`text-surface-500 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="flex gap-2 flex-wrap mb-4">
        {CATEGORIES.map((c) => {
          const CIcon = c.icon;
          const hasData = places[c.key]?.length > 0;
          return (
            <button
              key={c.key}
              onClick={() => setActiveCategory(c.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                activeCategory === c.key
                  ? 'bg-primary-600 text-white'
                  : hasData
                    ? 'bg-surface-100 text-surface-700 hover:bg-surface-200'
                    : 'bg-surface-50 text-surface-400'
              }`}
            >
              <CIcon size={13} />
              {c.label}
              {hasData && <span className="ml-1 text-[10px] opacity-70">({places[c.key].length})</span>}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1,2,3].map((i) => <div key={i} className="skeleton h-10 rounded-xl" />)}
        </div>
      ) : error ? (
        <div className="text-center py-4">
          <p className="text-surface-400 text-sm mb-2">Failed to load places</p>
          <button onClick={loadAllPlaces} className="text-primary-600 text-sm font-medium hover:underline">Try again</button>
        </div>
      ) : current.length === 0 ? (
        <p className="text-surface-400 text-sm text-center py-4">No {cat?.label} found nearby</p>
      ) : (
        <div className="space-y-2">
          {current.map((place) => (
            <div
              key={place.id}
              className="flex items-center justify-between p-3 bg-surface-50 rounded-xl hover:bg-surface-100 cursor-pointer transition-colors"
              onClick={() => openInMaps(place)}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 bg-white rounded-lg shadow-sm ${cat?.color}`}>
                  {Icon && <Icon size={16} />}
                </div>
                <div>
                  <p className="text-sm font-medium text-surface-800">{place.name}</p>
                  <p className="text-xs text-surface-400">Tap to navigate</p>
                </div>
              </div>
              <Navigation size={14} className="text-primary-500" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NearbyPlaces;
