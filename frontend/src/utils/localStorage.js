const TRIPS_KEY = 'voyageai_trips';
const SESSION_KEY = 'voyageai_session_id';

export function getSessionId() {
  return localStorage.getItem(SESSION_KEY);
}

export function saveSessionId(id) {
  localStorage.setItem(SESSION_KEY, id);
}

export function clearSessionStorage() {
  localStorage.removeItem(SESSION_KEY);
}

export function getTrips() {
  try {
    const raw = localStorage.getItem(TRIPS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveTrip(plan, state, destinations = []) {
  const trips = getTrips();
  const entry = {
    id: crypto.randomUUID?.() || `${Date.now()}`,
    destination: plan?.destination || 'Trip',
    country: plan?.country || '',
    savedAt: new Date().toISOString(),
    plan,
    state,
    destinations,
  };
  trips.unshift(entry);
  localStorage.setItem(TRIPS_KEY, JSON.stringify(trips.slice(0, 50)));
  return entry;
}
