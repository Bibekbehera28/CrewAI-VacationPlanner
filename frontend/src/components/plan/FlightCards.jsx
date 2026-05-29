import { motion } from 'framer-motion';
import { getCurrencyCode, fieldForCurrency } from '../../utils/planHelpers';

/** Flight recommendation cards with modern SaaS design */
export default function FlightCards({ flights, plan }) {
  if (!flights?.length) {
    return (
      <section className="mb-8">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">Recommended Flights</h3>
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <p className="text-sm text-slate-500">No flight recommendations available</p>
        </div>
      </section>
    );
  }

  const sym = plan?.currency_symbol || '$';
  const code = getCurrencyCode(plan);

  return (
    <section className="mb-8">
      <h3 className="mb-4 text-lg font-semibold text-slate-900">Recommended Flights</h3>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
        {flights.map((flight, i) => {
          const stops = flight.stops ?? 0;
          const pricePerPerson = fieldForCurrency(flight, 'estimated_price_per_person', code) || 0;
          const totalPrice = fieldForCurrency(flight, 'total_price', code) || 0;

          return (
            <motion.article
              key={`flight-${i}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ y: -2 }}
              className="group rounded-2xl border border-border bg-card p-5 transition-all hover:border-primary/40 hover:shadow-md"
            >
              {/* Airline & Flight Type */}
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <p className="font-semibold text-slate-900">{flight.airline}</p>
                  {flight.flight_type && (
                    <p className="mt-1 text-xs text-slate-500">{flight.flight_type}</p>
                  )}
                </div>
                <svg
                  className="h-5 w-5 text-primary/60 transition-transform group-hover:translate-x-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              </div>

              {/* Route */}
              <div className="mb-4 flex items-center gap-3">
                <div className="flex-1">
                  <p className="text-xs text-slate-500">From</p>
                  <p className="font-semibold text-slate-900">{flight.departure_city}</p>
                </div>
                <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <div className="flex-1 text-right">
                  <p className="text-xs text-slate-500">To</p>
                  <p className="font-semibold text-slate-900">{flight.arrival_city}</p>
                </div>
              </div>

              {/* Duration & Stops */}
              <div className="mb-4 grid grid-cols-2 gap-3">
                {flight.duration && (
                  <div className="flex items-center gap-2 rounded-lg bg-white px-3 py-2">
                    <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="text-xs font-medium text-slate-700">{flight.duration}</span>
                  </div>
                )}
                <div
                  className={`flex items-center justify-center rounded-lg px-3 py-2 text-xs font-medium ${
                    stops === 0
                      ? 'bg-green-50 text-green-700'
                      : stops === 1
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-orange-50 text-orange-700'
                  }`}
                >
                  {stops === 0 ? '✈ Non-stop' : `${stops} stop${stops > 1 ? 's' : ''}`}
                </div>
              </div>

              {/* Pricing */}
              <div className="space-y-2 border-t border-border pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Per Person</span>
                  <p className="font-semibold text-slate-900">
                    {sym}
                    {pricePerPerson.toLocaleString()}
                  </p>
                </div>
                {totalPrice > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Total Price</span>
                    <p className="font-bold text-primary">
                      {sym}
                      {totalPrice.toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </motion.article>
          );
        })}
      </div>
    </section>
  );
}
