"use client";

import { useState, type ReactNode } from "react";

import AppSidebar from "@/app/components/app-sidebar";
import HomeTopBar from "@/app/features/home/topbar";
import { CurrentUserProvider } from "@/lib/use-current-user";
import { cn } from "@/lib/utils";

export default function HomeLayout({ children }: { children: ReactNode }) {
  // Desktop rail collapse state. The mobile <lg sheet is unrelated and drives
  // itself; this only affects the persistent desktop sidebar.
  const [collapsed, setCollapsed] = useState(false);

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
            onToggleCollapse={() => setCollapsed((value) => !value)}
          />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <HomeTopBar />
          <main className="flex-1">{children}</main>
        </div>
      </div>
    </CurrentUserProvider>
  );
}
