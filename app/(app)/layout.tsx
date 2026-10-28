import type { ReactNode } from "react";

import AppShell from "@/app/components/app-shell";
import { getSidebarCollapsed } from "@/lib/sidebar";

// One shell for every authenticated section. Keeping AppShell (and therefore
// CurrentUserProvider and the top bar) in a single shared layout means moving
// between sections no longer re-mounts them, which previously re-probed
// /api/auth/me and re-fetched notifications on every navigation.
export default async function AppLayout({ children }: { children: ReactNode }) {
  const defaultCollapsed = await getSidebarCollapsed();

  return <AppShell defaultCollapsed={defaultCollapsed}>{children}</AppShell>;
}
