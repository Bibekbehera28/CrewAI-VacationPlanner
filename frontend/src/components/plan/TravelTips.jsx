import { motion } from 'framer-motion';

export default function TravelTips({ tips = [] }) {
  if (!tips?.length) return null;

  return (
    <section className="mb-8">
      <h3 className="mb-4 text-lg font-semibold text-slate-900">Travel tips</h3>
      <ul className="space-y-2">
        {tips.map((tip, i) => (
          <motion.li
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            className="flex gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-sm text-slate-700"
          >
            <span className="text-primary">✓</span>
            {tip}
          </motion.li>
        ))}
      </ul>
    </section>
  );
}
