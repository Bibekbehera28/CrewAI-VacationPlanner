import { motion } from 'framer-motion';
import { getCurrencyCode, fieldForCurrency } from '../../utils/planHelpers';

/** Flights are not in the current backend plan; render only if present */
export default function FlightCards({ flights, plan }) {
  if (!flights?.length) return null;

  const sym = plan?.currency_symbol || '$';
  const code = getCurrencyCode(plan);

  return (
    <section className="mb-8">
      <h3 className="mb-4 text-lg font-semibold text-slate-900">Flights</h3>
      <div className="grid gap-4 md:grid-cols-2">
        {flights.map((flight, i) => {
          const stops = flight.stops ?? 0;
          return (
            <motion.article
              key={flight.option || i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-border bg-card p-5"
            >
              <p className="font-semibold text-slate-900">{flight.airline}</p>
              <div className="mt-3 flex items-center gap-2 text-sm text-slate-700">
                <span>{flight.departure_airport || flight.departure_city}</span>
                <span>→</span>
                <span>{flight.arrival_airport}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    stops === 0 ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {stops === 0 ? 'Non-stop' : `${stops} stop${stops > 1 ? 's' : ''}`}
                </span>
              </div>
              <p className="mt-3 text-sm">
                {sym}
                {fieldForCurrency(flight, 'estimated_cost_per_person', code).toLocaleString()} / person
              </p>
            </motion.article>
          );
        })}
      </div>
    </section>
  );
}
