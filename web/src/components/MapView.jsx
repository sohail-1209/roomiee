// MapView — reusable MapLibre GL JS map using OpenFreeMap tiles
import { useRef, useEffect } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const OPENFREEMAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty';

const MapView = ({
  lat,
  lng,
  title = 'Property Location',
  showCircle = true,
  className = 'h-72',
  zoom = 14,
}) => {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    if (!lat || !lng || !mapContainer.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: OPENFREEMAP_STYLE,
      center: [Number(lng), Number(lat)],
      zoom,
      cooperativeGestures: true,
    });

    map.addControl(new maplibregl.NavigationControl(), 'top-right');

    const markerEl = document.createElement('div');
    markerEl.style.cssText = showCircle
      ? 'width:20px;height:20px;background:#4f46e5;border:2px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(79,70,229,0.4);'
      : 'width:28px;height:28px;background:linear-gradient(135deg,#4f46e5,#818cf8);border:3px solid white;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 2px 8px rgba(79,70,229,0.4);';

    if (showCircle) {
      const radiusEl = document.createElement('div');
      radiusEl.style.cssText = 'position:absolute;width:80px;height:80px;background:rgba(79,70,229,0.06);border:2px solid #4f46e5;border-radius:50%;animation:pulse 2s infinite;top:50%;left:50%;transform:translate(-50%,-50%);pointer-events:none;';
      const wrapper = document.createElement('div');
      wrapper.style.cssText = 'position:relative;display:flex;align-items:center;justify-content:center;width:80px;height:80px;';
      wrapper.appendChild(radiusEl);
      wrapper.appendChild(markerEl);
      new maplibregl.Marker({ element: wrapper })
        .setLngLat([Number(lng), Number(lat)])
        .addTo(map);
    } else {
      new maplibregl.Marker({ element: markerEl, anchor: 'bottom' })
        .setLngLat([Number(lng), Number(lat)])
        .addTo(map);
    }

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [lat, lng, zoom, showCircle]);

  if (!lat || !lng) return null;

  return (
    <div className={`rounded-2xl overflow-hidden border border-surface-200 ${className}`}>
      <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
    </div>
  );
};

export default MapView;
