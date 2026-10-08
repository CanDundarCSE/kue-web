"use client";

import { useSyncExternalStore, type ReactNode } from "react";

import AppSidebar from "@/app/components/app-sidebar";
import AppTopBar from "@/app/components/app-topbar";
import { CurrentUserProvider } from "@/lib/use-current-user";
import { cn } from "@/lib/utils";

const SIDEBAR_COOKIE_NAME = "kue_sidebar_collapsed";

// Module-level cache so client-side navigation between separate route layouts
// instantly retains the current collapse state without resetting or waiting.
let cachedSidebarCollapsed: boolean | null = null;
const listeners = new Set<() => void>();

function subscribe(callback: () => void) {
  listeners.add(callback);

  // If client-side storage has a saved preference and the in-memory cache hasn't been set yet,
  // sync it once after hydration without blocking initial render.
  if (cachedSidebarCollapsed === null && typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(SIDEBAR_COOKIE_NAME);
      if (stored !== null) {
        cachedSidebarCollapsed = stored === "true";
        callback();
      }
    } catch {
      // Storage access may be restricted
    }
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key === SIDEBAR_COOKIE_NAME && event.newValue !== null) {
      cachedSidebarCollapsed = event.newValue === "true";
      callback();
    }
  };

  window.addEventListener("storage", handleStorage);
  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", handleStorage);
  };
}

function notify() {
  for (const listener of listeners) {
    listener();
  }
}

function setSidebarCollapsed(value: boolean) {
  cachedSidebarCollapsed = value;
  try {
    document.cookie = `${SIDEBAR_COOKIE_NAME}=${value}; path=/; max-age=31536000; SameSite=Lax`;
    localStorage.setItem(SIDEBAR_COOKIE_NAME, String(value));
  } catch {
    // Storage access may be restricted in some environments (e.g. private mode)
  }
  notify();
}

// The app shell: persistent desktop rail, top bar, and content column.
// Shared across the app layouts so all sections keep the same
// chrome (session provider included).
export default function AppShell({
  children,
  defaultCollapsed = false,
}: {
  children: ReactNode;
  defaultCollapsed?: boolean;
}) {
  const collapsed = useSyncExternalStore(
    subscribe,
    () => {
      if (cachedSidebarCollapsed !== null) {
        return cachedSidebarCollapsed;
      }
      return defaultCollapsed;
    },
    () => defaultCollapsed,
  );

  return (
    <CurrentUserProvider>
      <div className="flex min-h-dvh">
        <aside
          className={cn(
            "sticky top-0 hidden h-dvh shrink-0 overflow-hidden border-r border-line lg:block",
            "transition-[width] duration-200 ease-out motion-reduce:transition-none",
            collapsed ? "w-14" : "w-60",
          )}
        >
          <AppSidebar
            collapsed={collapsed}
            onToggleCollapse={() => setSidebarCollapsed(!collapsed)}
          />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <AppTopBar />
          <main className="flex-1">{children}</main>
        </div>
      </div>
    </CurrentUserProvider>
  );
}
