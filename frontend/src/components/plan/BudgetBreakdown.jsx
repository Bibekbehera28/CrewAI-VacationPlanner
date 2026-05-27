import { motion } from 'framer-motion';
import { getTotalBudget, getBudgetBreakdown } from '../../utils/planHelpers';

export default function BudgetBreakdown({ plan }) {
  const sym = plan?.currency_symbol || '$';
  const total = getTotalBudget(plan);
  const { hotels, activities } = getBudgetBreakdown(plan);
  const sum = hotels + activities || 1;

  const segments = [
    { label: 'Hotels', amount: hotels, color: 'bg-primary', width: (hotels / sum) * 100 },
    {
      label: 'Activities & food',
      amount: activities,
      color: 'bg-amber-400',
      width: (activities / sum) * 100,
    },
  ].filter((s) => s.amount > 0);

  return (
    <section className="mb-8">
      <h3 className="mb-4 text-lg font-semibold text-slate-900">Budget breakdown</h3>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="rounded-2xl border border-border bg-card p-6"
      >
        <p className="text-3xl font-bold text-primary">
          {sym}
          {Number(total).toLocaleString()}
        </p>
        <p className="text-sm text-slate-500">
          Total trip budget ({plan?.currency_name || ''})
        </p>

        {segments.length > 0 && (
          <div className="mt-6 flex h-4 overflow-hidden rounded-full">
            {segments.map((s) => (
              <div
                key={s.label}
                className={`${s.color} transition-all`}
                style={{ width: `${s.width}%` }}
                title={`${s.label}: ${sym}${s.amount}`}
              />
            ))}
          </div>
        )}

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {segments.map((s) => (
            <div key={s.label} className="rounded-2xl border border-border bg-white p-4">
              <div className={`mb-2 h-1 w-8 rounded ${s.color}`} />
              <p className="text-xs text-slate-500">{s.label}</p>
              <p className="text-lg font-semibold text-slate-900">
                {sym}
                {s.amount.toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
