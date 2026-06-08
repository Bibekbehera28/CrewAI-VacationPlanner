import { motion } from 'framer-motion';
import {
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
      <h3 className="mb-1 text-lg font-semibold text-slate-900 dark:text-[#e2e8f0]">{title}</h3>
      {subtitle && <p className="mb-3 text-sm text-slate-500 dark:text-[#a2a2a2]">{subtitle}</p>}
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
              className={`min-w-[280px] shrink-0 rounded-2xl border bg-card p-4 transition-all dark:bg-[#171717] dark:shadow-[0_10px_28px_rgba(0,0,0,0.2)] dark:hover:shadow-[0_14px_34px_rgba(0,0,0,0.28)] ${
                selected ? 'border-primary ring-2 ring-primary/20 dark:border-[#4ade80] dark:ring-[#4ade80]/15' : 'border-border dark:border-[#292929] dark:hover:border-[#313131]'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-xs font-medium text-slate-400 dark:text-[#a2a2a2]">#{dest.rank}</span>
                  <h4 className="font-semibold text-slate-900 dark:text-[#e2e8f0]">{name}</h4>
                  <p className="text-xs text-slate-500 dark:text-[#a2a2a2]">{dest.country}</p>
                </div>
                {dest.climate_now && (
                  <span className="shrink-0 rounded-full bg-teal-100 px-2 py-0.5 text-xs text-teal-700 dark:bg-[#006239]/25 dark:text-[#4ade80]">
                    {dest.climate_now}
                  </span>
                )}
              </div>

              {dest.best_for && (
                <span className="mt-2 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary dark:bg-[#006239]/25 dark:text-[#4ade80]">
                  {dest.best_for}
                </span>
              )}

              {dest.season_match && (
                <p className="mt-2 text-xs text-slate-500 dark:text-[#a2a2a2]">{dest.season_match}</p>
              )}

              {dest.reason && (
                <p className="mt-2 line-clamp-3 text-xs text-slate-600 dark:text-[#a2a2a2]">{dest.reason}</p>
              )}

              <div className="mt-3 space-y-1 text-xs text-slate-600 dark:text-[#a2a2a2]">
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
                className="mt-4 w-full rounded-2xl bg-primary py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 dark:bg-[#006239] dark:text-[#e2e8f0] dark:hover:bg-[#007a46]"
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
