import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { fetchTrips, deleteTrip } from '../../services/api';

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
  if (c.includes('beach')) return 'bg-teal-50 text-teal-700 border-teal-200 dark:border-[#006239]/40 dark:bg-[#006239]/25 dark:text-[#4ade80]';
  if (c.includes('mount')) return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:border-[#006239]/40 dark:bg-[#006239]/25 dark:text-[#4ade80]';
  if (c.includes('city')) return 'bg-sky-50 text-sky-700 border-sky-200 dark:border-[#292929] dark:bg-[#242424] dark:text-[#e2e8f0]';
  if (c.includes('advent')) return 'bg-amber-50 text-amber-800 border-amber-200 dark:border-[#292929] dark:bg-[#313131] dark:text-[#e2e8f0]';
  return 'bg-slate-50 text-slate-700 border-border dark:border-[#292929] dark:bg-[#242424] dark:text-[#a2a2a2]';
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

function ConfirmationDialog({ isOpen, title, message, onConfirm, onCancel, isLoading }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/70">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-sm rounded-2xl border border-border bg-white p-6 shadow-lg dark:border-[#292929] dark:bg-[#171717]"
      >
        <h2 className="text-lg font-semibold text-slate-900 dark:text-[#e2e8f0]">{title}</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-[#a2a2a2]">{message}</p>
        <div className="mt-6 flex gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-[#292929] dark:bg-[#242424] dark:text-[#e2e8f0] dark:hover:bg-[#313131]"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
          >
            {isLoading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function Toast({ message, type, isVisible }) {
  if (!isVisible) return null;

  const bgColor = type === 'success'
  ? 'bg-green-50 border-green-200 text-green-800 dark:bg-[#006239]/20 dark:border-[#006239]/40 dark:text-[#4ade80]'
  : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950/30 dark:border-red-900/50 dark:text-red-400';

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`fixed top-4 right-4 rounded-lg border px-4 py-3 text-sm font-medium ${bgColor} shadow-md`}
    >
      {message}
    </motion.div>
  );
}

export default function TripsPage({ onPlanAnotherTrip, onLoadTrip }) {
  const [query, setQuery] = useState('');
  const [remoteTrips, setRemoteTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, tripId: null, tripName: null });
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState({ isVisible: false, message: '', type: 'success' });

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

  const showToast = (message, type = 'success') => {
    setToast({ isVisible: true, message, type });
    setTimeout(() => setToast({ isVisible: false, message: '', type: 'success' }), 3000);
  };

  const handleDeleteClick = (e, trip) => {
    e.stopPropagation();
    setConfirmDialog({
      isOpen: true,
      tripId: trip.id,
      tripName: trip.destination,
    });
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      console.log('Attempting to delete trip:', confirmDialog.tripId);
      const response = await deleteTrip(confirmDialog.tripId);
      console.log('Delete response:', response);
      if (response.success) {
        setRemoteTrips(remoteTrips.filter((t) => t.id !== confirmDialog.tripId));
        showToast('Trip deleted successfully.', 'success');
      } else {
        showToast(response.error || 'Failed to delete trip. Please try again.', 'error');
      }
    } catch (e) {
      console.error('Delete error:', e);
      showToast('Failed to delete trip. Please try again.', 'error');
    } finally {
      setIsDeleting(false);
      setConfirmDialog({ isOpen: false, tripId: null, tripName: null });
    }
  };

  const handleCancelDelete = () => {
    setConfirmDialog({ isOpen: false, tripId: null, tripName: null });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="mx-auto flex h-full min-h-0 w-full max-w-5xl flex-col overflow-hidden px-4 py-6 md:px-8 dark:text-[#e2e8f0]"
    >
      <div className="sticky top-0 z-20 flex shrink-0 flex-wrap items-start justify-between gap-4 border-b border-[#eef2f5] bg-white pb-4 pt-1 dark:border-[#292929] dark:bg-[#121212]">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-[#e2e8f0] md:text-3xl">My Trips</h1>
          <div className="mt-3 flex items-center gap-2 rounded-2xl border border-border bg-white px-4 py-3 shadow-sm transition focus-within:border-primary dark:border-[#292929] dark:bg-[#242424] dark:focus-within:border-[#4ade80]">
            <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search trips by destination..."
              className="min-w-0 flex-1 bg-transparent text-sm outline-none dark:text-[#e2e8f0] dark:placeholder:text-[#a2a2a2]"
            />
          </div>
        </div>
        <button
          type="button"
          onClick={onPlanAnotherTrip}
          className="rounded-2xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 dark:bg-[#006239] dark:text-[#e2e8f0] dark:hover:bg-[#007a46]"
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
          <div className="rounded-2xl border border-border bg-card p-4 text-sm text-slate-700 dark:border-[#292929] dark:bg-[#171717] dark:text-[#a2a2a2]">
            Couldn't load trips from the server. {error ? <span className="text-slate-500">({error})</span> : null}
          </div>
        )}

        {!loading && !filtered?.length && (
          <div className="rounded-2xl border border-border bg-card p-6 text-sm text-slate-600 dark:border-[#292929] dark:bg-[#171717] dark:text-[#a2a2a2]">
            No trips found.
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((t) => (
            <motion.div
              key={t.id}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.99 }}
              className="rounded-2xl border border-border bg-white p-5 transition hover:border-primary/40 hover:shadow-sm dark:border-[#292929] dark:bg-[#171717] dark:hover:border-[#006239]/40"
            >
              <button
                type="button"
                onClick={() => onLoadTrip?.(t)}
                className="w-full text-left"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-slate-900 dark:text-[#e2e8f0]">
                      {t.destination}
                      {t.country ? `, ${t.country}` : ''}
                    </p>
                    <p className="mt-1 text-xs text-slate-400 dark:text-[#a2a2a2]">{formatDate(t.planned_at)}</p>
                  </div>
                  {t.category && (
                    <span className={`shrink-0 rounded-xl border px-2.5 py-1 text-xs font-medium ${badgeColor(t.category)}`}>
                      {t.category}
                    </span>
                  )}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl bg-card p-3 dark:bg-[#242424]">
                    <p className="text-xs text-slate-500 dark:text-[#a2a2a2]">Budget</p>
                    <p className="mt-1 font-semibold text-slate-900 dark:text-[#e2e8f0]">
                      {t.budget != null ? `${t.currency_symbol}${Number(t.budget).toLocaleString()}` : '—'}
                    </p>
                  </div>
                  <div className="rounded-xl bg-card p-3 dark:bg-[#242424]">
                    <p className="text-xs text-slate-500 dark:text-[#a2a2a2]">Days</p>
                    <p className="mt-1 font-semibold text-slate-900 dark:text-[#e2e8f0]">{t.duration_days ?? '—'}</p>
                  </div>
                </div>
              </button>

              <button
                onClick={(e) => handleDeleteClick(e, t)}
                className="mt-4 w-full rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-100 hover:border-red-300 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-950/50 dark:hover:border-red-800/60"
              >
                Delete Trip
              </button>
            </motion.div>
          ))}
        </div>
      </div>

      <ConfirmationDialog
        isOpen={confirmDialog.isOpen}
        title="Delete Trip"
        message={`Are you sure you want to delete "${confirmDialog.tripName}"? This action cannot be undone.`}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        isLoading={isDeleting}
      />

      <Toast isVisible={toast.isVisible} message={toast.message} type={toast.type} />
    </motion.div>
  );
}
