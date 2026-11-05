import { motion, useReducedMotion } from "motion/react";

export default function AuroraBackground() {
  const reduceMotion = useReducedMotion();

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#FFF8FC]"
    >
      {/* Pink aurora */}
      <motion.div
        className="absolute -left-[20%] -top-[30%] h-[85vw] w-[85vw] rounded-full bg-pink-200/80 blur-[100px]"
        animate={
          reduceMotion
            ? undefined
            : {
                x: [0, 130, -50, 0],
                y: [0, 80, 160, 0],
                scale: [1, 1.25, 0.9, 1],
              }
        }
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Lavender aurora */}
      <motion.div
        className="absolute -bottom-[30%] -right-[20%] h-[85vw] w-[85vw] rounded-full bg-purple-200/75 blur-[110px]"
        animate={
          reduceMotion
            ? undefined
            : {
                x: [0, -150, 70, 0],
                y: [0, -100, 60, 0],
                scale: [1, 1.2, 0.85, 1],
              }
        }
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Rose aurora */}
      <motion.div
        className="absolute left-[20%] top-[15%] h-[60vw] w-[60vw] rounded-full bg-rose-100/80 blur-[90px]"
        animate={
          reduceMotion
            ? undefined
            : {
                x: [0, 100, -100, 0],
                y: [0, -90, 100, 0],
                scale: [1, 1.3, 1],
              }
        }
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
}
