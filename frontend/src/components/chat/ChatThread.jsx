import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import ChatBubble from './ChatBubble';
import AgentLoadingCard from './AgentLoadingCard';

export default function ChatThread({
  messages,
  isLoading,
  loadingMode,
}) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, loadingMode]);

  const showAgentCard = isLoading && (loadingMode === 'destinations' || loadingMode === 'planning');

  return (
    <div className="space-y-4 py-2">
      {messages.map((msg, i) => (
        <ChatBubble
          key={msg.id || i}
          role={msg.role}
          content={msg.content}
          isFollowUp={msg.isFollowUp}
        />
      ))}
      {showAgentCard && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <AgentLoadingCard key={loadingMode} mode={loadingMode} />
        </motion.div>
      )}
      {isLoading && !showAgentCard && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
          <div className="rounded-2xl border border-border bg-card px-4 py-3 text-sm text-slate-500">
            <span className="inline-flex gap-1">
              <span className="animate-bounce">·</span>
              <span className="animate-bounce [animation-delay:0.1s]">·</span>
              <span className="animate-bounce [animation-delay:0.2s]">·</span>
            </span>
          </div>
        </motion.div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
