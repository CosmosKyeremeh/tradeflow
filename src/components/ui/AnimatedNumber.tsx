"use client";

import { useEffect, useRef } from "react";
import { animate, useMotionValue } from "motion/react";

export function AnimatedNumber({
  value,
  format,
}: {
  value: number;
  format?: (n: number) => string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(0);
  const render = format ?? ((n: number) => Math.round(n).toString());

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReducedMotion) {
      if (ref.current) ref.current.textContent = render(value);
      return;
    }

    const controls = animate(motionValue, value, {
      duration: 0.7,
      ease: [0.16, 1, 0.3, 1],
      onUpdate(latest) {
        if (ref.current) ref.current.textContent = render(latest);
      },
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return <span ref={ref}>{render(0)}</span>;
}
