import { motion } from 'framer-motion';

const CATEGORIES = ['Beach', 'Mountains', 'City', 'Adventure'];

export default function WelcomeHero({ onSearch, onCategoryClick, disabled = false }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-1 flex-col items-center justify-center px-4 py-10 text-center"
    >
      <h1 className="text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">
        Where to?
      </h1>
      <p className="mt-3 max-w-md text-slate-500">
        Tell us your dream trip and our AI will find destinations, hotels, and flights
        tailored to your budget.
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-2">
        {CATEGORIES.map((cat) => (
          <motion.button
            key={cat}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            disabled={disabled}
            onClick={() => onCategoryClick?.(`I want a ${cat.toLowerCase()} vacation`)}
            className="rounded-2xl border border-border bg-card px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-primary hover:text-primary disabled:opacity-50"
          >
            {cat}
          </motion.button>
        ))}
      </div>

      <div className="relative mt-8 w-full max-w-xl">
        <svg className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Describe your ideal trip..."
          className="w-full rounded-2xl border border-border bg-white py-4 pl-12 pr-4 text-base shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          disabled={disabled}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !disabled && e.target.value.trim()) {
              onSearch?.(e.target.value.trim());
              e.target.value = '';
            }
          }}
        />
      </div>
    </motion.div>
  );
}
