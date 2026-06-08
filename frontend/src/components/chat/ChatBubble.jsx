import { motion } from 'framer-motion';

export default function ChatBubble({ role, content, isFollowUp }) {
  const isUser = role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed md:max-w-[75%] ${
          isUser
            ? 'bg-primary text-white dark:bg-[#006239] dark:text-[#e2e8f0]'
            : `bg-slate-100 text-slate-800 dark:bg-[#171717] dark:text-[#e2e8f0] ${
                isFollowUp
                  ? 'border-l-4 border-primary dark:border-l-[#4ade80]'
                  : 'border border-border dark:border-[#292929]'
              }`
        }`}
      >
        {content}
      </div>
    </motion.div>
  );
}
