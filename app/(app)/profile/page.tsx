import type { Metadata } from "next";

import ProfilePage from "@/app/features/profile/profile-page";

export const metadata: Metadata = {
  title: "Profile — Kue",
  description:
    "Your Kue profile — favorites, custom lists, and recent activity.",
};

export const dynamic = "force-dynamic";

export default function ProfilePageRoute() {
  return <ProfilePage />;
}
