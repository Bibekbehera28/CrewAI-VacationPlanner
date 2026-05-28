import { motion } from 'framer-motion';

const CATEGORIES = ['Beach', 'Mountains', 'City', 'Adventure'];

export default function WelcomeHero({ onCategoryClick, disabled = false }) {
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
            onClick={() => onCategoryClick?.(cat)}
            className="rounded-2xl border border-border bg-card px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-primary hover:text-primary disabled:opacity-50"
          >
            {cat}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
