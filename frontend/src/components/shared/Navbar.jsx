import { motion } from 'framer-motion';

export default function Navbar() {
  return (
    <motion.header
      initial={{ y: -12, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="no-print sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-border bg-white px-4 md:px-6"
    >
      <div className="flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white">
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 00-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
          </svg>
        </div>
        <span className="text-lg font-semibold text-primary">VoyageAI</span>
      </div>
      <a
        href="#about"
        className="text-sm font-medium text-slate-600 transition hover:text-primary"
      >
        About
      </a>
    </motion.header>
  );
}
