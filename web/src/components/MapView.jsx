// MapView — reusable MapLibre GL JS map using OpenFreeMap tiles
import Map, { Marker } from 'react-map-gl/maplibre';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

// OpenFreeMap style URL
const OPENFREEMAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty';

/**
 * MapView — reusable map component
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {string} title - Popup title
 * @param {boolean} showCircle - Show approximate radius circle (privacy)
 * @param {string} className - Additional CSS classes
 * @param {number} zoom - Map zoom level
 */
const MapView = ({
  lat,
  lng,
  title = 'Property Location',
  showCircle = true,
  className = 'h-72',
  zoom = 14,
}) => {
  if (!lat || !lng) return null;

  return (
    <div className={`rounded-2xl overflow-hidden border border-surface-200 ${className}`}>
      <Map
        initialViewState={{
          longitude: Number(lng),
          latitude: Number(lat),
          zoom: zoom,
        }}
        mapLib={maplibregl}
        mapStyle={OPENFREEMAP_STYLE}
        style={{ width: '100%', height: '100%' }}
        cooperativeGestures={true}
      >
        {showCircle ? (
          <Marker longitude={Number(lng)} latitude={Number(lat)} anchor="center">
            <div className="relative flex items-center justify-center">
              <div className="absolute w-20 h-20 bg-primary-500/10 border-2 border-primary-500 rounded-full animate-pulse" />
              <div className="w-5 h-5 bg-primary-600 border-2 border-white rounded-full shadow-md" />
            </div>
          </Marker>
        ) : (
          <Marker longitude={Number(lng)} latitude={Number(lat)} anchor="bottom">
            <div style={{
              background: 'linear-gradient(135deg, #4f46e5, #818cf8)',
              border: '3px solid white',
              borderRadius: '50% 50% 50% 0',
              transform: 'rotate(-45deg)',
              width: '28px', height: '28px',
              boxShadow: '0 2px 8px rgba(79,70,229,0.4)',
            }} title={title}></div>
          </Marker>
        )}
      </Map>
    </div>
  );
};

export default MapView;
