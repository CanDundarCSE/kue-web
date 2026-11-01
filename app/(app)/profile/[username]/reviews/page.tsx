import type { Metadata } from "next";

import UserReviewsView from "@/app/features/reviews/user-reviews-view";

export const metadata: Metadata = {
  title: "Reviews — Kue",
  description: "Every public review written by this Kue member.",
};

export default async function UserReviewsPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  return <UserReviewsView username={username} />;
}
