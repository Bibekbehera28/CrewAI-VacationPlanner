import { motion } from 'framer-motion';

export default function Navbar({ onAbout, onToggleSidebar, theme = 'light', onToggleTheme }) {
  const isDark = theme === 'dark';

  return (
    <motion.header
      initial={{ y: -12, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="no-print sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-border bg-white px-4 transition-colors duration-300 dark:border-[#292929] dark:bg-[#121212]/85 dark:shadow-[0_1px_18px_rgba(0,0,0,0.28)] dark:backdrop-blur-xl md:px-6"
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="mr-1 inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 hover:bg-card dark:text-[#a2a2a2] dark:hover:bg-[#242424] dark:hover:text-[#e2e8f0] md:hidden"
          aria-label="Toggle sidebar"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white dark:bg-[#006239] dark:text-[#e2e8f0]">
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 00-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
          </svg>
        </div>
        <span className="text-lg font-semibold text-primary dark:text-[#e2e8f0]">VoyageAI</span>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleTheme}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-white text-slate-600 transition hover:bg-card hover:text-primary dark:border-[#292929] dark:bg-[#242424] dark:text-[#a2a2a2] dark:hover:border-[#313131] dark:hover:bg-[#313131] dark:hover:text-[#e2e8f0]"
          aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
          title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        >
          {isDark ? (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.36-6.36-1.42 1.42M7.06 16.94l-1.42 1.42m12.72 0-1.42-1.42M7.06 7.06 5.64 5.64M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12.8A8.5 8.5 0 1111.2 3 6.5 6.5 0 0021 12.8z" />
            </svg>
          )}
        </button>
        <button
  type="button"
  onClick={onAbout}
  className="
    rounded-xl
    border
    border-border
    bg-white
    px-4
    py-2
    text-sm
    font-semibold
    text-primary
    transition-all
    duration-200
    hover:bg-card
    hover:shadow-sm
    dark:border-[#292929]
    dark:bg-[#242424]
    dark:text-[#4ade80]
    dark:hover:bg-[#313131]
    dark:hover:text-[#e2e8f0]
  "
>
  About
</button>
      </div>
    </motion.header>
  );
}
