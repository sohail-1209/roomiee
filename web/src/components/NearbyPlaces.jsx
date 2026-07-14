// NearbyPlaces — fetches nearby POIs via Overpass API and calculates walking distance/duration via OpenRouteService
// Reused in Listing Detail and Room Detail pages
import { useState, useEffect } from 'react';
import { Hospital, GraduationCap, Train, Bus, ShoppingBag, Dumbbell, Landmark, Fuel } from 'lucide-react';

const CATEGORIES = [
  { key: 'hospital', label: 'Hospital', icon: Hospital, query: 'amenity=hospital', color: 'text-red-500' },
  { key: 'college', label: 'College', icon: GraduationCap, query: 'amenity=college', color: 'text-blue-500' },
  { key: 'metro', label: 'Metro', icon: Train, query: 'railway=station', color: 'text-purple-500' },
  { key: 'bus', label: 'Bus Stop', icon: Bus, query: 'highway=bus_stop', color: 'text-green-500' },
  { key: 'grocery', label: 'Grocery', icon: ShoppingBag, query: 'shop=supermarket', color: 'text-amber-500' },
  { key: 'gym', label: 'Gym', icon: Dumbbell, query: 'leisure=fitness_centre', color: 'text-orange-500' },
  { key: 'bank', label: 'ATM', icon: Landmark, query: 'amenity=atm', color: 'text-teal-500' },
  { key: 'petrol', label: 'Petrol', icon: Fuel, query: 'amenity=fuel', color: 'text-slate-500' },
];

const fetchNearby = async (lat, lng, query, radius = 1000) => {
  const q = `[out:json][timeout:10];
    (node[${query}](around:${radius},${lat},${lng});
     way[${query}](around:${radius},${lat},${lng}););
    out center 5;`;
  const res = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(q)}`);
  const data = await res.json();
  return data.elements?.slice(0, 5).map((el) => ({
    id: el.id,
    name: el.tags?.name || query.split('=')[1],
    lat: el.lat || el.center?.lat,
    lng: el.lon || el.center?.lon,
  }));
};

const fetchDistances = async (startLat, startLng, destinations) => {
  if (!destinations || destinations.length === 0) return [];
  const ORS_KEY = 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImUzOTVlOTU3M2NiNDQ4ODJhOTkxZWVjMDkzMTFjNzE4IiwiaCI6Im11cm11cjY0In0=';
  
  try {
    const locations = [
      [Number(startLng), Number(startLat)],
      ...destinations.map((d) => [Number(d.lng), Number(d.lat)]),
    ];
    const res = await fetch('https://api.openrouteservice.org/v2/matrix/foot-walking', {
      method: 'POST',
      headers: {
        Authorization: ORS_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        locations,
        sources: [0],
        metrics: ['distance', 'duration'],
      }),
    });
    const data = await res.json();
    
    return destinations.map((d, idx) => {
      const durationSec = data.durations?.[0]?.[idx + 1];
      const distanceM = data.distances?.[0]?.[idx + 1];
      return {
        ...d,
        duration: durationSec !== undefined && durationSec !== null ? Math.round(durationSec / 60) : null,
        distance: distanceM !== undefined && distanceM !== null ? (distanceM / 1000).toFixed(1) : null,
      };
    });
  } catch (err) {
    console.error('OpenRouteService matrix error:', err);
    return destinations.map(d => ({ ...d, duration: null, distance: null }));
  }
};

const NearbyPlaces = ({ lat, lng }) => {
  const [places, setPlaces] = useState({});
  const [activeCategory, setActiveCategory] = useState('hospital');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!lat || !lng || places[activeCategory]) return;
    setLoading(true);
    const cat = CATEGORIES.find((c) => c.key === activeCategory);
    fetchNearby(lat, lng, cat.query)
      .then(async (data) => {
        const withDistances = await fetchDistances(lat, lng, data || []);
        setPlaces((prev) => ({ ...prev, [activeCategory]: withDistances }));
      })
      .catch(() => setPlaces((prev) => ({ ...prev, [activeCategory]: [] })))
      .finally(() => setLoading(false));
  }, [lat, lng, activeCategory, places]);

  const current = places[activeCategory] || [];
  const cat = CATEGORIES.find((c) => c.key === activeCategory);
  const Icon = cat?.icon;

  return (
    <div className="card p-5">
      <h3 className="font-display font-semibold text-lg text-surface-900 mb-4">Nearby Places</h3>

      {/* Category tabs */}
      <div className="flex gap-2 flex-wrap mb-4">
        {CATEGORIES.map((c) => {
          const CIcon = c.icon;
          return (
            <button
              key={c.key}
              onClick={() => setActiveCategory(c.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                activeCategory === c.key
                  ? 'bg-primary-600 text-white'
                  : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
              }`}
            >
              <CIcon size={13} />
              {c.label}
            </button>
          );
        })}
      </div>

      {/* Places list */}
      {loading ? (
        <div className="space-y-2">
          {[1,2,3].map((i) => <div key={i} className="skeleton h-10 rounded-xl" />)}
        </div>
      ) : current.length === 0 ? (
        <p className="text-surface-400 text-sm text-center py-4">No {cat?.label} found nearby</p>
      ) : (
        <div className="space-y-2">
          {current.map((place) => (
            <div key={place.id} className="flex items-center justify-between p-3 bg-surface-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className={`p-2 bg-white rounded-lg shadow-sm ${cat?.color}`}>
                  {Icon && <Icon size={16} />}
                </div>
                <div>
                  <p className="text-sm font-medium text-surface-800">{place.name}</p>
                  <p className="text-xs text-surface-400">Within 1km</p>
                </div>
              </div>
              
              <div className="flex flex-col items-end text-right text-xs">
                {place.duration !== null && place.duration !== undefined && (
                  <span className="font-semibold text-primary-600">{place.duration} mins walk</span>
                )}
                {place.distance !== null && place.distance !== undefined && (
                  <span className="text-surface-400">{place.distance} km</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NearbyPlaces;
