"use client";

import { useCallback, useRef, useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

const TRANSITION_MS = 520;

function subscribeToNothing() {
  return () => {};
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export default function ThemeToggleButton({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const mounted = useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false,
  );

  const toggleTheme = useCallback(() => {
    const next = resolvedTheme === "dark" ? "light" : "dark";
    const reduceMotion = prefersReducedMotion();
    const supportsViewTransition =
      typeof document.startViewTransition === "function" && !reduceMotion;

    if (!supportsViewTransition) {
      setTheme(next);
      return;
    }

    const origin = buttonRef.current?.getBoundingClientRect();
    const radius = origin
      ? Math.hypot(
          Math.max(origin.left, window.innerWidth - origin.right),
          Math.max(origin.top, window.innerHeight - origin.top),
        )
      : 0;

    document.documentElement.animate(
      { clipPath: [`circle(0px at ${origin?.left ?? 0}px ${origin?.top ?? 0}px)`, `circle(${radius}px at ${origin?.left ?? 0}px ${origin?.top ?? 0}px)`] },
      {
        duration: TRANSITION_MS,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)",
        pseudoElement: "::view-transition-new(root)",
      },
    );

    document.startViewTransition(() => setTheme(next));
  }, [resolvedTheme, setTheme]);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={[
        "relative grid size-10 shrink-0 place-items-center rounded-xl",
        "before:absolute before:-inset-1 before:content-['']",
        "bg-zinc-900 text-white transition-[background-color,color,transform] duration-200",
        "hover:bg-zinc-700 active:scale-95",
        "dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2",
        "focus-visible:ring-offset-white dark:focus-visible:ring-zinc-400 dark:focus-visible:ring-offset-zinc-950",
        "motion-reduce:transition-none",
        className ?? "",
      ].join(" ")}
    >
      <span className="pointer-events-none absolute inset-0 grid place-items-center">
        <Sun
          aria-hidden="true"
          strokeWidth={2.25}
          className="col-start-1 row-start-1 size-5 rotate-0 scale-100 opacity-100 transition-[opacity,transform] duration-300 motion-reduce:transition-none dark:-rotate-90 dark:scale-0 dark:opacity-0"
        />
        <Moon
          aria-hidden="true"
          strokeWidth={2.25}
          className="col-start-1 row-start-1 size-5 -rotate-90 scale-0 opacity-0 transition-[opacity,transform] duration-300 motion-reduce:transition-none dark:rotate-0 dark:scale-100 dark:opacity-100"
        />
      </span>
    </button>
  );
}
