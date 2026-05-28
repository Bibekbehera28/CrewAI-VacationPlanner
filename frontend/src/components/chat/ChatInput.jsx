import { useState } from 'react';
import { motion } from 'framer-motion';

export default function ChatInput({
  onSend,
  disabled,
  placeholder = 'Describe your ideal trip...',
  value,
  onChange,
  disabledText,
  size = 'md', // md | lg
}) {
  const isControlled = value != null && typeof onChange === 'function';
  const [uncontrolled, setUncontrolled] = useState('');
  const text = isControlled ? value : uncontrolled;
  const setText = isControlled ? onChange : setUncontrolled;

  const submit = () => {
    const msg = text.trim();
    if (!msg || disabled) return;
    onSend?.(msg);
    setText('');
  };

  return (
    <div
      className={`flex items-center gap-2 rounded-2xl border border-border bg-white p-2 shadow-sm transition focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15 ${
        size === 'lg' ? 'px-3 py-2.5' : ''
      }`}
    >
      <input
        type="text"
        value={text}
        disabled={disabled}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        placeholder={disabled && disabledText ? disabledText : placeholder}
        className={`min-w-0 flex-1 bg-transparent px-3 outline-none disabled:opacity-60 ${
          size === 'lg' ? 'py-3 text-base' : 'py-2 text-sm'
        }`}
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
