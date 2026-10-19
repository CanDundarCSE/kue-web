import type { ReactNode } from "react";

import AppShell from "@/app/components/app-shell";
import AdminGuard from "@/app/features/admin/admin-guard";
import AdminNav from "@/app/features/admin/admin-nav";
import { getSidebarCollapsed } from "@/lib/sidebar";

export const dynamic = "force-dynamic";

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
