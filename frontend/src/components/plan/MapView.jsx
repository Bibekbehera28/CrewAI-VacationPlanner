import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { motion } from 'framer-motion';
import { getCurrencyCode, getHotelPricePerNight } from '../../utils/planHelpers';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  iconShadow: markerShadow,
});

async function geocodeCity(cityName) {
  const q = encodeURIComponent(cityName);
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`,
    { headers: { 'Accept-Language': 'en' } }
  );
  const data = await res.json();
  if (!data?.length) return null;
  return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
}

export default function MapView({ destination, hotels = [], plan }) {
  const [center, setCenter] = useState(null);
  const sym = plan?.currency_symbol || '$';
  const code = getCurrencyCode(plan);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const coords = await geocodeCity(destination);
      if (!cancelled && coords) setCenter([coords.lat, coords.lon]);
    })();
    return () => {
      cancelled = true;
    };
  }, [destination]);

  const hotelMarkers = (hotels || []).filter((h) => h.lat != null && h.lon != null);

  if (!center) {
    return (
      <div className="flex h-[300px] items-center justify-center rounded-2xl border border-border bg-card text-sm text-slate-500">
        Loading map…
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-[300px] overflow-hidden rounded-2xl border border-border"
    >
      <MapContainer center={center} zoom={13} className="h-full w-full" scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {hotelMarkers.map((hotel, i) => (
          <Marker key={`${hotel.name}-${i}`} position={[hotel.lat, hotel.lon]}>
            <Popup>
              <strong>{hotel.name}</strong>
              <br />
              {hotel.address}
              <br />
              {sym}
              {getHotelPricePerNight(hotel, code).toLocaleString()} / night
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </motion.div>
  );
}
