import { motion, useReducedMotion } from "motion/react";

type AuroraVariant = "pink" | "green";

interface AuroraBackgroundProps {
  variant?: AuroraVariant;
}

const themes = {
  pink: {
    background: "#FFF8FC",
    first: "#F8BBD0",
    second: "#DCC9FA",
    third: "#FFE4E6",
  },
  green: {
    background: "#FCFFFC",
    first: "#B8D8BE",
    second: "#C8EBD6",
    third: "#E7F4E8",
  },
};

export default function AuroraBackground({
  variant = "pink",
}: AuroraBackgroundProps) {
  const reduceMotion = useReducedMotion();
  const colors = themes[variant];

  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      animate={{ backgroundColor: colors.background }}
      transition={{ duration: 1 }}
    >
      {/* Top left aurora */}
      <motion.div
        className="absolute -left-[20%] -top-[30%] h-[85vw] w-[85vw] rounded-full blur-[110px]"
        animate={{
          backgroundColor: colors.first,
          x: reduceMotion ? 0 : [0, 130, -50, 0],
          y: reduceMotion ? 0 : [0, 80, 160, 0],
          scale: reduceMotion ? 1 : [1, 1.25, 0.9, 1],
        }}
        transition={{
          backgroundColor: { duration: 1 },
          x: { duration: 20, repeat: Infinity, ease: "easeInOut" },
          y: { duration: 20, repeat: Infinity, ease: "easeInOut" },
          scale: { duration: 20, repeat: Infinity, ease: "easeInOut" },
        }}
        style={{ opacity: 0.7 }}
      />

      {/* Bottom right aurora */}
      <motion.div
        className="absolute -bottom-[30%] -right-[20%] h-[85vw] w-[85vw] rounded-full blur-[120px]"
        animate={{
          backgroundColor: colors.second,
          x: reduceMotion ? 0 : [0, -150, 70, 0],
          y: reduceMotion ? 0 : [0, -100, 60, 0],
          scale: reduceMotion ? 1 : [1, 1.2, 0.85, 1],
        }}
        transition={{
          backgroundColor: { duration: 1 },
          x: { duration: 25, repeat: Infinity, ease: "easeInOut" },
          y: { duration: 25, repeat: Infinity, ease: "easeInOut" },
          scale: { duration: 25, repeat: Infinity, ease: "easeInOut" },
        }}
        style={{ opacity: 0.75 }}
      />

      {/* Centre glow */}
      <motion.div
        className="absolute left-[20%] top-[15%] h-[60vw] w-[60vw] rounded-full blur-[100px]"
        animate={{
          backgroundColor: colors.third,
          x: reduceMotion ? 0 : [0, 100, -100, 0],
          y: reduceMotion ? 0 : [0, -90, 100, 0],
          scale: reduceMotion ? 1 : [1, 1.3, 1],
        }}
        transition={{
          backgroundColor: { duration: 1 },
          x: { duration: 18, repeat: Infinity, ease: "easeInOut" },
          y: { duration: 18, repeat: Infinity, ease: "easeInOut" },
          scale: { duration: 18, repeat: Infinity, ease: "easeInOut" },
        }}
        style={{ opacity: 0.8 }}
      />
    </motion.div>
  );
}
