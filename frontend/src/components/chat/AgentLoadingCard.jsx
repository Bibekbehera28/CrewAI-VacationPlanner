import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const STEP_SETS = {
  destinations: [
    'Analyzing your preferences',
    'Finding best destinations',
    'Estimating costs for each option',
  ],
  planning: [
    'Searching hotels',
    'Building day-by-day itinerary',
    'Finalizing your vacation plan',
  ],
};

export default function AgentLoadingCard({ mode = 'planning' }) {
  const steps = STEP_SETS[mode] || STEP_SETS.planning;
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    setActiveStep(0);
    const interval = setInterval(() => {
      setActiveStep((s) => (s < steps.length - 1 ? s + 1 : s));
    }, 4000);
    return () => clearInterval(interval);
  }, [mode, steps.length]);

  const title =
    mode === 'destinations' ? 'Finding destinations for you...' : 'Building your trip plan...';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border bg-card p-4 shadow-sm"
    >
      <p className="mb-3 text-sm font-semibold text-primary">{title}</p>
      <ul className="space-y-3">
        {steps.map((label, i) => {
          const done = i < activeStep;
          const active = i === activeStep;
          return (
            <motion.li
              key={label}
              animate={{ opacity: done || active ? 1 : 0.45 }}
              className="flex items-center gap-3"
            >
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition ${
                  done
                    ? 'bg-primary text-white'
                    : active
                      ? 'bg-primary/15 text-primary ring-2 ring-primary'
                      : 'bg-slate-100 text-slate-400'
                }`}
              >
                {done ? (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  i + 1
                )}
              </span>
              <span className={`text-sm ${active ? 'font-medium text-primary' : 'text-slate-600'}`}>
                {label}
              </span>
            </motion.li>
          );
        })}
      </ul>
    </motion.div>
  );
}
