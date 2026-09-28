"use client";

import { useCallback, useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";

type Theme = "light" | "dark";

const STORAGE_KEY = "kue-theme";

function readCurrentTheme(): Theme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function subscribeToTheme(onStoreChange: () => void) {
  const observer = new MutationObserver(onStoreChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  return () => observer.disconnect();
}

export default function ThemeToggleButton({ className }: { className?: string }) {
  const theme = useSyncExternalStore(subscribeToTheme, readCurrentTheme, () => "light");

  const toggleTheme = useCallback(() => {
    const next: Theme = readCurrentTheme() === "dark" ? "light" : "dark";
    const root = document.documentElement;

    root.classList.remove("light", "dark");
    root.classList.add(next);
    root.style.colorScheme = next;

    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {}
  }, []);

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      className={[
        "relative grid size-10 shrink-0 place-items-center rounded-xl",
        "before:absolute before:-inset-1 before:content-['']",
        "bg-zinc-900 text-white transition-[background-color,color,transform] duration-200",
        "hover:bg-zinc-700 active:scale-95",
        "dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
        "dark:focus-visible:ring-zinc-400 dark:focus-visible:ring-offset-zinc-950",
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
