import { useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

function IconButton({ title, onClick, children, active = false }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className={`flex h-10 w-10 items-center justify-center rounded-xl transition ${
        active ? 'bg-primary/10 text-primary' : 'text-slate-500 hover:bg-card hover:text-primary'
      }`}
    >
      {children}
    </button>
  );
}

function formatPlannedAt(iso) {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

export default function ClaudeSidebar({
  isOpen,
  onOpen,
  onClose,
  onNewChat,
  onSearch,
  onMyTrips,
  recents,
  onSelectRecent,
  onDeleteRecent,
  activeRecentSessionId,
}) {
  const [searchMode, setSearchMode] = useState(false);
  const [query, setQuery] = useState('');
  const panelRef = useRef(null);

  const closeAndReset = () => {
    setSearchMode(false);
    setQuery('');
    onClose?.();
  };

  const filteredRecents = useMemo(() => {
    if (!query.trim()) return recents || [];
    const q = query.trim().toLowerCase();
    return (recents || []).filter((r) => (r.destination || '').toLowerCase().includes(q));
  }, [recents, query]);

  return (
    <>
      <motion.aside
        layout
        animate={{ width: isOpen ? 240 : 60 }}
        transition={{ type: 'spring', stiffness: 320, damping: 34 }}
        className="no-print relative z-30 hidden h-full shrink-0 overflow-hidden border-r border-border bg-white shadow-sm md:flex md:flex-col"
      >
        <div className="flex w-full flex-1 flex-col items-center gap-2 pt-1">
          {!isOpen ? (
            <>
              <IconButton title="Open sidebar" onClick={onOpen}>
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </IconButton>
              <IconButton title="New chat" onClick={onNewChat}>
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </IconButton>
              <IconButton
                title="Search"
                onClick={() => {
                  onOpen?.();
                  setSearchMode(true);
                  setTimeout(() => panelRef.current?.querySelector('input')?.focus(), 0);
                  onSearch?.();
                }}
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </IconButton>
              <IconButton title="My Trips" onClick={onMyTrips}>
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 7h12l-1 14H7L6 7zM9 7V6a3 3 0 016 0v1" />
                </svg>
              </IconButton>
            </>
          ) : (
            <div ref={panelRef} className="flex h-full w-full flex-col px-3 pb-3 pt-1">
              <div className="flex items-center justify-between px-2 pb-2">
                <p className="text-xs font-semibold tracking-wide text-slate-500">VoyageAI</p>
                <button
                  type="button"
                  onClick={closeAndReset}
                  className="rounded-lg p-1.5 text-slate-500 transition hover:bg-card hover:text-primary"
                  aria-label="Close sidebar"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              </div>
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={onNewChat}
                  className="flex w-full items-center gap-3 rounded-[10px] border border-[#eef2f5] bg-transparent px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition duration-200 hover:border-[#e3e7eb] hover:bg-[#f7f8fa] hover:text-primary"
                >
                  <svg className="h-5 w-5 shrink-0 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  New Chat
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSearchMode(true);
                    setTimeout(() => panelRef.current?.querySelector('input')?.focus(), 0);
                    onSearch?.();
                  }}
                  className="flex w-full items-center gap-3 rounded-[10px] border border-[#eef2f5] bg-transparent px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition duration-200 hover:border-[#e3e7eb] hover:bg-[#f7f8fa] hover:text-primary"
                >
                  <svg className="h-5 w-5 shrink-0 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Search
                </button>
                <button
                  type="button"
                  onClick={onMyTrips}
                  className="flex w-full items-center gap-3 rounded-[10px] border border-[#eef2f5] bg-transparent px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition duration-200 hover:border-[#e3e7eb] hover:bg-[#f7f8fa] hover:text-primary"
                >
                  <svg className="h-5 w-5 shrink-0 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 7h12l-1 14H7L6 7zM9 7V6a3 3 0 016 0v1" />
                  </svg>
                  My Trips
                </button>
              </div>

              <div className="px-2 pt-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Recents</p>
              </div>

              {searchMode && (
                <div className="pt-2">
                  <div className="flex items-center gap-2 rounded-xl border border-border bg-white px-3 py-2 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15">
                    <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search destinations..."
                      className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setQuery('');
                        setSearchMode(false);
                      }}
                      className="rounded-lg p-1 text-slate-400 transition hover:bg-card hover:text-primary"
                      aria-label="Close search"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}

              <div className="min-h-0 flex-1 overflow-y-auto px-1 py-2">
                {!filteredRecents?.length ? (
                  <div className="px-2 py-6 text-sm text-slate-500">
                    {query.trim() ? 'No matches.' : 'No recent chats yet.'}
                  </div>
                ) : (
                  <ul className="space-y-1">
                    {filteredRecents.map((r) => (
                      <li key={r.session_id || r.id}>
                        <div
                          className={`group flex items-center gap-2 rounded-xl border px-2 py-1 transition ${
                            activeRecentSessionId && activeRecentSessionId === r.session_id
                              ? 'border-[#e5e7eb] bg-[#f3f4f6]'
                              : 'border-transparent hover:bg-[#f8fafc]'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => onSelectRecent?.(r)}
                            className="min-w-0 flex-1 text-left"
                          >
                            <p
                              className={`truncate text-sm font-medium ${
                                activeRecentSessionId && activeRecentSessionId === r.session_id
                                  ? 'text-slate-900'
                                  : 'text-slate-800'
                              }`}
                            >
                              {r.destination}
                              {r.country ? `, ${r.country}` : ''}
                            </p>
                            <p className="text-xs text-slate-400">{formatPlannedAt(r.planned_at)}</p>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const ok = window.confirm('Delete this trip?');
                              if (ok) onDeleteRecent?.(r);
                            }}
                            className="rounded-lg p-1.5 text-slate-400 opacity-0 transition duration-200 hover:bg-white hover:text-red-600 group-hover:opacity-100"
                            aria-label={`Delete ${r.destination || 'trip'}`}
                            title="Delete trip"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5-3h4m-7 3h10" />
                            </svg>
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>
      </motion.aside>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/30 md:hidden"
              onClick={closeAndReset}
            />
            <motion.aside
              ref={panelRef}
              initial={{ x: -240 }}
              animate={{ x: 0 }}
              exit={{ x: -240 }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className="no-print fixed left-0 top-0 z-50 flex h-full w-[240px] flex-col border-r border-border bg-white shadow-xl md:hidden"
            >
              <div className="flex items-center justify-between px-3 py-2">
                <p className="text-xs font-semibold tracking-wide text-slate-500">VoyageAI</p>
                <button
                  type="button"
                  onClick={closeAndReset}
                  className="rounded-xl p-2 text-slate-500 transition hover:bg-card hover:text-primary"
                  aria-label="Close sidebar"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              </div>

              <div className="space-y-1 px-2 pb-3">
                <button
                  type="button"
                  onClick={onNewChat}
                  className="flex w-full items-center gap-3 rounded-[10px] border border-[#eef2f5] bg-transparent px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition duration-200 hover:border-[#e3e7eb] hover:bg-[#f7f8fa] hover:text-primary"
                >
                  <svg className="h-5 w-5 shrink-0 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  New Chat
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSearchMode(true);
                    setTimeout(() => panelRef.current?.querySelector('input')?.focus(), 0);
                    onSearch?.();
                  }}
                  className="flex w-full items-center gap-3 rounded-[10px] border border-[#eef2f5] bg-transparent px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition duration-200 hover:border-[#e3e7eb] hover:bg-[#f7f8fa] hover:text-primary"
                >
                  <svg className="h-5 w-5 shrink-0 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Search
                </button>
                <button
                  type="button"
                  onClick={onMyTrips}
                  className="flex w-full items-center gap-3 rounded-[10px] border border-[#eef2f5] bg-transparent px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition duration-200 hover:border-[#e3e7eb] hover:bg-[#f7f8fa] hover:text-primary"
                >
                  <svg className="h-5 w-5 shrink-0 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 7h12l-1 14H7L6 7zM9 7V6a3 3 0 016 0v1" />
                  </svg>
                  My Trips
                </button>
              </div>

              <div className="px-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Recents
                </p>
              </div>

              {searchMode && (
                <div className="px-3 pt-2">
                  <div className="flex items-center gap-2 rounded-xl border border-border bg-white px-3 py-2 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15">
                    <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search destinations..."
                      className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setQuery('');
                        setSearchMode(false);
                      }}
                      className="rounded-lg p-1 text-slate-400 hover:bg-card hover:text-primary"
                      aria-label="Close search"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}

              <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
                {!filteredRecents?.length ? (
                  <div className="px-2 py-6 text-sm text-slate-500">
                    {query.trim() ? 'No matches.' : 'No recent chats yet.'}
                  </div>
                ) : (
                  <ul className="space-y-1">
                    {filteredRecents.map((r) => (
                      <li key={r.session_id || r.id}>
                        <div
                          className={`group flex items-center gap-2 rounded-xl border px-2 py-1 transition ${
                            activeRecentSessionId && activeRecentSessionId === r.session_id
                              ? 'border-[#e5e7eb] bg-[#f3f4f6]'
                              : 'border-transparent hover:bg-[#f8fafc]'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => onSelectRecent?.(r)}
                            className="min-w-0 flex-1 text-left"
                          >
                            <p
                              className={`truncate text-sm font-medium ${
                                activeRecentSessionId && activeRecentSessionId === r.session_id
                                  ? 'text-slate-900'
                                  : 'text-slate-800'
                              }`}
                            >
                              {r.destination}
                              {r.country ? `, ${r.country}` : ''}
                            </p>
                            <p className="text-xs text-slate-400">{formatPlannedAt(r.planned_at)}</p>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const ok = window.confirm('Delete this trip?');
                              if (ok) onDeleteRecent?.(r);
                            }}
                            className="rounded-lg p-1.5 text-slate-400 opacity-0 transition duration-200 hover:bg-white hover:text-red-600 group-hover:opacity-100"
                            aria-label={`Delete ${r.destination || 'trip'}`}
                            title="Delete trip"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5-3h4m-7 3h10" />
                            </svg>
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

