import { motion } from "framer-motion";

function Step({ icon, title, text }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg dark:border-[#292929] dark:bg-[#171717]">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-xl">
          {icon}
        </div>

        <div>
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">
            {title}
          </h3>
          <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            {text}
          </p>
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
      className="mx-auto h-full w-full max-w-5xl overflow-y-auto px-4 py-8 md:px-8"
    >
      {/* Hero */}
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-[#292929] dark:bg-[#171717]">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-3 inline-flex rounded-full border border-green-500/20 bg-green-500/10 px-4 py-1 text-sm font-medium text-green-600 dark:text-green-400">
              ✈️ AI-Powered Travel Planning
            </div>

            <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100 md:text-5xl">
              VoyageAI
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-600 dark:text-slate-400">
              Plan complete vacations in seconds using intelligent AI agents.
              Discover destinations, find hotels, generate itineraries, budgets,
              maps, and travel-ready plans from a single prompt.
            </p>
          </div>

          <button
            type="button"
            onClick={onStartPlanning}
            className="rounded-2xl bg-primary px-6 py-3 font-semibold text-white transition-all hover:scale-105"
          >
            Start Planning →
          </button>
        </div>
      </div>

      {/* Features */}
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-[#292929] dark:bg-[#171717]">
          <div className="text-3xl">⚡</div>
          <h3 className="mt-3 font-semibold text-slate-900 dark:text-slate-100">
            Instant Planning
          </h3>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Generate complete travel plans in seconds.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-[#292929] dark:bg-[#171717]">
          <div className="text-3xl">🧠</div>
          <h3 className="mt-3 font-semibold text-slate-900 dark:text-slate-100">
            Multi-Agent AI
          </h3>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Specialized AI agents collaborate to create better trips.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-[#292929] dark:bg-[#171717]">
          <div className="text-3xl">🌍</div>
          <h3 className="mt-3 font-semibold text-slate-900 dark:text-slate-100">
            Worldwide Destinations
          </h3>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Explore destinations around the globe.
          </p>
        </div>
      </div>

      {/* How It Works */}
      <section className="mt-12">
        <h2 className="mb-6 text-2xl font-bold text-slate-900 dark:text-slate-100">
          How VoyageAI Works
        </h2>

        <div className="grid gap-4 md:grid-cols-2">
          <Step
            icon="🗺️"
            title="Tell Us Your Travel Idea"
            text="Describe budget, destination preferences, duration, and travel style."
          />

          <Step
            icon="🤖"
            title="AI Finds Perfect Matches"
            text="Multiple AI agents analyze your request and discover suitable destinations."
          />

          <Step
            icon="✅"
            title="Choose Your Destination"
            text="Review recommendations and select your favorite option."
          />

          <Step
            icon="🏨"
            title="Get Complete Trip Plan"
            text="Hotels, itinerary, weather, maps, budget allocation, and travel tips."
          />
        </div>
      </section>

      {/* Tech Stack */}
      <section className="mt-12">
        <h2 className="mb-6 text-2xl font-bold text-slate-900 dark:text-slate-100">
          Technology Stack
        </h2>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-[#292929] dark:bg-[#171717]">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              "⚛️ React + Vite",
              "🚀 FastAPI",
              "🤖 CrewAI",
              "🧠 OpenRouter",
              "🌦️ OpenWeather",
              "🏨 Geoapify",
              "🗺️ Leaflet Maps",
              "🗄️ Supabase",
              "☁️ Vercel + Render",
            ].map((item) => (
              <div
                key={item}
                className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm dark:border-[#292929] dark:bg-[#1f1f1f] dark:text-slate-300"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <div className="mt-12 rounded-3xl border border-slate-200 bg-white p-8 text-center dark:border-[#292929] dark:bg-[#171717]">
        <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Ready for Your Next Adventure?
        </h3>

        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Let AI handle the planning while you enjoy the journey.
        </p>

        <button
          onClick={onStartPlanning}
          className="mt-5 rounded-2xl bg-primary px-6 py-3 font-semibold text-white transition-all hover:scale-105"
        >
          Start Planning Now
        </button>
      </div>
    </motion.div>
  );
}