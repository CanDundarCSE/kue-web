"use client";

import { Check, Globe, Heart, Loader2, Lock, UserMinus, UserPlus, Users, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { ButtonLink } from "@/app/components/button";
import MediaAvatarCard, { type MediaType } from "@/app/components/media-avatar-card";
import SectionLabel from "@/app/features/home/section-label";
import UserAvatar from "@/app/components/user-avatar";
import { ListsSkeleton } from "@/app/features/profile/lists";
import { ProfileHeaderSkeleton } from "@/app/features/profile/profile-header";
import { FavoritesSkeleton, CellSkeleton } from "@/app/features/profile/favorites";
import { RecentActivitySkeleton } from "@/app/features/profile/recent-activity";
import {
  fetchFriendRequests,
  fetchFriends,
  fetchPublicProfile,
  fetchUserActivity,
  fetchUserFriends,
  fetchUserLibrary,
  fetchUserLists,
  removeFriend,
  respondToRequest,
  sendFriendRequestByUsername,
  profileHref,
  type FriendDto,
  type PublicProfileDto,
} from "@/lib/api/friends";
import thumbnailImageLoader from "@/lib/thumbnail-image-loader";
import { useCurrentUser } from "@/lib/use-current-user";
import { cn } from "@/lib/utils";

const MEDIA_TYPES = new Set<MediaType>(["movie", "series", "game", "anime", "manga"]);

type FavoriteCell = {
  mediaId: number;
  title: string;
  year?: number;
  type: MediaType;
  image?: string;
};

type UserList = {
  id: number;
  name: string;
  description?: string | null;
  isPublic: boolean;
  visibility?: string;
  itemCount: number;
  previewCoverImages?: string[];
};

type ActivityDay = { date: string; added: number; completed: number };

function asMediaType(value: string | undefined): MediaType {
  return value && MEDIA_TYPES.has(value as MediaType) ? (value as MediaType) : "movie";
}

function parseDayKey(key: string): Date | null {
  const parts = key.split("-").map(Number);
  if (parts.length === 3 && parts.every((n) => !Number.isNaN(n))) {
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }
  return null;
}

function dayLabel(key: string, todayKey: string, yesterdayKey: string): string {
  if (key === todayKey) return "Today";
  if (key === yesterdayKey) return "Yesterday";
  const date = parseDayKey(key);
  if (!date) return key;
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function dayKeyOf(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

const actionButtonClass = cn(
  "inline-flex items-center gap-1.5 rounded-md px-3.5 py-2 font-mono text-[11px] tracking-[0.08em] uppercase",
  "transition-opacity hover:opacity-90",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
  "disabled:pointer-events-none disabled:opacity-50",
);

function FriendAction({
  profile,
  onChanged,
}: {
  profile: PublicProfileDto;
  onChanged: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [incomingId, setIncomingId] = useState<number | null>(null);

  // Accept/decline needs the request id, which the profile doesn't carry:
  // find it in the incoming list by username.
  useEffect(() => {
    if (profile.friendshipStatus !== "pending_received") {
      // Deferred like other data effects here: setState must not run
      // synchronously in the effect body.
      const reset = setTimeout(() => setIncomingId(null), 0);
      return () => clearTimeout(reset);
    }
    let cancelled = false;
    const handle = setTimeout(() => {
      void fetchFriendRequests("incoming").then((list) => {
        if (cancelled) return;
        const match = (list ?? []).find(
          (request) => request.requesterUsername.toLowerCase() === profile.username.toLowerCase(),
        );
        setIncomingId(match?.id ?? null);
      });
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [profile.friendshipStatus, profile.username]);

  const run = async (work: () => Promise<string | { ok: boolean; message: string } | null>) => {
    if (busy) return;
    setBusy(true);
    setMessage(null);
    try {
      const result = await work();
      if (typeof result === "string") {
        if (result !== null) setMessage(result);
        else onChanged();
      } else if (result && !result.ok) {
        setMessage(result.message);
      } else {
        onChanged();
      }
    } finally {
      setBusy(false);
    }
  };

  if (profile.friendshipStatus === "self") {
    return (
      <Link
        href="/profile"
        className={cn(actionButtonClass, "border border-line-2/70 text-ink-2 hover:bg-surface-3 hover:text-foreground")}
      >
        This is you
      </Link>
    );
  }

  let body: React.ReactNode = null;
  if (profile.friendshipStatus === "accepted") {
    body = (
      <button
        type="button"
        onClick={() => void run(() => removeFriend(profile.username))}
        disabled={busy}
        className={cn(actionButtonClass, "border border-line-2/70 text-ink-2 hover:bg-surface-3 hover:text-foreground")}
      >
        {busy ? <Loader2 className="size-3.5 animate-spin" /> : <UserMinus className="size-3.5" />}
        Remove friend
      </button>
    );
  } else if (profile.friendshipStatus === "pending_sent") {
    body = (
      <button
        type="button"
        onClick={() => void run(() => removeFriend(profile.username))}
        disabled={busy}
        className={cn(actionButtonClass, "border border-line-2/70 text-ink-2 hover:bg-surface-3 hover:text-foreground")}
      >
        {busy ? <Loader2 className="size-3.5 animate-spin" /> : <X className="size-3.5" />}
        Cancel request
      </button>
    );
  } else if (profile.friendshipStatus === "pending_received") {
    body = (
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => incomingId !== null && void run(() => respondToRequest(incomingId, "accept"))}
          disabled={busy || incomingId === null}
          className={cn(actionButtonClass, "bg-foreground text-background")}
        >
          {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
          Accept
        </button>
        <button
          type="button"
          onClick={() => incomingId !== null && void run(() => respondToRequest(incomingId, "decline"))}
          disabled={busy || incomingId === null}
          className={cn(actionButtonClass, "border border-line-2/70 text-ink-2 hover:bg-surface-3 hover:text-foreground")}
        >
          <X className="size-3.5" />
          Decline
        </button>
      </div>
    );
  } else {
    body = (
      <button
        type="button"
        onClick={() => void run(() => sendFriendRequestByUsername(profile.username))}
        disabled={busy}
        className={cn(actionButtonClass, "bg-foreground text-background")}
      >
        {busy ? <Loader2 className="size-3.5 animate-spin" /> : <UserPlus className="size-3.5" />}
        Add friend
      </button>
    );
  }

  return (
    <div>
      {body}
      {message && <p className="mt-2 text-[12px] text-[#C4533C] dark:text-[#D9705A]">{message}</p>}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <p className="font-serif text-[26px] leading-none tracking-[-0.01em] text-foreground">{value}</p>
      <p className="mt-2 font-mono text-[9px] tracking-[0.14em] text-ink-3 uppercase">{label}</p>
    </div>
  );
}

function UserListVisibilityBadge({ list }: { list: UserList }) {
  const visibility =
    list.visibility === "public" || list.visibility === "friends" || list.visibility === "private"
      ? list.visibility
      : list.isPublic === false
        ? "private"
        : "public";
  const Icon = visibility === "friends" ? Users : visibility === "private" ? Lock : Globe;

  return (
    <span className="flex shrink-0 items-center gap-1 rounded-full border border-line bg-background px-2 py-0.5 text-[8.5px] font-mono tracking-[0.14em] text-ink-3 uppercase">
      <Icon className="size-3" strokeWidth={2} />
      {visibility === "friends" ? "Friends" : visibility === "private" ? "Private" : "Public"}
    </span>
  );
}

function UserListCard({ list }: { list: UserList }) {
  return (
    <article className="rounded-xl border border-line bg-surface-2 p-4">
      <div className="flex items-start justify-between gap-2">
        <h3 className="min-w-0 truncate text-[15px] leading-tight font-semibold text-foreground">
          {list.name}
        </h3>
        <UserListVisibilityBadge list={list} />
      </div>

      {list.description ? (
        <p className="mt-1.5 line-clamp-2 text-[12.5px] leading-relaxed text-ink-2">
          {list.description}
        </p>
      ) : null}

      <div className="mt-4 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5" aria-hidden="true">
          {(list.previewCoverImages ?? []).length > 0 ? (
            (list.previewCoverImages ?? []).slice(0, 4).map((cover, index) => (
              <div
                key={index}
                className="relative size-8 shrink-0 overflow-hidden rounded-md border border-line"
              >
                <Image src={cover} alt="" fill loader={thumbnailImageLoader} sizes="32px" className="object-cover" />
              </div>
            ))
          ) : (
            [0, 1].map((index) => (
              <span key={index} className="size-8 shrink-0 rounded-md border border-line bg-surface-3" />
            ))
          )}
        </div>
        <span className="shrink-0 text-[10px] font-mono tracking-[0.1em] text-ink-3 uppercase">
          {list.itemCount} {list.itemCount === 1 ? "item" : "items"}
        </span>
      </div>
    </article>
  );
}

function UserListsCard({ username, lists }: { username: string; lists: UserList[] | null }) {
  return (
    <article className="rounded-xl border border-line bg-surface-2 p-5 sm:p-6">
      <div className="flex items-center gap-3">
        <span className="text-[10px] font-mono tracking-[0.18em] text-ink-3 uppercase">
          Lists
        </span>
        <span aria-hidden="true" className="h-px flex-1 bg-line" />
      </div>

      <div className="mt-5 space-y-4">
        {lists === null ? (
          <>
            <div className="h-24 animate-pulse rounded-xl bg-surface-3" aria-hidden="true" />
            <div className="h-24 animate-pulse rounded-xl bg-surface-3" aria-hidden="true" />
          </>
        ) : lists.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-10 text-center">
            <span className="text-[9px] font-mono tracking-[0.16em] text-ink-3 uppercase">
              No lists yet
            </span>
            <p className="mt-2 max-w-sm text-[13px] leading-relaxed text-ink-2">
              {username} hasn&rsquo;t shared any lists.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {lists.map((list) => <UserListCard key={list.id} list={list} />)}
          </div>
        )}
      </div>
    </article>
  );
}

function UserActivityCard({ days }: { days: ActivityDay[] | null }) {
  const todayKey = dayKeyOf(new Date());
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = dayKeyOf(yesterday);

  const rows = days ?? [];
  const totalAdded = rows.reduce((sum, day) => sum + day.added, 0);
  const totalCompleted = rows.reduce((sum, day) => sum + day.completed, 0);
  const visible = rows.slice(0, 14);
  const hidden = rows.length - visible.length;

  return (
    <article className="rounded-xl border border-line bg-surface-2 p-5 sm:p-6">
      <SectionLabel>
        {days !== null && (totalAdded + totalCompleted) > 0
          ? "Recent activity — last 30 days"
          : "Recent activity"}
      </SectionLabel>

      {days === null ? (
        <div aria-hidden="true" className="mt-5">
          {[0, 1, 2, 3, 4].map((index) => (
            <div key={index} className="flex items-center justify-between border-b border-line py-2.5 last:border-0">
              <span className="h-3 w-20 rounded-full bg-surface-3" />
              <span className="h-3 w-16 rounded-full bg-surface-3" />
            </div>
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="mt-8 flex flex-col items-center px-2 py-8 text-center">
          <span className="text-[9px] font-mono tracking-[0.16em] text-ink-3 uppercase">
            No activity yet
          </span>
        </div>
      ) : (
        <>
          <ul className="mt-2">
            {visible.map((day, index) => (
              <li key={`${day.date}-${index}`} className="flex items-center justify-between gap-3 border-b border-line py-2.5 last:border-0">
                <span className="min-w-0 truncate text-[12.5px] text-ink-2">
                  {dayLabel(day.date, todayKey, yesterdayKey)}
                </span>
                <span className="flex shrink-0 items-center gap-3">
                  {day.added > 0 && (
                    <span className="text-[11px] font-mono tracking-[0.04em] text-accent">
                      +{day.added}
                    </span>
                  )}
                  {day.completed > 0 && (
                    <span className="text-[11px] font-mono tracking-[0.04em] text-foreground">
                      {day.completed} done
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>

          {hidden > 0 && (
            <p className="pt-2.5 text-[10px] font-mono tracking-[0.1em] text-ink-3 uppercase">
              +{hidden} more days
            </p>
          )}

          <div className="mt-4 grid grid-cols-2 gap-4 border-t border-line pt-4">
            <div>
              <p className="font-serif text-[24px] leading-none tracking-[-0.01em] text-foreground">
                {totalAdded}
              </p>
              <p className="mt-1.5 text-[9px] font-mono tracking-[0.14em] text-ink-3 uppercase">
                Added
              </p>
            </div>
            <div>
              <p className="font-serif text-[24px] leading-none tracking-[-0.01em] text-foreground">
                {totalCompleted}
              </p>
              <p className="mt-1.5 text-[9px] font-mono tracking-[0.14em] text-ink-3 uppercase">
                Completed
              </p>
            </div>
          </div>
        </>
      )}
    </article>
  );
}

export function UserProfileSkeleton() {
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

export default function UserProfileView({ username }: { username: string }) {
  const { user, loading } = useCurrentUser();
  const [profile, setProfile] = useState<PublicProfileDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<FavoriteCell[] | null>(null);
  const [lists, setLists] = useState<UserList[] | null>(null);
  const [days, setDays] = useState<ActivityDay[] | null>(null);
  const [mutualFriends, setMutualFriends] = useState<FriendDto[] | null>(null);

  const reload = useCallback(async () => {
    const { profile: data, error: message } = await fetchPublicProfile(username);
    if (data) {
      setProfile(data);
      setError(null);
    } else {
      setProfile(null);
      setError(message ?? "Couldn't load this profile.");
    }
  }, [username]);

  useEffect(() => {
    if (loading || !user) return;
    const handle = setTimeout(() => void reload(), 0);
    return () => clearTimeout(handle);
  }, [loading, user, reload]);

  const visible = profile !== null && profile.counts != null;

  useEffect(() => {
    if (!visible || !profile) return;
    let cancelled = false;
    const handle = setTimeout(() => {
      const name = profile.username;
      void fetchUserLibrary(name).then((data) => {
        if (cancelled) return;
        const cells = (Array.isArray(data?.items) ? data.items : [])
          .filter((entry) => entry.isFavorite && entry.media?.title?.trim())
          .map((entry) => ({
            mediaId: entry.mediaId,
            title: entry.media!.title!.trim(),
            year: entry.media!.year ?? undefined,
            type: asMediaType(entry.media!.mediaType),
            image: entry.media!.coverImage || undefined,
          }));
        setFavorites(cells);
      });
      void fetchUserLists(name).then((data) => {
        if (!cancelled) setLists(Array.isArray(data?.items) ? data.items : []);
      });
      void fetchUserActivity(name).then((data) => {
        if (!cancelled) {
          setDays(
            Array.isArray(data?.dailySummaries)
              ? data.dailySummaries.map((day) => ({ date: day.date, added: day.added, completed: day.completed }))
              : [],
          );
        }
      });
      void fetchUserFriends(name).then((data) => {
        if (cancelled) return;
        const theirs = Array.isArray(data) ? data : [];
        // Their list includes you — intersect with your own friends so this
        // reads as mutual friends instead of stating the obvious.
        void fetchFriends().then((mine) => {
          if (cancelled) return;
          const mineIds = new Set((mine ?? []).map((friend) => friend.userId));
          setMutualFriends(theirs.filter((friend) => mineIds.has(friend.userId)));
        });
      });
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [visible, profile]);

  if (loading) {
    return <UserProfileSkeleton />;
  }

  if (user === null) {
    return (
      <div className="mx-auto flex w-full max-w-[1160px] flex-col items-center px-5 py-24 text-center sm:px-8">
        <span className="font-mono text-[9px] tracking-[0.16em] text-ink-3 uppercase">
          Profile
        </span>
        <h1 className="mt-4 font-serif text-[26px] leading-tight text-foreground">
          Sign in to see this profile.
        </h1>
        <ButtonLink href="/login" variant="secondary" size="sm" className="mt-6">
          Sign in
        </ButtonLink>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1160px] px-5 py-8 sm:px-8 sm:py-10">
      {error && (
        <p className="rounded-xl border border-line bg-surface-2/60 p-5 text-center text-[13px] text-ink-2">
          {error}{" "}
          <Link href="/friends" className="text-accent hover:underline">
            Find friends
          </Link>
        </p>
      )}

      {profile && (
        <article className="rounded-xl border border-line bg-surface-2 p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-5">
            <UserAvatar
              username={profile.username}
              avatarId={profile.avatarId}
              className="size-14 rounded-full bg-accent-soft text-[22px] font-semibold text-accent sm:size-16 sm:text-[26px]"
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <h1 className="min-w-0 truncate font-serif text-[clamp(24px,3.5vw,36px)] leading-[1.05] tracking-[-0.01em] text-foreground">
                  {profile.username}
                </h1>
                {profile.isPrivate && (
                  <span className="flex shrink-0 items-center gap-1 rounded-full border border-line bg-background px-2.5 py-1 font-mono text-[9px] tracking-[0.14em] text-ink-3 uppercase">
                    <Lock className="size-3" strokeWidth={2} />
                    Private
                  </span>
                )}
              </div>
              {profile.bio && (
                <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-ink-2 break-words">{profile.bio}</p>
              )}
              <div className="mt-3">
                <FriendAction profile={profile} onChanged={() => void reload()} />
              </div>
              {profile.isPrivate && !profile.counts && (
                <p className="mt-3 flex items-start gap-1.5 text-[12px] leading-relaxed text-ink-3">
                  <Lock className="mt-0.5 size-3 shrink-0" strokeWidth={2} aria-hidden="true" />
                  <span>
                    This account is private. Add {profile.username} as a friend to see their
                    favorites, lists and activity.
                  </span>
                </p>
              )}
            </div>
            {profile.counts && (
              <div className="hidden shrink-0 items-center gap-6 sm:flex" aria-label="Profile statistics">
                <Stat label="Library" value={profile.counts.totalLibraryItems} />
                <Stat label="Completed" value={profile.counts.completedItems} />
                <Stat label="In progress" value={profile.counts.inProgressItems} />
                <Stat label="Favorites" value={profile.counts.favoritesCount} />
              </div>
            )}
          </div>
          {profile.counts && (
            <div className="mt-5 grid w-full grid-cols-4 gap-x-6 sm:hidden" aria-label="Profile statistics">
              <Stat label="Library" value={profile.counts.totalLibraryItems} />
              <Stat label="Completed" value={profile.counts.completedItems} />
              <Stat label="In progress" value={profile.counts.inProgressItems} />
              <Stat label="Favorites" value={profile.counts.favoritesCount} />
            </div>
          )}
        </article>
      )}

      {visible && (
        <>
          <section className="mt-10" aria-label="Favorites">
            <SectionLabel>Favorites</SectionLabel>
            <div className="mt-5">
              {favorites === null ? (
                <div className="grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-5 lg:grid-cols-8" aria-hidden="true">
                  {[0, 1, 2, 3, 4, 5, 6, 7].map((index) => (
                    <CellSkeleton key={index} />
                  ))}
                </div>
              ) : favorites.length === 0 ? (
                <div className="flex flex-col items-center rounded-xl border border-line bg-surface-2 px-6 py-10 text-center">
                  <span className="grid size-9 place-items-center rounded-full bg-surface-3 text-ink-3">
                    <Heart className="size-4" strokeWidth={1.75} />
                  </span>
                  <span className="mt-3 font-mono text-[9px] tracking-[0.16em] text-ink-3 uppercase">
                    No favorites yet
                  </span>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-5 lg:grid-cols-8">
                  {favorites.map((item) => (
                    <div key={item.mediaId} className="flex flex-col items-center gap-2">
                      <MediaAvatarCard title={item.title} year={item.year} image={item.image} type={item.type} size="fluid" />
                      <span className="w-full truncate text-center text-[11px] leading-tight text-ink-2">
                        {item.title}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <div role="separator" aria-hidden="true" className="my-9 h-px w-full bg-line" />

          <section className="grid gap-4 lg:grid-cols-[1.45fr_1fr]">
            <UserListsCard username={profile.username} lists={lists} />
            <UserActivityCard days={days} />
          </section>

          <section className="mt-10" aria-label="Mutual friends">
            <SectionLabel>Mutual friends</SectionLabel>
            <div className="mt-5">
              {mutualFriends === null ? (
                <div className="h-16 animate-pulse rounded-xl bg-surface-3" aria-hidden="true" />
              ) : mutualFriends.length === 0 ? (
                <p className="text-[13px] text-ink-3">No mutual friends yet.</p>
              ) : (
                <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                  {mutualFriends.slice(0, 12).map((friend) => (
                    <li key={friend.userId}>
                      <Link
                        href={profileHref(friend)}
                        className="flex items-center gap-2.5 rounded-xl border border-line bg-surface-2 px-3 py-2.5 transition-colors hover:bg-surface-3"
                      >
                        <UserAvatar username={friend.username} avatarId={friend.avatarId} className="size-8 rounded-full bg-accent-soft text-[13px] font-semibold text-accent" />
                        <span className="min-w-0 truncate text-[13px] font-medium text-foreground">{friend.username}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
