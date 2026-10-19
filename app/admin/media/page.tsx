import type { Metadata } from "next";

import AdminMediaView from "@/app/features/admin/admin-media";

export const metadata: Metadata = {
  title: "Media — Kue Admin",
  description: "Inspect and maintain the cached media catalog.",
};

export default function AdminMediaPage() {
  return <AdminMediaView />;
}
