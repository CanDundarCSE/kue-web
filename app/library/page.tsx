import { Suspense } from "react";

import LibraryView, { LibrarySkeleton } from "@/app/features/library/library-view";

export const dynamic = "force-dynamic";

export default function LibraryPage() {
  return (
    <Suspense fallback={<LibrarySkeleton />}>
      <LibraryView />
    </Suspense>
  );
}

