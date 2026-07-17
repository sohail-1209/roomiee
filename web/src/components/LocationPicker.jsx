// LocationPicker — click on map or get current location to set coordinates + auto-fill address
import { useRef, useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import toast from 'react-hot-toast';
import { MapPin, Crosshair } from 'lucide-react';
import Spinner from './ui/Spinner';

const OPENFREEMAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty';
const GEOAPIFY_KEY = 'c471b4637f644bbaa597b0103c703121';

const LocationPicker = ({ latitude, longitude, onChange, onAddressFill }) => {
  const { t } = useTranslation();
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  // Reverse geocode to fill address fields
  const reverseGeocode = useCallback(async (lat, lng) => {
    if (!onAddressFill) return;
    try {
      const res = await fetch(
        `https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lng}&apiKey=${GEOAPIFY_KEY}&format=json&addressdetails=1`
      );
      const data = await res.json();
      const feat = data.features?.[0];
      if (!feat) return;
      const addr = feat.properties;
      onAddressFill({
        address: addr.address_line1 || addr.formatted || '',
        city: addr.city || addr.town || addr.village || addr.county || '',
        state: addr.state || '',
        pincode: addr.postcode || '',
        latitude: lat,
        longitude: lng,
      });
    } catch (err) {
      console.error('Reverse geocode error:', err);
    }
  }, [onAddressFill]);

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
      const fixedLat = Number(lat.toFixed(6));
      const fixedLng = Number(lng.toFixed(6));
      updateMarker(fixedLng, fixedLat);
      onChange(fixedLat, fixedLng);
      reverseGeocode(fixedLat, fixedLng);
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
      toast.error(t('geoNotSupported'));
      return;
    }
    if (!isSecure) {
      toast(t('httpsRequiredMsg'), { duration: 5000 });
      return;
    }
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));
        updateMarker(lng, lat);
        onChange(lat, lng);
        reverseGeocode(lat, lng);
        setGettingLocation(false);
        toast.success(t('locationSet'));
      },
      (err) => {
        console.error('Geolocation error:', err);
        if (err.code === 1) {
          toast.error(t('locationDenied'));
        } else {
          toast.error(t('unableToGetLocation'));
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
            <Spinner size="sm" />
          ) : (
            <Crosshair size={16} />
          )}
          {gettingLocation ? t('gettingLocation') : isSecure ? t('getCurrentLocation') : t('httpsRequired')}
        </button>
        {latitude && longitude && (
          <span className="text-xs text-surface-400 flex items-center gap-1">
            <MapPin size={12} /> {latitude}, {longitude}
          </span>
        )}
      </div>
      {!isSecure && (
        <p className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-xl">
          {t('httpsWarning')}
        </p>
      )}

      <div className="rounded-2xl overflow-hidden border border-surface-200" style={{ height: '300px' }}>
        <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
      </div>

      <p className="text-xs text-surface-400 text-center">{t('clickMapOrUse')}</p>
    </div>
  );
};

export default LocationPicker;
