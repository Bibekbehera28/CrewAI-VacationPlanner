import { motion } from 'framer-motion';
import ChatInput from '../chat/ChatInput';

const SUGGESTIONS = [
  'Beach trip for two under ₹20000',
  'Family vacation in India 5 days',
  'Friends trip from Hyderabad budget $500',
  'Solo backpacking in Southeast Asia',
];

export default function OuterSidebar({ onClose, onNewChat, onSend, disabled = false }) {
  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="flex h-full min-h-0 w-full flex-col overflow-y-auto border-r border-border bg-white p-5"
    >
      <div className="mb-6 flex items-center justify-between">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-2 text-slate-500 hover:bg-card md:hidden"
          aria-label="Close sidebar"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <button
          type="button"
          onClick={onNewChat}
          className="ml-auto rounded-2xl border border-border px-3 py-1.5 text-sm font-medium text-primary hover:bg-card"
        >
          + New chat
        </button>
      </div>

      <h2 className="text-xl font-bold text-slate-900">Let&apos;s plan your next trip</h2>
      <p className="mt-2 text-sm text-slate-500">
        Find best-fit destinations, hotels and flights using AI
      </p>

      <div className="mt-6">
        <ChatInput onSend={onSend} disabled={disabled} placeholder="Where would you like to go?" />
      </div>

      <p className="mt-6 text-xs font-semibold uppercase tracking-wide text-slate-400">
        Ask anything
      </p>
      <ul className="mt-2 space-y-1">
        {SUGGESTIONS.map((chip) => (
          <motion.li key={chip} whileHover={{ x: 4 }}>
            <button
              type="button"
              disabled={disabled}
              onClick={() => !disabled && onSend?.(chip)}
              className="flex w-full items-center justify-between rounded-2xl px-3 py-3 text-left text-sm text-slate-700 transition hover:bg-card"
            >
              <span>{chip}</span>
              <svg className="h-4 w-4 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </motion.li>
        ))}
      </ul>
    </motion.aside>
  );
}
