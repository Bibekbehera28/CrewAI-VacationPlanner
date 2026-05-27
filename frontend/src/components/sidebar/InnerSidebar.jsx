import { motion } from 'framer-motion';
import TripHistoryPanel from './TripHistoryPanel';
import ChatInput from '../chat/ChatInput';

export default function InnerSidebar({
  onClose,
  onBack,
  onNewChat,
  activeView,
  onViewChange,
  trips,
  onSelectTrip,
  onStartPlanning,
  onSend,
  isLoading,
}) {
  const navBtn = (view, label, icon) => (
    <button
      type="button"
      onClick={() => onViewChange?.(view)}
      className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition ${
        activeView === view ? 'bg-primary/10 font-medium text-primary' : 'text-slate-600 hover:bg-card'
      }`}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <motion.aside
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex h-full min-h-0 w-full flex-col border-r border-border bg-white"
    >
      <div className="flex items-center gap-2 border-b border-border p-4">
        <button
          type="button"
          onClick={onBack}
          className="rounded-lg p-2 text-slate-500 hover:bg-card"
          aria-label="Back"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="flex-1 text-center text-sm font-semibold text-slate-800">AI Assistant</h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-2 text-slate-500 hover:bg-card md:hidden"
          aria-label="Close"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="space-y-1 p-3">
        <button
          type="button"
          onClick={onNewChat}
          className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-slate-600 hover:bg-card"
        >
          <span className="text-lg leading-none">+</span>
          New chat
        </button>
        {navBtn(
          'chat',
          'Chat',
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}
        {navBtn(
          'trips',
          'My Trips',
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
        )}
      </div>

      <p className="px-4 text-xs font-semibold uppercase tracking-wide text-slate-400">Recents</p>

      <div className="min-h-0 flex-1 overflow-y-auto pb-3">
        <TripHistoryPanel
          trips={trips}
          onSelectTrip={onSelectTrip}
          onStartPlanning={onStartPlanning}
        />
      </div>

      {activeView === 'chat' && (
        <div className="border-t border-border p-3">
          <ChatInput onSend={onSend} disabled={isLoading} />
        </div>
      )}
    </motion.aside>
  );
}
