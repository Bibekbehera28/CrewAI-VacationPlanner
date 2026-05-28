import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { fetchTrips } from '../../services/api';

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

function badgeColor(category) {
  const c = (category || '').toLowerCase();
  if (c.includes('beach')) return 'bg-teal-50 text-teal-700 border-teal-200';
  if (c.includes('mount')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (c.includes('city')) return 'bg-sky-50 text-sky-700 border-sky-200';
  if (c.includes('advent')) return 'bg-amber-50 text-amber-800 border-amber-200';
  return 'bg-slate-50 text-slate-700 border-border';
}

function normalizeTripRow(row) {
  const state = row?.extracted_state || {};
  const plan = row?.final_plan || row?.full_plan || {};
  return {
    id: row?.id || row?.uuid || row?.created_at || crypto.randomUUID?.(),
    planned_at: row?.created_at || row?.planned_at || null,
    destination: row?.destination || plan?.destination || state?.destination_preference || 'Trip',
    country: row?.country || plan?.country || state?.destination_country || '',
    category: row?.category || state?.category || plan?.category || '',
    budget: row?.budget ?? state?.budget ?? null,
    currency_symbol: row?.currency_symbol || state?.currency_symbol || plan?.currency_symbol || '$',
    duration_days: row?.duration_days ?? state?.trip_duration_days ?? plan?.duration_days ?? null,
    state,
    plan,
  };
}

export default function TripsPage({ onPlanAnotherTrip, onLoadTrip }) {
  const [query, setQuery] = useState('');
  const [remoteTrips, setRemoteTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchTrips();
        const normalized = (data?.trips || []).map(normalizeTripRow);
        if (mounted) setRemoteTrips(normalized);
      } catch (e) {
        if (mounted) setError(e?.message || 'Failed to load trips');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return remoteTrips;
    return remoteTrips.filter((t) => (t.destination || '').toLowerCase().includes(q));
  }, [remoteTrips, query]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="mx-auto flex h-full min-h-0 w-full max-w-5xl flex-col overflow-hidden px-4 py-6 md:px-8"
    >
      <div className="sticky top-0 z-20 flex shrink-0 flex-wrap items-start justify-between gap-4 border-b border-[#eef2f5] bg-white pb-4 pt-1">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">My Trips</h1>
          <div className="mt-3 flex items-center gap-2 rounded-2xl border border-border bg-white px-4 py-3 shadow-sm transition focus-within:border-primary">
            <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search trips by destination..."
              className="min-w-0 flex-1 bg-transparent text-sm outline-none"
            />
          </div>
        </div>
        <button
          type="button"
          onClick={onPlanAnotherTrip}
          className="rounded-2xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
        >
          Plan Another Trip
        </button>
      </div>

      <div className="mt-8 min-h-0 flex-1 overflow-y-auto pb-4">
        <AnimatePresence>
          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-sm text-slate-500">
              Loading trips…
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <div className="rounded-2xl border border-border bg-card p-4 text-sm text-slate-700">
            Couldn’t load trips from the server. {error ? <span className="text-slate-500">({error})</span> : null}
          </div>
        )}

        {!loading && !filtered?.length && (
          <div className="rounded-2xl border border-border bg-card p-6 text-sm text-slate-600">
            No trips found.
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((t) => (
            <motion.button
              key={t.id}
              type="button"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => onLoadTrip?.(t)}
              className="text-left rounded-2xl border border-border bg-white p-5 transition hover:border-primary/40 hover:shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-base font-semibold text-slate-900">
                    {t.destination}
                    {t.country ? `, ${t.country}` : ''}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">{formatDate(t.planned_at)}</p>
                </div>
                {t.category && (
                  <span className={`shrink-0 rounded-xl border px-2.5 py-1 text-xs font-medium ${badgeColor(t.category)}`}>
                    {t.category}
                  </span>
                )}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-card p-3">
                  <p className="text-xs text-slate-500">Budget</p>
                  <p className="mt-1 font-semibold text-slate-900">
                    {t.budget != null ? `${t.currency_symbol}${Number(t.budget).toLocaleString()}` : '—'}
                  </p>
                </div>
                <div className="rounded-xl bg-card p-3">
                  <p className="text-xs text-slate-500">Days</p>
                  <p className="mt-1 font-semibold text-slate-900">{t.duration_days ?? '—'}</p>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

