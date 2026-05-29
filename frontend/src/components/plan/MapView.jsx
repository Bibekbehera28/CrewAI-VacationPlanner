import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
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

// Custom icons for different marker types
const createCustomIcon = (type) => {
  const colors = {
    destination: '#1A3C34',
    flight: '#3b82f6',
    hotel: '#0d9488',
  };

  const iconHtml = `
    <div style="
      background-color: ${colors[type]};
      border: 3px solid white;
      border-radius: 50%;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      color: white;
      font-size: 16px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    ">
      ${
        type === 'flight'
          ? '✈'
          : type === 'hotel'
            ? '🏨'
            : '📍'
      }
    </div>
  `;

  return L.divIcon({
    html: iconHtml,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
    className: 'custom-marker',
  });
};

function MapResizer() {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 300);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
}

function MapBounds({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.isValid && bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
    }
  }, [bounds, map]);
  return null;
}

async function geocodeCity(cityName) {
  if (!cityName || typeof cityName !== 'string') return null;
  try {
    const q = encodeURIComponent(cityName);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`,
      { headers: { 'Accept-Language': 'en' } }
    );
    const data = await res.json();
    if (!data?.length) return null;
    return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
  } catch (err) {
    console.error('Geocoding error:', err);
    return null;
  }
}

export default function MapView({ destination, hotels = [], plan }) {
  const [markers, setMarkers] = useState({
    destination: null,
    flight: null,
    hotels: [],
  });
  const [bounds, setBounds] = useState(null);
  const sym = plan?.currency_symbol || '$';
  const code = getCurrencyCode(plan);

  useEffect(() => {
    // Reset markers when destination changes
    setMarkers({
      destination: null,
      flight: null,
      hotels: [],
    });
    setBounds(null);

    let cancelled = false;

    (async () => {
      try {
        // Geocode destination
        const destCoords = await geocodeCity(destination);
        if (cancelled) return;

        // Geocode flight arrival city if available
        let flightCoords = null;
        if (plan?.flights?.[0]?.arrival_city) {
          flightCoords = await geocodeCity(plan.flights[0].arrival_city);
        }
        if (cancelled) return;

        // Geocode hotels
        const hotelList = [];
        for (const hotel of hotels || []) {
          if (hotel.lat != null && hotel.lon != null) {
            hotelList.push({
              ...hotel,
              lat: Number(hotel.lat),
              lon: Number(hotel.lon),
            });
          } else if (hotel.city) {
            const hotelCoords = await geocodeCity(hotel.city);
            if (hotelCoords) {
              hotelList.push({
                ...hotel,
                lat: hotelCoords.lat,
                lon: hotelCoords.lon,
              });
            }
          }
        }
        if (cancelled) return;

        // Calculate bounds that includes all markers
        const allPoints = [];
        if (destCoords) allPoints.push([destCoords.lat, destCoords.lon]);
        if (flightCoords) allPoints.push([flightCoords.lat, flightCoords.lon]);
        hotelList.forEach((h) => allPoints.push([h.lat, h.lon]));

        if (allPoints.length > 0) {
          const newBounds = L.latLngBounds(allPoints);
          setMarkers({
            destination: destCoords ? [destCoords.lat, destCoords.lon] : null,
            flight: flightCoords ? [flightCoords.lat, flightCoords.lon] : null,
            hotels: hotelList,
          });
          setBounds(newBounds);
        } else if (destCoords) {
          // Fallback if only destination has coordinates
          setMarkers({
            destination: [destCoords.lat, destCoords.lon],
            flight: null,
            hotels: [],
          });
          setBounds(L.latLngBounds([[destCoords.lat, destCoords.lon]]));
        }
      } catch (err) {
        console.error('Map initialization error:', err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [destination, hotels, plan?.flights]);

  // Create a unique key for the map
  const firstHotelName = markers.hotels[0]?.name || '';
  const mapKey = `map-${destination}-${firstHotelName}-${markers.flight ? 'flight' : 'no-flight'}`;

  // Show loading state if no markers are ready
  if (!markers.destination && !markers.flight && markers.hotels.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center rounded-2xl border border-border bg-card text-sm text-slate-500">
        Loading map…
      </div>
    );
  }

  // Fallback center if bounds couldn't be calculated
  const fallbackCenter = markers.destination || (markers.flight ? [20, 78] : [20, 78]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-[300px] w-full overflow-hidden rounded-2xl border border-border"
      style={{ height: '300px' }}
    >
      <MapContainer
        key={mapKey}
        center={fallbackCenter}
        zoom={9}
        className="h-full w-full"
        scrollWheelZoom={false}
        style={{ height: '300px', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapResizer />
        {bounds && <MapBounds bounds={bounds} />}

        {/* Destination Marker */}
        {markers.destination && (
          <Marker position={markers.destination} icon={createCustomIcon('destination')}>
            <Popup>
              <strong>📍 Destination</strong>
              <br />
              {destination}
            </Popup>
          </Marker>
        )}

        {/* Flight Arrival Marker */}
        {markers.flight && (
          <Marker position={markers.flight} icon={createCustomIcon('flight')}>
            <Popup>
              <strong>✈ Flight Arrival</strong>
              <br />
              {plan?.flights?.[0]?.arrival_city || 'Arrival City'}
              <br />
              {plan?.flights?.[0]?.airline && (
                <>
                  Airline: {plan.flights[0].airline}
                  <br />
                </>
              )}
            </Popup>
          </Marker>
        )}

        {/* Hotel Markers */}
        {markers.hotels.map((hotel, i) => (
          <Marker key={`hotel-${hotel.name}-${i}`} position={[hotel.lat, hotel.lon]} icon={createCustomIcon('hotel')}>
            <Popup>
              <strong>🏨 {hotel.name}</strong>
              <br />
              {hotel.address && (
                <>
                  {hotel.address}
                  <br />
                </>
              )}
              <strong>
                {sym}
                {getHotelPricePerNight(hotel, code).toLocaleString()} / night
              </strong>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </motion.div>
  );
}
