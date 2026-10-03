"use client";

import type { ReactNode } from "react";

import AppSidebar from "@/app/components/app-sidebar";
import HomeTopBar from "@/app/features/home/topbar";
import { CurrentUserProvider } from "@/lib/use-current-user";

export default function HomeLayout({ children }: { children: ReactNode }) {
  return (
    <CurrentUserProvider>
      <div className="flex min-h-dvh">
        <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 border-r border-line lg:block">
          <AppSidebar />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <HomeTopBar />
          <main className="flex-1">{children}</main>
        </div>
      </div>
    </CurrentUserProvider>
  );
}
