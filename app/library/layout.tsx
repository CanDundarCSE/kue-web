import type { Metadata } from "next";
import type { ReactNode } from "react";

import AppShell from "@/app/components/app-shell";
import { getSidebarCollapsed } from "@/lib/sidebar";

export const metadata: Metadata = {
  title: "Library — Kue",
  description: "Everything you're tracking across films, series, games, anime, and manga.",
};

export default async function LibraryLayout({ children }: { children: ReactNode }) {
  const defaultCollapsed = await getSidebarCollapsed();
  return <AppShell defaultCollapsed={defaultCollapsed}>{children}</AppShell>;
}
