import type { Metadata } from "next";

import AdminDashboardView from "@/app/features/admin/admin-dashboard";

export const metadata: Metadata = {
  title: "Admin — Kue",
  description: "Operational overview for Kue administrators.",
};

export default function AdminPage() {
  return <AdminDashboardView />;
}
