import type { Metadata } from "next";

import ReviewsView from "@/app/features/reviews/reviews-view";

export const metadata: Metadata = {
  title: "Reviews — Kue",
  description: "Everything you've written about the titles in your library.",
};

export default function ReviewsPage() {
  return <ReviewsView />;
}