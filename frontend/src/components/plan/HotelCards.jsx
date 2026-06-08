import { motion } from 'framer-motion';
import { getCurrencyCode, getHotelPricePerNight, getHotelTotalStay } from '../../utils/planHelpers';

export default function HotelCards({ hotels = [], plan }) {
  const sym = plan?.currency_symbol || '$';
  const code = getCurrencyCode(plan);

  if (!hotels?.length) return null;

  return (
    <section className="mb-8">
      <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-[#e2e8f0]">Hotels</h3>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {hotels.map((hotel, i) => (
          <motion.article
            key={hotel.name || i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-2xl border border-border bg-card p-4 transition-all dark:border-[#292929] dark:bg-[#171717] dark:hover:border-[#313131] dark:hover:shadow-[0_12px_30px_rgba(0,0,0,0.22)]"
          >
            <span className="inline-flex rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-white dark:bg-[#006239] dark:text-[#e2e8f0]">
              #{hotel.rank || i + 1}
            </span>
            <h4 className="mt-2 font-semibold text-slate-900 dark:text-[#e2e8f0]">{hotel.name}</h4>
            <p className="text-sm text-slate-500 dark:text-[#a2a2a2]">
              {hotel.city}
              {hotel.country ? `, ${hotel.country}` : ''}
            </p>
            {hotel.address && (
              <p className="mt-1 text-xs text-slate-400 dark:text-[#a2a2a2]">{hotel.address}</p>
            )}
            <p className="mt-2 text-sm font-medium text-primary dark:text-[#4ade80]">
              {sym}
              {getHotelPricePerNight(hotel, code).toLocaleString()} / night
            </p>
            <p className="text-xs text-slate-500 dark:text-[#a2a2a2]">
              Total stay: {sym}
              {getHotelTotalStay(hotel, code).toLocaleString()}
            </p>
            {hotel.budget_fit && (
              <p className="mt-1 text-xs text-teal-700 dark:text-[#4ade80]">{hotel.budget_fit}</p>
            )}
            <div className="mt-3 flex flex-wrap gap-1">
              {(hotel.facilities || []).map((f) => (
                <span
                  key={f}
                  className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary dark:bg-[#006239]/25 dark:text-[#4ade80]"
                >
                  {f}
                </span>
              ))}
            </div>
            {hotel.suitability && (
              <p className="mt-3 text-xs text-slate-600 dark:text-[#a2a2a2]">{hotel.suitability}</p>
            )}
          </motion.article>
        ))}
      </div>
    </section>
  );
}
