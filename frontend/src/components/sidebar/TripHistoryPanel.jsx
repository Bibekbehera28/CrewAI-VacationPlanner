import { motion } from 'framer-motion';

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

export default function TripHistoryPanel({ trips, onSelectTrip, onStartPlanning }) {
  if (!trips?.length) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mx-1 mt-4 rounded-2xl border border-border bg-card p-5"
      >
        <h3 className="font-semibold text-slate-900">All your chats in one place</h3>
        <p className="mt-2 text-sm text-slate-500">
          Saved trip plans appear here so you can revisit destinations and budgets anytime.
        </p>
        <button
          type="button"
          onClick={onStartPlanning}
          className="mt-4 w-full rounded-2xl bg-primary py-2.5 text-sm font-medium text-white hover:bg-primary-light"
        >
          Start planning
        </button>
      </motion.div>
    );
  }

  return (
    <ul className="mt-3 space-y-1 overflow-y-auto px-1">
      {trips.map((trip) => (
        <motion.li key={trip.id} whileHover={{ x: 2 }}>
          <button
            type="button"
            onClick={() => onSelectTrip?.(trip)}
            className="w-full rounded-2xl px-3 py-3 text-left transition hover:bg-card"
          >
            <p className="text-sm font-medium text-slate-800">
              {trip.destination}
              {trip.country ? `, ${trip.country}` : ''}
            </p>
            <p className="text-xs text-slate-400">{formatDate(trip.savedAt)}</p>
          </button>
        </motion.li>
      ))}
    </ul>
  );
}
