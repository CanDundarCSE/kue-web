"use client";

import { useSyncExternalStore, type ReactNode } from "react";

import AppSidebar from "@/app/components/app-sidebar";
import AppTopBar from "@/app/components/app-topbar";
import SessionStatusScreen from "@/app/components/session-status-screen";
import LegalReacceptDialog from "@/app/features/legal/legal-reaccept-dialog";
import { CurrentUserProvider, useCurrentUser } from "@/lib/use-current-user";
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
  return (
    <CurrentUserProvider>
      <AppShellFrame defaultCollapsed={defaultCollapsed}>{children}</AppShellFrame>
    </CurrentUserProvider>
  );
}

// Renders nothing but a status screen until the session is known to be valid.
// Children are never mounted for a signed-out or unauthenticated visitor, so no
// protected UI appears and no authenticated API calls are fired.
function AppShellFrame({
  children,
  defaultCollapsed,
}: {
  children: ReactNode;
  defaultCollapsed: boolean;
}) {
  const { status } = useCurrentUser();
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

  // "unauthenticated" is a 401: the provider has already started a full
  // navigation to /login. Keep the loader up instead of rendering the app.
  if (status === "loading" || status === "unauthenticated") {
    return <SessionStatusScreen state="loading" />;
  }

  if (status === "unavailable") {
    return <SessionStatusScreen state="unavailable" />;
  }

  return (
    <>
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

      {/* Re-prompts when the accepted legal version is stale. */}
      <LegalReacceptDialog />
    </>
  );
}
