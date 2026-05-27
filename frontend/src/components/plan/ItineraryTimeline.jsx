import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function DayBlock({ day, sym }) {
  const [open, setOpen] = useState(day.day === 1);
  const activities = day.activities || [];

  return (
    <div className="border-b border-border last:border-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-4 py-4 text-left"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
          {day.day}
        </span>
        <span className="flex-1 font-medium text-slate-800">{day.title || `Day ${day.day}`}</span>
        <svg
          className={`h-5 w-5 text-slate-400 transition ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <AnimatePresence>
        {open && (
          <motion.ul
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden pb-4 pl-14"
          >
            {activities.map((act, i) => {
              const label = typeof act === 'string' ? act : act.activity;
              const cost = typeof act === 'object' && act.cost != null ? act.cost : null;
              return (
                <li
                  key={i}
                  className="flex items-start justify-between gap-2 py-1.5 text-sm text-slate-600"
                >
                  <span>{label}</span>
                  {cost != null && Number(cost) > 0 && (
                    <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
                      {sym}
                      {Number(cost).toLocaleString()}
                    </span>
                  )}
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ItineraryTimeline({ dayByDay = [], plan }) {
  const sym = plan?.currency_symbol || '$';
  if (!dayByDay?.length) return null;

  return (
    <section className="mb-8">
      <h3 className="mb-4 text-lg font-semibold text-slate-900">Itinerary</h3>
      <div className="rounded-2xl border border-border bg-white px-4">
        {dayByDay.map((day) => (
          <DayBlock key={day.day} day={day} sym={sym} />
        ))}
      </div>
    </section>
  );
}
