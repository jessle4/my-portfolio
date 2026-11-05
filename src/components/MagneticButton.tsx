import { useRef } from "react";
import type { MouseEvent, ReactNode } from "react";

import {
  motion,
  useMotionValue,
  useSpring,
  useReducedMotion,
} from "motion/react";

interface MagneticButtonProps {
  href: string;
  children: ReactNode;
}

export default function MagneticButton({
  href,
  children,
}: MagneticButtonProps) {
  const ref = useRef<HTMLAnchorElement>(null);
  const reduceMotion = useReducedMotion();

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springX = useSpring(x, {
    stiffness: 160,
    damping: 15,
  });

  const springY = useSpring(y, {
    stiffness: 160,
    damping: 15,
  });

  const handleMouseMove = (event: MouseEvent<HTMLAnchorElement>) => {
    if (reduceMotion) return;

    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;

    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    x.set((event.clientX - centerX) * 0.25);
    y.set((event.clientY - centerY) * 0.25);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.a
      ref={ref}
      href={href}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        x: reduceMotion ? 0 : springX,
        y: reduceMotion ? 0 : springY,
      }}
      whileHover={reduceMotion ? undefined : { scale: 1.05 }}
      whileTap={{ scale: 0.97 }}
      className="inline-flex items-center justify-center rounded-full bg-[#493841] px-8 py-4 font-medium text-white shadow-lg transition-colors hover:bg-[#A45573]"
    >
      {children}
    </motion.a>
  );
}
