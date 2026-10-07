"use client";

import { useCallback, useEffect, useState } from "react";

import SectionLabel from "@/app/features/home/section-label";
import { Skeleton } from "@/app/components/ui/skeleton";
import { authFetch } from "@/lib/api/client";
import { useCurrentUser } from "@/lib/use-current-user";
import { cn } from "@/lib/utils";

type Friend = {
  userId: number;
  username: string;
  friendsSince: string;
};

async function loadFriends(): Promise<Friend[]> {
  const response = await authFetch("/api/friends", { cache: "no-store" });
  if (!response.ok) throw new Error("load failed");

  const data: unknown = await response.json();
  if (!Array.isArray(data)) throw new Error("load failed");

  return (data as Friend[]).filter(
    (friend) => friend && typeof friend.username === "string",
  );
}

function relativeTime(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days < 1) return "today";
  if (days < 7) return `${days}d`;
  if (days < 30) return `${Math.floor(days / 7)}w`;
  if (days < 365) return `${Math.floor(days / 30)}mo`;
  return `${Math.floor(days / 365)}y`;
}

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
        Add friends and their recent activity will show up here.
      </p>
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
  const [friends, setFriends] = useState<Friend[] | null>(null);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    try {
      setFriends(await loadFriends());
      setError(false);
    } catch {
      setFriends(null);
      setError(true);
    }
  }, []);

  useEffect(() => {
    if (loading || user === null) return;

    let cancelled = false;

    (async () => {
      try {
        const next = await loadFriends();
        if (cancelled) return;
        setFriends(next);
        setError(false);
      } catch {
        if (cancelled) return;
        setError(true);
      }
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

      {friends === null ? (
        <FriendsSkeleton />
      ) : friends.length === 0 ? (
        <FriendsEmptyState />
      ) : (
        <ul className="mt-4 flex flex-1 flex-col">
          {friends.map((friend) => (
            <li
              key={friend.userId}
              className="flex items-center gap-3 border-b border-line/60 py-3 last:border-b-0"
            >
              <span
                aria-hidden="true"
                className="grid size-8 shrink-0 place-items-center rounded-full bg-surface-3 text-[11px] font-semibold text-ink-2"
              >
                {friend.username.charAt(0)}
              </span>

              <p className="min-w-0 flex-1 truncate text-[13px] leading-tight text-ink-2">
                <span className="font-semibold text-foreground">{friend.username}</span>{" "}
                <span className="text-ink-3">
                  friends since {relativeTime(friend.friendsSince)}
                </span>
              </p>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
