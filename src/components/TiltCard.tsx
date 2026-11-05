import { useRef, useState } from "react";
import type { MouseEvent } from "react";

import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
} from "motion/react";

interface TiltCardProps {
  title: string;
  description: string;
  tech: string;
}

export default function TiltCard({ title, description, tech }: TiltCardProps) {
  const cardRef = useRef<HTMLElement>(null);
  const [hovered, setHovered] = useState(false);

  const reduceMotion = useReducedMotion();

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springX = useSpring(x, {
    stiffness: 180,
    damping: 20,
  });

  const springY = useSpring(y, {
    stiffness: 180,
    damping: 20,
  });

  const rotateX = useTransform(springY, [-0.5, 0.5], [10, -10]);

  const rotateY = useTransform(springX, [-0.5, 0.5], [-10, 10]);

  const handleMouseMove = (event: MouseEvent<HTMLElement>) => {
    if (reduceMotion) return;

    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;

    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    x.set((event.clientX - centerX) / rect.width);
    y.set((event.clientY - centerY) / rect.height);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
    setHovered(false);
  };

  return (
    <div className="h-full" style={{ perspective: 1000 }}>
      <motion.article
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX: reduceMotion ? 0 : rotateX,
          rotateY: reduceMotion ? 0 : rotateY,
          transformStyle: "preserve-3d",
        }}
        className="relative h-full overflow-hidden rounded-3xl border border-white/70 bg-white/35 p-8 shadow-lg backdrop-blur-xl"
      >
        {/* Glass reflection */}
        <motion.div
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/50 via-transparent to-pink-200/20"
          animate={{
            opacity: hovered ? 1 : 0.4,
          }}
          transition={{ duration: 0.3 }}
        />

        {/* Floating card content */}
        <div
          className="relative"
          style={{
            transform: reduceMotion ? "none" : "translateZ(35px)",
          }}
        >
          <div className="mb-6 flex h-40 items-center justify-center rounded-2xl bg-white/40">
            <span className="text-5xl text-[#A45573]">✧</span>
          </div>

          <h3 className="text-xl font-semibold text-[#493841]">{title}</h3>

          <p className="mt-2 text-sm text-[#806D76]">{description}</p>

          <p className="mt-4 text-xs font-medium text-[#A45573]">{tech}</p>
        </div>
      </motion.article>
    </div>
  );
}
