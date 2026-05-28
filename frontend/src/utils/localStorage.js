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
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function normalizeLegacyTrip(t) {
  if (!t) return null;
  if (t.session_id) return t;
  const planned_at = t.planned_at || t.savedAt || new Date().toISOString();
  return {
    session_id: t.session_id || t.id || crypto.randomUUID?.() || `${Date.now()}`,
    destination: t.destination || t.plan?.destination || 'Trip',
    country: t.country || t.plan?.country || '',
    category: t.category || t.state?.category || '',
    budget: t.budget ?? t.state?.budget ?? null,
    currency_symbol: t.currency_symbol || t.state?.currency_symbol || t.plan?.currency_symbol || '$',
    duration_days: t.duration_days ?? t.state?.trip_duration_days ?? null,
    planned_at,
    messages: t.messages || [],
    plan: t.plan || null,
    state: t.state || {},
    destinations: t.destinations || [],
  };
}

export function getRecentTrips() {
  return getTrips().map(normalizeLegacyTrip).filter(Boolean);
}

export function saveCompletedTrip({
  session_id,
  destination,
  country,
  category,
  budget,
  currency_symbol,
  duration_days,
  planned_at,
  messages,
  plan,
  state,
  destinations = [],
}) {
  const trips = getRecentTrips();
  const entry = {
    session_id,
    destination,
    country,
    category,
    budget,
    currency_symbol,
    duration_days,
    planned_at,
    messages: Array.isArray(messages) ? messages : [],
    plan,
    state: state || {},
    destinations,
  };

  const withoutDupes = trips.filter((t) => t.session_id !== session_id);
  withoutDupes.unshift(entry);
  localStorage.setItem(TRIPS_KEY, JSON.stringify(withoutDupes.slice(0, 50)));
  return entry;
}

export function removeRecentTrip(sessionId) {
  if (!sessionId) return getRecentTrips();
  const next = getRecentTrips().filter((trip) => trip.session_id !== sessionId);
  localStorage.setItem(TRIPS_KEY, JSON.stringify(next));
  return next;
}
