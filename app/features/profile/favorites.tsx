"use client";

import { Heart } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import MediaAvatarCard, { type MediaType } from "@/app/components/media-avatar-card";
import { Skeleton } from "@/app/components/ui/skeleton";
import { authFetch } from "@/lib/api/client";
import { useCurrentUser } from "@/lib/use-current-user";
import { cn } from "@/lib/utils";

const MEDIA_TYPES = new Set<MediaType>(["movie", "series", "game", "anime", "manga"]);

type FavoriteMedia = {
  title?: string;
  mediaType?: string;
  coverImage?: string | null;
  year?: number | null;
};

type FavoriteEntry = {
  mediaId: number;
  media?: FavoriteMedia | null;
};

type FavoriteItem = {
  mediaId: number;
  title: string;
  year?: number;
  type: MediaType;
  image?: string;
};

function asMediaType(value: string | undefined): MediaType {
  return value && MEDIA_TYPES.has(value as MediaType)
    ? (value as MediaType)
    : "movie";
}

function mapEntry(entry: FavoriteEntry): FavoriteItem | null {
  if (!entry.media) return null;
  const type = asMediaType(entry.media.mediaType);
  const title = entry.media.title?.trim();
  if (!title) return null;

  return {
    mediaId: entry.mediaId,
    title,
    year: entry.media.year ?? undefined,
    type,
    image: entry.media.coverImage || undefined,
  };
}

async function fetchFavorites(): Promise<FavoriteItem[]> {
  const response = await authFetch("/api/profile/favorites", { cache: "no-store" });
  if (!response.ok) throw new Error("load failed");

  const data = (await response.json()) as { items?: FavoriteEntry[] };
  const entries = Array.isArray(data.items) ? data.items : [];
  return entries.map(mapEntry).filter((item): item is FavoriteItem => item !== null);
}

// Single-flight: concurrent mounts (StrictMode's double mount in dev, or a
// rapid re-mount) reuse the in-flight promise instead of firing twice.
let inFlightFavorites: Promise<FavoriteItem[]> | null = null;

function fetchFavoritesOnce(): Promise<FavoriteItem[]> {
  if (!inFlightFavorites) {
    inFlightFavorites = fetchFavorites().finally(() => {
      inFlightFavorites = null;
    });
  }
  return inFlightFavorites;
}

function CardCell({
  title,
  year,
  type,
  image,
}: {
  title: string;
  year?: number;
  type: MediaType;
  image?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <MediaAvatarCard title={title} year={year} image={image} type={type} size="fluid" />
      <span className="w-full truncate text-center text-[11px] leading-tight text-ink-2">
        {title}
      </span>
    </div>
  );
}

export function CellSkeleton() {
  return (
    <div aria-hidden="true" className="flex flex-col items-center gap-2">
      <Skeleton className="aspect-[42/54] w-full rounded-lg" />
      <Skeleton className="h-2.5 w-3/4 rounded-full" />
    </div>
  );
}

export function FavoritesSkeleton() {
  return (
    <div aria-hidden="true" className="grid grid-cols-3 gap-3 sm:grid-cols-6 sm:gap-4">
      {([0, 1, 2, 3, 4, 5] as const).map((index) => (
        <CellSkeleton key={index} />
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center rounded-xl border border-line bg-surface-2 px-6 py-10 text-center">
      <span className="grid size-9 place-items-center rounded-full bg-surface-3 text-ink-3">
        <Heart className="size-4" strokeWidth={1.75} />
      </span>
      <span className="mt-3 text-[9px] font-mono tracking-[0.16em] text-ink-3 uppercase">
        No favorites yet
      </span>
      <p className="mt-2 max-w-sm text-[13px] leading-relaxed text-ink-2">
        Mark titles as favorites in your library and they will collect here.
      </p>
    </div>
  );
}

export default function Favorites({ className }: { className?: string }) {
  const { user, loading } = useCurrentUser();
  const [items, setItems] = useState<FavoriteItem[] | null>(null);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    try {
      setItems(await fetchFavoritesOnce());
      setError(false);
    } catch {
      setItems(null);
      setError(true);
    }
  }, []);

  useEffect(() => {
    if (loading || user === null) return;

    let cancelled = false;

    (async () => {
      try {
        const data = await fetchFavoritesOnce();
        if (cancelled) return;
        setItems(data);
        setError(false);
      } catch {
        if (cancelled) return;
        setItems(null);
        setError(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, loading]);

  if (error) {
    return (
      <div
        className={cn(
          "flex flex-col items-center gap-4 rounded-xl border border-line bg-surface-2 px-6 py-10 text-center",
          className,
        )}
      >
        <p className="text-[13px] text-ink-2">Couldn&rsquo;t load your favorites.</p>
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
    );
  }

  if (items === null) {
    return (
      <div className={cn("grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-5 lg:grid-cols-8", className)}>
        {[0, 1, 2, 3, 4, 5, 6, 7].map((index) => (
          <CellSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return <div className={className}>
      <EmptyState />
    </div>;
  }

  return (
    <div
      className={cn("grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-5 lg:grid-cols-8", className)}
    >
      {items.map((item) => (
        <CardCell
          key={item.mediaId}
          title={item.title}
          year={item.year}
          type={item.type}
          image={item.image}
        />
      ))}
    </div>
  );
}
