import { useEffect, useMemo, useState } from 'react';

export default function useGeolocation() {
  const supported = useMemo(() => typeof navigator !== 'undefined' && !!navigator.geolocation, []);
  const [city, setCity] = useState(null);
  const [loading, setLoading] = useState(() => supported);
  const [error, setError] = useState(() => (supported ? null : 'Geolocation not supported'));

  useEffect(() => {
    if (!supported) return;

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
            { headers: { 'Accept-Language': 'en' } }
          );
          const data = await res.json();
          const addr = data.address || {};
          const resolved =
            addr.city || addr.town || addr.village || addr.state || null;
          setCity(resolved);
        } catch (e) {
          setError(e.message);
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
      { timeout: 10000, maximumAge: 300000 }
    );
  }, [supported]);

  return { city, loading, error };
}
