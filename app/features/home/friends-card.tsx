"use client";

import Link from "next/link";
import { MoonStar } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import SectionLabel from "@/app/features/home/section-label";
import UserAvatar from "@/app/components/user-avatar";
import { Skeleton } from "@/app/components/ui/skeleton";
import {
  fetchFriends,
  fetchFriendsActivity,
  profileHref,
  type FriendActivityDto,
  type FriendDto,
} from "@/lib/api/friends";
import { useCurrentUser } from "@/lib/use-current-user";
import { cn } from "@/lib/utils";

function FriendsEmptyState() {
  return (
    <div className="mt-4 flex flex-1 flex-col items-center justify-center px-2 py-8 text-center">
      <span className="text-[9px] font-mono tracking-[0.16em] text-ink-3 uppercase">
        No friends yet
      </span>
      <h3 className="mt-3 font-serif text-xl leading-tight text-foreground">
        No activity to show.
      </h3>
      <p className="mt-2 max-w-xs text-[13px] leading-relaxed text-ink-2">
        <Link href="/friends" className="text-accent hover:underline">
          Add friends
        </Link>{" "}
        and their recent activity will show up here.
      </p>
    </div>
  );
}

function FriendsQuietState({ friends }: { friends: FriendDto[] }) {
  const preview = friends.slice(0, 5);
  const extra = friends.length - preview.length;
  const only = friends.length === 1 ? friends[0] : null;

  return (
    <div className="mt-4 flex flex-1 flex-col items-center justify-center px-2 py-8 text-center">
      <div className="relative">
        <div className="flex -space-x-2.5">
          {preview.map((friend) => (
            <UserAvatar
              key={friend.friendshipId}
              username={friend.username}
              avatarId={friend.avatarId}
              className="size-9 rounded-full bg-surface-3 text-[11px] font-semibold text-ink-2 ring-2 ring-surface-2"
            />
          ))}
          {extra > 0 ? (
            <span
              aria-hidden="true"
              className="grid size-9 shrink-0 place-items-center rounded-full bg-surface-3 text-[11px] font-semibold text-ink-2 ring-2 ring-surface-2"
            >
              +{extra}
            </span>
          ) : null}
        </div>
        <span
          aria-hidden="true"
          className="absolute -right-2 -bottom-2 grid size-7 place-items-center rounded-full border border-line bg-surface-3 text-ink-2"
        >
          <MoonStar className="size-3.5" />
        </span>
      </div>

      <span className="mt-5 text-[9px] font-mono tracking-[0.16em] text-ink-3 uppercase">
        {friends.length === 1 ? "1 friend" : `${friends.length} friends`}
      </span>
      <h3 className="mt-3 font-serif text-xl leading-tight text-foreground">
        {only ? `${only.username} is quiet — for now.` : "Quiet — for now."}
      </h3>
      <p className="mt-2 max-w-xs text-[13px] leading-relaxed text-ink-2">
        {only ? (
          <>
            Nothing new from {only.username} lately. Log something — it&rsquo;ll
            show up in their feed too.
          </>
        ) : (
          <>
            Nobody&rsquo;s logged anything lately. Be the first — your update
            will show up in their feeds.
          </>
        )}
      </p>
      <Link
        href="/friends"
        className={cn(
          "mt-4 inline-flex items-center gap-1.5 rounded-full border border-line-2/70 px-3.5 py-1.5 text-[11px] font-mono tracking-[0.08em] text-ink-2 uppercase",
          "transition-colors duration-150 motion-reduce:transition-none",
          "hover:bg-surface-3 hover:text-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
        )}
      >
        View friends
      </Link>
    </div>
  );
}

export function FriendsSkeleton() {
  return (
    <ul aria-hidden="true" className="mt-4 flex flex-1 flex-col">
      {[0, 1, 2, 3].map((index) => (
        <li key={index} className="flex items-center gap-3 border-b border-line/60 py-3 last:border-b-0">
          <Skeleton className="size-8 shrink-0 rounded-full" />
          <Skeleton className="h-3 w-3/4 rounded-full" />
          <Skeleton className="h-2.5 w-6 rounded-full" />
        </li>
      ))}
    </ul>
  );
}

export default function FriendsCard() {
  const { user, loading } = useCurrentUser();
  const [friends, setFriends] = useState<FriendDto[] | null>(null);
  const [activity, setActivity] = useState<FriendActivityDto[] | null>(null);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    const [f, a] = await Promise.all([fetchFriends(), fetchFriendsActivity(1, 10)]);
    if (f === null || a === null) {
      setFriends(null);
      setActivity(null);
      setError(true);
      return;
    }
    setFriends(f);
    setActivity(a);
    setError(false);
  }, []);

  useEffect(() => {
    if (loading || user === null) return;

    let cancelled = false;

    (async () => {
      const [f, a] = await Promise.all([fetchFriends(), fetchFriendsActivity(1, 10)]);
      if (cancelled) return;
      if (f === null || a === null) {
        setError(true);
        return;
      }
      setFriends(f);
      setActivity(a);
      setError(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [user, loading]);

  if (error) {
    return (
      <article className="flex flex-col rounded-xl border border-line bg-surface-2 p-5 sm:p-6">
        <SectionLabel>Friends</SectionLabel>
        <div className="mt-4 flex flex-1 flex-col items-center justify-center gap-3 px-2 py-8 text-center">
          <p className="text-[13px] text-ink-2">Couldn&rsquo;t load your friends.</p>
          <button
            type="button"
            onClick={() => void load()}
            className={cn(
              "rounded-md border border-line-2/70 px-3 py-1.5 text-[11px] font-mono tracking-[0.08em] text-ink-2 uppercase",
              "transition-colors duration-150 motion-reduce:transition-none",
              "hover:bg-surface-3 hover:text-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
            )}
          >
            Try again
          </button>
        </div>
      </article>
    );
  }

  return (
    <article className="flex flex-col rounded-xl border border-line bg-surface-2 p-5 sm:p-6">
      <SectionLabel>Friends</SectionLabel>

      {friends === null || activity === null ? (
        <FriendsSkeleton />
      ) : friends.length === 0 ? (
        <FriendsEmptyState />
      ) : activity.length === 0 ? (
        <FriendsQuietState friends={friends} />
      ) : (
        <ul className="mt-4 flex flex-1 flex-col">
          {activity.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-3 border-b border-line/60 py-3 last:border-b-0"
            >
              <Link
                href={profileHref(item)}
                aria-label={`${item.username}'s profile`}
                className="shrink-0"
              >
                <UserAvatar
                  username={item.username}
                  avatarId={item.avatarId}
                  className="size-8 rounded-full bg-surface-3 text-[11px] font-semibold text-ink-2"
                />
              </Link>
              <p className="min-w-0 flex-1 truncate text-[13px] leading-tight text-ink-2">
                <Link
                  href={profileHref(item)}
                  className="font-semibold text-foreground hover:underline"
                >
                  {item.username}
                </Link>{" "}
                {item.formattedText}
              </p>
              <span className="shrink-0 font-mono text-[10px] tracking-[0.08em] text-ink-3 uppercase">
                {item.timeAgo}
              </span>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
