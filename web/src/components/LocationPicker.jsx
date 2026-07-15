// LocationPicker — click on map or get current location to set coordinates
import { useRef, useEffect, useState, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import toast from 'react-hot-toast';
import { MapPin, Crosshair, Loader2 } from 'lucide-react';

const OPENFREEMAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty';

const LocationPicker = ({ latitude, longitude, onChange }) => {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  const updateMarker = useCallback((lng, lat) => {
    if (!mapRef.current) return;
    if (markerRef.current) {
      markerRef.current.setLngLat([lng, lat]);
    } else {
      const el = document.createElement('div');
      el.style.cssText = 'width:24px;height:24px;background:#4f46e5;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(79,70,229,0.5);cursor:pointer;';
      markerRef.current = new maplibregl.Marker({ element: el })
        .setLngLat([lng, lat])
        .addTo(mapRef.current);
    }
    mapRef.current.flyTo({ center: [lng, lat], zoom: 15 });
  }, []);

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const center = [78.4867, 17.3850]; // Default: Hyderabad

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: OPENFREEMAP_STYLE,
      center,
      zoom: 12,
      cooperativeGestures: true,
    });

    map.addControl(new maplibregl.NavigationControl(), 'top-right');

    map.on('click', (e) => {
      const { lng, lat } = e.lngLat;
      updateMarker(lng, lat);
      onChange(Number(lat.toFixed(6)), Number(lng.toFixed(6)));
    });

    mapRef.current = map;
    setMapReady(true);

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  // Sync marker when lat/lng props change externally (e.g. from address autocomplete)
  useEffect(() => {
    if (mapReady && latitude && longitude) {
      updateMarker(Number(longitude), Number(latitude));
    }
  }, [latitude, longitude, mapReady, updateMarker]);

  const isSecure = typeof window !== 'undefined' && (window.location.protocol === 'https:' || window.location.hostname === 'localhost');

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }
    if (!isSecure) {
      toast('Location requires HTTPS. You can still click on the map to set coordinates.', { duration: 5000 });
      return;
    }
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));
        updateMarker(lng, lat);
        onChange(lat, lng);
        setGettingLocation(false);
        toast.success('Location set!');
      },
      (err) => {
        console.error('Geolocation error:', err);
        if (err.code === 1) {
          toast.error('Location permission denied. Please allow location access in your browser settings.');
        } else {
          toast.error('Unable to get your location. Please try again or select on the map.');
        }
        setGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={getCurrentLocation}
          disabled={gettingLocation}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors border disabled:opacity-50 ${
            isSecure
              ? 'bg-primary-50 text-primary-700 hover:bg-primary-100 border-primary-200'
              : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200'
          }`}
        >
          {gettingLocation ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Crosshair size={16} />
          )}
          {gettingLocation ? 'Getting location...' : isSecure ? 'Get Current Location' : '📍 HTTPS needed for location'}
        </button>
        {latitude && longitude && (
          <span className="text-xs text-surface-400 flex items-center gap-1">
            <MapPin size={12} /> {latitude}, {longitude}
          </span>
        )}
      </div>
      {!isSecure && (
        <p className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-xl">
          ⚠️ Location access requires HTTPS. Use <strong>localhost:5173</strong> or click on the map to set coordinates manually.
        </p>
      )}

      <div className="rounded-2xl overflow-hidden border border-surface-200" style={{ height: '300px' }}>
        <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
      </div>

      <p className="text-xs text-surface-400 text-center">Click on the map or use "Get Current Location" to set exact coordinates</p>
    </div>
  );
};

export default LocationPicker;
