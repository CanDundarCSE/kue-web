import type { Metadata } from "next";

import SettingsView from "@/app/features/settings/settings-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Settings — Kue",
  description: "Manage your Kue account — username, email and password.",
};

export default function SettingsPage() {
  return <SettingsView />;
}
