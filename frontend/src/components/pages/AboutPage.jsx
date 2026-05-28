import { motion } from 'framer-motion';

function Step({ icon, title, text }) {
  return (
    <div className="rounded-2xl border border-border bg-white p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          {icon}
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">{title}</p>
          <p className="mt-1 text-sm text-slate-600">{text}</p>
        </div>
      </div>
    </div>
  );
}

export default function AboutPage({ onStartPlanning }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="mx-auto h-full w-full max-w-3xl overflow-y-auto px-4 py-8 md:px-8"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 md:text-4xl">VoyageAI</h1>
          <p className="mt-2 text-slate-600">AI-powered vacation planning for everyone</p>
        </div>
        <button
          type="button"
          onClick={onStartPlanning}
          className="rounded-2xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
        >
          Start Planning
        </button>
      </div>

      <div className="mt-10 space-y-10">
        <section>
          <h2 className="text-lg font-semibold text-slate-900">What is VoyageAI</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            VoyageAI is an intelligent multi-agent AI system that plans complete vacations from a
            single natural language query—helping you go from an idea to a detailed itinerary,
            hotels, and budget breakdown.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">How it works</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Step
              icon={<span className="text-lg">🗺️</span>}
              title="1. Tell us your trip idea"
              text="Share your budget, vibe, and duration in one message."
            />
            <Step
              icon={<span className="text-lg">🤖</span>}
              title="2. AI agents find destinations"
              text="We generate best-fit destinations based on your preferences."
            />
            <Step
              icon={<span className="text-lg">✅</span>}
              title="3. Pick your favorite"
              text="Choose a destination to generate a complete plan."
            />
            <Step
              icon={<span className="text-lg">🏨</span>}
              title="4. Get a complete plan"
              text="Hotels, itinerary, map, and budget—ready to export."
            />
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">Tech stack</h2>
          <div className="mt-3 rounded-2xl border border-border bg-white p-5">
            <ul className="grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
              <li>React + Vite frontend</li>
              <li>FastAPI + CrewAI backend</li>
              <li>OpenRouter LLM (free models)</li>
              <li>OpenWeatherMap for weather data</li>
              <li>Geoapify for real hotel data</li>
              <li>Leaflet + OpenStreetMap for maps</li>
              <li>Supabase for data storage</li>
            </ul>
          </div>
        </section>
      </div>
    </motion.div>
  );
}

