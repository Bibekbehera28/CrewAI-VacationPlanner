import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import MapView from './MapView';
import HotelCards from './HotelCards';
import FlightCards from './FlightCards';
import ItineraryTimeline from './ItineraryTimeline';
import BudgetBreakdown from './BudgetBreakdown';
import TravelTips from './TravelTips';
import DestinationCards from './DestinationCards';
import { buildPlanSummary, getCurrencyCode } from '../../utils/planHelpers';

export default function PlanDisplay({
  plan,
  destinations = [],
  onSwitchDestination,
  onPlanAnother,
  switching = false,
}) {
  if (!plan) return null;

  const code = getCurrencyCode(plan);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(buildPlanSummary(plan));
      toast.success('Summary copied to clipboard');
    } catch {
      toast.error('Could not copy summary');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="print-area w-full max-w-4xl"
    >
      {destinations.length > 0 && (
        <DestinationCards
          destinations={destinations}
          currencySymbol={plan.currency_symbol}
          currencyCode={code}
          selectedName={plan.destination}
          onSelect={onSwitchDestination}
          disabled={switching}
          title="Switch destination"
          subtitle="Pick another option to regenerate your plan"
        />
      )}

      <div className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-[#1A3C34] to-teal-600 p-6 text-white">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold">{plan.destination}</h2>
            <p className="text-white/90">{plan.country}</p>
          </div>
          {plan.season && (
            <span className="rounded-2xl bg-white/20 px-3 py-1 text-sm">{plan.season}</span>
          )}
        </div>
        <div className="mt-4 flex flex-wrap gap-4 text-sm text-white/90">
          <span>From {plan.departure_city}</span>
          {plan.weather_summary && <span>· {plan.weather_summary}</span>}
        </div>
      </div>

      <div className="mb-8">
        <h3 className="mb-3 text-lg font-semibold text-slate-900">Map</h3>
        <MapView destination={plan.destination} hotels={plan.hotels} plan={plan} />
      </div>

      <HotelCards hotels={plan.hotels} plan={plan} />
      <FlightCards flights={plan.flights} plan={plan} />
      <ItineraryTimeline dayByDay={plan.day_by_day} plan={plan} />
      <BudgetBreakdown plan={plan} />
      <TravelTips tips={plan.travel_tips} />

      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        {plan.visa_info && (
          <div className="rounded-2xl border border-border bg-card p-4">
            <h4 className="font-semibold text-slate-900">Visa info</h4>
            <p className="mt-2 text-sm text-slate-600">{plan.visa_info}</p>
          </div>
        )}
        {plan.best_time_to_visit && (
          <div className="rounded-2xl border border-border bg-card p-4">
            <h4 className="font-semibold text-slate-900">Best time to visit</h4>
            <p className="mt-2 text-sm text-slate-600">{plan.best_time_to_visit}</p>
          </div>
        )}
      </div>

      <div className="no-print flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-2xl border border-border px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-card"
        >
          Export PDF
        </button>
        <button
          type="button"
          onClick={handleCopy}
          className="rounded-2xl border border-border px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-card"
        >
          Copy Summary
        </button>
        <button
          type="button"
          onClick={onPlanAnother}
          className="rounded-2xl bg-primary px-5 py-2.5 text-sm font-medium text-white hover:opacity-90"
        >
          Plan Another Trip
        </button>
      </div>
    </motion.div>
  );
}
