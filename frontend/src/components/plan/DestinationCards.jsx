import { motion } from 'framer-motion';
import {
  getCurrencyCode,
  getDestBudgetPerPerson,
  getDestHotelPerNight,
} from '../../utils/planHelpers';

export default function DestinationCards({
  destinations = [],
  currencySymbol = '$',
  currencyCode = 'usd',
  selectedName = null,
  onSelect,
  disabled = false,
  title = 'Choose your destination',
  subtitle,
}) {
  if (!destinations.length) return null;

  const sym = currencySymbol;

  return (
    <div className="no-print mb-6">
      <h3 className="mb-1 text-lg font-semibold text-slate-900">{title}</h3>
      {subtitle && <p className="mb-3 text-sm text-slate-500">{subtitle}</p>}
      <div className="flex gap-4 overflow-x-auto pb-2">
        {destinations.map((dest) => {
          const name = dest.name;
          const selected = selectedName === name;
          const budgetPerPerson = getDestBudgetPerPerson(dest, currencyCode);
          const hotelPerNight = getDestHotelPerNight(dest, currencyCode);

          return (
            <motion.div
              key={`${name}-${dest.rank}`}
              whileHover={{ y: -2 }}
              className={`min-w-[280px] shrink-0 rounded-2xl border bg-card p-4 ${
                selected ? 'border-primary ring-2 ring-primary/20' : 'border-border'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-xs font-medium text-slate-400">#{dest.rank}</span>
                  <h4 className="font-semibold text-slate-900">{name}</h4>
                  <p className="text-xs text-slate-500">{dest.country}</p>
                </div>
                {dest.climate_now && (
                  <span className="shrink-0 rounded-full bg-teal-100 px-2 py-0.5 text-xs text-teal-700">
                    {dest.climate_now}
                  </span>
                )}
              </div>

              {dest.best_for && (
                <span className="mt-2 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                  {dest.best_for}
                </span>
              )}

              {dest.season_match && (
                <p className="mt-2 text-xs text-slate-500">{dest.season_match}</p>
              )}

              {dest.reason && (
                <p className="mt-2 line-clamp-3 text-xs text-slate-600">{dest.reason}</p>
              )}

              <div className="mt-3 space-y-1 text-xs text-slate-600">
                <p>
                  Est. budget: {sym}
                  {budgetPerPerson.toLocaleString()}/person
                </p>
                <p>
                  Est. hotel: {sym}
                  {hotelPerNight.toLocaleString()}/night
                </p>
              </div>

              <button
                type="button"
                disabled={disabled || selected}
                onClick={() => onSelect?.(name, dest.country)}
                className="mt-4 w-full rounded-2xl bg-primary py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
              >
                {selected ? 'Selected' : 'Plan this trip'}
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
