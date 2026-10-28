import type { Metadata } from "next";

import AdminUsersView from "@/app/features/admin/admin-users";

export const metadata: Metadata = {
  title: "Users — Kue Admin",
  description: "Search, inspect and moderate Kue accounts.",
};

export default function AdminUsersPage() {
  return <AdminUsersView />;
}
