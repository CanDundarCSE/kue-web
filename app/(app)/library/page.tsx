import { Suspense } from "react";

import LibraryView, { LibrarySkeleton } from "@/app/features/library/library-view";

export const metadata = {
  title: "Library — Kue",
  description: "Everything you're tracking across films, series, games, anime, and manga.",
};

export const dynamic = "force-dynamic";

export default function LibraryPage() {
  return (
    <Suspense fallback={<LibrarySkeleton />}>
      <LibraryView />
    </Suspense>
  );
}

