"use client";

import type { ReactNode } from "react";

import { CurrentUserProvider } from "@/lib/use-current-user";

export default function AuthGroupLayout({ children }: { children: ReactNode }) {
  return (
    <CurrentUserProvider>
      <div className="flex min-h-dvh flex-col justify-center">
        {children}
      </div>
    </CurrentUserProvider>
  );
}
