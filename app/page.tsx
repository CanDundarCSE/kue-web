import type { Metadata } from "next";
import LandingPage from "@/app/features/landing/landing-page";

export const metadata: Metadata = {
  title: "Kue — one catalog for everything you watch, play & read",
  description:
    "Kue tracks films, series, games, anime and manga in a single index — format-aware progress, statuses, ratings and stats. Synced from TMDB, AniList and IGDB.",
};

export default function Home() {
  return <LandingPage />;
}
