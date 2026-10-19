import type { Metadata } from "next";
import type { ReactNode } from "react";

import AppShell from "@/app/components/app-shell";
import AdminGuard from "@/app/features/admin/admin-guard";
import AdminNav from "@/app/features/admin/admin-nav";
import { getSidebarCollapsed } from "@/lib/sidebar";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin — Kue",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const defaultCollapsed = await getSidebarCollapsed();

  return (
    <AppShell defaultCollapsed={defaultCollapsed}>
      <AdminGuard>
        <AdminNav />
        {children}
      </AdminGuard>
    </AppShell>
  );
}
