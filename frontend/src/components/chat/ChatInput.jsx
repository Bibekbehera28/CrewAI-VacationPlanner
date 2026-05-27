import { useState } from 'react';
import { motion } from 'framer-motion';

export default function ChatInput({ onSend, disabled, placeholder = 'Ask anything about your trip...' }) {
  const [text, setText] = useState('');

  const submit = () => {
    const msg = text.trim();
    if (!msg || disabled) return;
    onSend?.(msg);
    setText('');
  };

  return (
    <div className="flex items-center gap-2 rounded-2xl border border-border bg-white p-2 shadow-sm focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15">
      <input
        type="text"
        value={text}
        disabled={disabled}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm outline-none disabled:opacity-50"
      />
      <motion.button
        type="button"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        disabled={disabled || !text.trim()}
        onClick={submit}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white disabled:opacity-40"
        aria-label="Send message"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
      </motion.button>
    </div>
  );
}
