"use client";

import { ButtonLink } from "@/app/components/button";
import SectionLabel from "@/app/features/home/section-label";
import Favorites, { FavoritesSkeleton } from "@/app/features/profile/favorites";
import Lists, { ListsSkeleton } from "@/app/features/profile/lists";
import ProfileHeader, { ProfileHeaderSkeleton } from "@/app/features/profile/profile-header";
import RecentActivity, { RecentActivitySkeleton } from "@/app/features/profile/recent-activity";
import { useCurrentUser } from "@/lib/use-current-user";

export function ProfilePageSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[1160px] px-5 py-8 sm:px-8 sm:py-10">
      <ProfileHeaderSkeleton />

      <section className="mt-10" aria-label="Favorites">
        <SectionLabel>Favorites</SectionLabel>
        <div className="mt-5">
          <FavoritesSkeleton />
        </div>
      </section>

      <div role="separator" aria-hidden="true" className="my-9 h-px w-full bg-line" />

      <section className="grid gap-4 lg:grid-cols-[1.45fr_1fr]">
        <div>
          <SectionLabel>Lists</SectionLabel>
          <ListsSkeleton />
        </div>
        <RecentActivitySkeleton />
      </section>
    </div>
  );
}

export default function ProfilePage() {
  const { user, loading } = useCurrentUser();

  if (loading) {
    return <ProfilePageSkeleton />;
  }

  // Not signed in (or the session lookup failed): nothing to show, and the
  // top bar already offers sign-in.
  if (user === null) {
    return (
      <div className="mx-auto flex w-full max-w-[1160px] flex-col items-center px-5 py-24 text-center sm:px-8">
        <span className="text-[9px] font-mono tracking-[0.16em] text-ink-3 uppercase">
          Profile
        </span>
        <h1 className="mt-4 font-serif text-[26px] leading-tight text-foreground">
          Sign in to see your profile.
        </h1>
        <p className="mt-2 max-w-sm text-[13px] leading-relaxed text-ink-2">
          Favorites, lists, and recent activity live here once you are signed
          in.
        </p>
        <ButtonLink href="/login" variant="secondary" size="sm" className="mt-6">
          Sign in
        </ButtonLink>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1160px] px-5 py-8 sm:px-8 sm:py-10">
      <ProfileHeader />

      <section className="mt-10" aria-label="Favorites">
        <SectionLabel>Favorites</SectionLabel>
        <Favorites className="mt-5" />
      </section>

      <div role="separator" aria-hidden="true" className="my-9 h-px w-full bg-line" />

      <section className="grid gap-4 lg:grid-cols-[1.45fr_1fr]">
        <Lists />
        <RecentActivity />
      </section>
    </div>
  );
}
