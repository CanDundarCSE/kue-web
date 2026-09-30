"use client";

import { useEffect } from "react";

export default function RevealObserver() {
  useEffect(() => {
    const nodes = document.querySelectorAll("[data-reveal]");
    if (nodes.length === 0 || !("IntersectionObserver" in window)) {
      return;
    }

    document.documentElement.classList.add("kue-js");

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) {
            continue;
          }

          entry.target.classList.add("is-revealed");
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.08 },
    );

    const viewport = window.innerHeight;
    for (const node of nodes) {
      const box = node.getBoundingClientRect();
      if (box.top < viewport * 0.96 && box.bottom > 0) {
        node.classList.add("is-revealed");
      } else {
        observer.observe(node);
      }
    }

    return () => observer.disconnect();
  }, []);

  return null;
}
