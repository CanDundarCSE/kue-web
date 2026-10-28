import type { Metadata } from "next";
import type { ReactNode } from "react";

import AdminGuard from "@/app/features/admin/admin-guard";
import AdminNav from "@/app/features/admin/admin-nav";

export const metadata: Metadata = {
  title: "Admin — Kue",
  robots: { index: false, follow: false },
};

// The app shell lives in the shared (app) layout, so the admin layout only adds
// the access guard and section nav.
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminGuard>
      <AdminNav />
      {children}
    </AdminGuard>
  );
}
