import type { Metadata } from "next";
import { cache } from "react";

import Dashboard from "@/app/features/home/dashboard";

export const metadata: Metadata = {
  title: "Home — Kue",
  description:
    "Your Kue dashboard — continue titles, weekly activity, and what your friends are logging.",
};

// The dashboard greets the user with the current date/time of day,
// so it must be server-rendered on demand rather than prerendered.
export const dynamic = "force-dynamic";

const getServerTimestamp = cache(() => Date.now());

export default function HomePage() {
  return <Dashboard now={getServerTimestamp()} />;
}
