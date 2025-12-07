import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix pour les icônes Leaflet avec Vite
// @ts-expect-error Leaflet internal property
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapMarker {
  id: number;
  position: [number, number];
  name: string;
  info?: string;
}

interface Props {
  center?: [number, number];
  zoom?: number;
  markers?: MapMarker[];
  height?: number;
}

export function CountryMap({
  center = [48.8566, 2.3522], // Paris par défaut
  zoom = 6,
  markers = [],
  height = 400,
}: Props) {
  return (
    <div style={{ height: `${height}px`, width: '100%' }}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%', borderRadius: '8px' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {markers.map((marker) => (
          <Marker key={marker.id} position={marker.position}>
            <Popup>
              <strong>{marker.name}</strong>
              {marker.info && <p className="mt-1 text-sm">{marker.info}</p>}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}