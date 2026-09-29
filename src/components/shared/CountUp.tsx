'use client';

import { useEffect, useRef } from 'react';
import { animate, useReducedMotion } from 'framer-motion';

// A number that counts from its previous value (or zero, on first show) to
// the new one.
export default function CountUp({ value, duration = 0.8 }: { value: number; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const from = useRef(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (reduceMotion) {
      node.textContent = String(value);
      from.current = value;
      return;
    }
    const controls = animate(from.current, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => { node.textContent = String(Math.round(latest)); },
    });
    from.current = value;
    return () => controls.stop();
  }, [value, duration, reduceMotion]);

  return <span ref={ref}>{value}</span>;
}
