"use client";

import type { ReactNode } from "react";

import AppTopBar from "@/app/components/app-topbar";
import { CurrentUserProvider } from "@/lib/use-current-user";

// Every public app page (sign in, register, password reset) shares the top
// bar chrome, just not the authenticated app shell (no sidebar). The landing
// page stays fully standalone with its own site nav.
//
// The provider is mounted so the account menu and search behave correctly for
// signed-in visitors; a missing session is the normal state on these pages,
// and lib/api/client deliberately does not redirect from them.
export default function AuthGroupLayout({ children }: { children: ReactNode }) {
  return (
    <CurrentUserProvider>
      <div className="flex min-h-dvh flex-col">
        <AppTopBar />
        {children}
      </div>
    </CurrentUserProvider>
  );
}
