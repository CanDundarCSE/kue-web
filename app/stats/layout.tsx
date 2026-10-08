import type { ReactNode } from "react";

import AppShell from "@/app/components/app-shell";
import { getSidebarCollapsed } from "@/lib/sidebar";

export default async function StatsLayout({ children }: { children: ReactNode }) {
  const defaultCollapsed = await getSidebarCollapsed();
  return <AppShell defaultCollapsed={defaultCollapsed}>{children}</AppShell>;
}

