import { motion } from "framer-motion";

const COLOR_VARIANTS = {
  primary: {
    border: [
      "border-[#72e3ad]/70",
      "border-[#4ade80]/60",
      "border-slate-600/20",
    ],
    gradient: "from-[#72e3ad]/30",
  },
};

const AnimatedGrid = () => (
  <motion.div
    className="absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,transparent_30%,black)]"
    animate={{ backgroundPosition: ["0% 0%", "100% 100%"] }}
    transition={{ duration: 40, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
  >
    <div className="h-full w-full [background-image:repeating-linear-gradient(100deg,#64748B_0%,#64748B_1px,transparent_1px,transparent_4%)] opacity-20" />
  </motion.div>
);

export function BackgroundCircles({ className }) {
  const variantStyles = COLOR_VARIANTS.primary;
  return (
    <div
      className={`relative flex h-screen w-full items-center justify-center overflow-hidden bg-white dark:bg-black/5 ${className || ""}`}
    >
      <AnimatedGrid />

      <motion.div className="absolute -translate-y-16 sm:-translate-y-12 md:-translate-y-8 lg:-translate-y-6 h-[290px] w-[290px] sm:h-[360px] sm:w-[360px] md:h-[400px] md:w-[400px] lg:h-[460px] lg:w-[460px]">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className={`absolute inset-0 rounded-full border-2 bg-gradient-to-br to-transparent ${variantStyles.border[i]} ${variantStyles.gradient}`}
            animate={{ rotate: 360, scale: [1, 1.05 + i * 0.05, 1], opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          >
            <div
              className={`absolute inset-0 rounded-full mix-blend-screen bg-[radial-gradient(ellipse_at_center,${variantStyles.gradient.replace("from-", "")}/10%,transparent_70%)]`}
            />
          </motion.div>
        ))}
      </motion.div>

      <div className="absolute inset-0 [mask-image:radial-gradient(90%_60%_at_50%_50%,#000_40%,transparent)]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,#72e3ad/30%,transparent_70%)] blur-[120px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,#4ade80/15%,transparent)] blur-[80px]" />
      </div>
    </div>
  );
}