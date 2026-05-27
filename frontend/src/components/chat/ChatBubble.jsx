import { motion } from 'framer-motion';

export default function ChatBubble({ role, content, isFollowUp }) {
  const isUser = role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, x: isUser ? 20 : -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed md:max-w-[75%] ${
          isUser
            ? 'bg-primary text-white'
            : `bg-card text-slate-700 ${isFollowUp ? 'border-l-4 border-primary' : 'border border-border'}`
        }`}
      >
        {content}
      </div>
    </motion.div>
  );
}
