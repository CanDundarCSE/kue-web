"use client";

import { useEffect, useRef, useState } from "react";

const DURATION = 900;

export default function CountUp({
  value,
  decimals = 0,
  suffix = "",
}: {
  value: number;
  decimals?: number;
  suffix?: string;
}) {
  const nodeRef = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    const node = nodeRef.current;
    if (!node || !("IntersectionObserver" in window)) {
      return;
    }

    let frame = 0;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) {
            continue;
          }

          observer.disconnect();
          const start = performance.now();
          const step = (now: number) => {
            const progress = Math.min(1, (now - start) / DURATION);
            setDisplay(value * (1 - Math.pow(1 - progress, 3)));
            if (progress < 1) {
              frame = requestAnimationFrame(step);
            }
          };
          frame = requestAnimationFrame(step);
        }
      },
      { threshold: 0.4 },
    );

    observer.observe(node);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [value]);

  return (
    <span ref={nodeRef} className="tabular-nums">
      {decimals > 0 ? display.toFixed(decimals) : Math.round(display).toLocaleString("en-US")}
      {suffix}
    </span>
  );
}
