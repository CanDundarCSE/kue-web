"use client";

import { ArrowRight, Check, Loader2, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import MediaAvatarCard, { type MediaType } from "@/app/components/media-avatar-card";
import SectionLabel from "@/app/features/home/section-label";
import { authFetch } from "@/lib/api/client";
import { addToLibraryFromDiscover, fetchDiscover } from "@/lib/api/discover";
import { fetchSimilarMedia, type MediaDto } from "@/lib/api/media";
import type { SearchMedia } from "@/lib/search";
import { useCurrentUser } from "@/lib/use-current-user";
import { cn } from "@/lib/utils";

const MEDIA_TYPES = new Set<MediaType>(["movie", "series", "game", "anime", "manga"]);

function asMediaType(value: string): MediaType {
  return MEDIA_TYPES.has(value as MediaType) ? (value as MediaType) : "movie";
}

function mediaTypeLabel(value: string): string {
  switch (value) {
    case "anime":
      return "Anime";
    case "series":
      return "Series";
    case "manga":
      return "Manga";
    case "game":
      return "Game";
    default:
      return "Film";
  }
}

function buildSubtitle(media: SearchMedia): string {
  const parts: string[] = [mediaTypeLabel(media.mediaType)];
  if (media.year !== null && media.year !== undefined) parts.push(String(media.year));
  if (media.score !== null && media.score !== undefined) parts.push(String(media.score));
  return parts.join(" · ").toUpperCase();
}

function consumeVerb(mediaType: string): string {
  switch (asMediaType(mediaType)) {
    case "game":
      return "played";
    case "manga":
      return "read";
    default:
      return "watched";
  }
}

function toSearchMedia(m: MediaDto): SearchMedia {
  return {
    id: m.id,
    mediaType: m.mediaType,
    title: m.title,
    year: m.year ?? null,
    score: m.score ?? null,
    coverImage: m.coverImage ?? null,
    description: m.description ?? null,
    externalSource: m.externalSource ?? null,
    externalId: m.externalId ?? null,
  };
}

type Spotlight = {
  items: SearchMedia[];
  kicker: string;
  title: string;
};

// Personalized first (similar to the most recently touched in-progress
// title), trending as the fallback so logged-out and brand-new users still
// get a useful rail. Both sources return cover-ready payloads.
async function loadSpotlight(isLoggedIn: boolean): Promise<Spotlight> {
  if (isLoggedIn) {
    try {
      const response = await authFetch("/api/library/continue", { cache: "no-store" });
      if (response.ok) {
        const data: unknown = await response.json().catch(() => null);
        const entries = (
          Array.isArray(data)
            ? data
            : []
        ) as {
          mediaId?: number;
          mediaType?: string;
          media?: { title?: string; mediaType?: string };
        }[];
        const seed = entries.find(
          (entry) => typeof entry.mediaId === "number" && entry.mediaId > 0,
        );
        if (seed?.mediaId) {
          const similar = await fetchSimilarMedia({ id: seed.mediaId, pageSize: 6 });
          const items = similar
            .filter((m) => m.id !== seed.mediaId)
            .slice(0, 5)
            .map(toSearchMedia);
          if (items.length > 0) {
            const seedType = seed.media?.mediaType ?? seed.mediaType ?? "movie";
            return {
              items,
              kicker: "For you",
              title: `Because you ${consumeVerb(seedType)} ${seed.media?.title ?? "this"}.`,
            };
          }
        }
      }
    } catch {
      // Fall through to trending below.
    }
  }

  const discover = await fetchDiscover();
  return {
    items: discover.trending.slice(0, 5),
    kicker: "Trending",
    title: "Trending now.",
  };
}

type AddState = "idle" | "loading" | "done" | "error";

function AddButton({ media }: { media: SearchMedia }) {
  const [state, setState] = useState<AddState>("idle");

  const handleAdd = async () => {
    if (state !== "idle") return;
    setState("loading");

    const ok = await addToLibraryFromDiscover(media);
    if (ok) {
      setState("done");
    } else {
      setState("error");
      setTimeout(() => setState("idle"), 2000);
    }
  };

  return (
    <button
      type="button"
      aria-label={
        state === "done" ? `${media.title} added to library` : `Add ${media.title} to library`
      }
      disabled={state === "loading" || state === "done"}
      onClick={handleAdd}
      className={cn(
        "grid size-8 shrink-0 place-items-center rounded-lg border transition-colors duration-150 motion-reduce:transition-none",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
        state === "done"
          ? "border-transparent bg-transparent text-accent"
          : state === "error"
            ? "border-red-400/50 text-red-400"
            : "border-line-2/70 text-ink-2 hover:bg-surface-3 hover:text-foreground",
        "disabled:pointer-events-none",
      )}
    >
      {state === "loading" ? (
        <Loader2 className="size-4 animate-spin" strokeWidth={2} />
      ) : state === "done" ? (
        <Check className="size-4" strokeWidth={2.5} />
      ) : (
        <Plus className="size-4" strokeWidth={2} />
      )}
    </button>
  );
}

function mediaHref(media: SearchMedia): string {
  if (typeof media.id === "number" && media.id > 0) return `/media/${media.id}`;
  const params = new URLSearchParams();
  if (media.externalSource) params.set("source", media.externalSource);
  if (media.externalId) params.set("id", media.externalId);
  params.set("type", media.mediaType);
  return `/media/ext?${params.toString()}`;
}

function SpotlightRow({ media }: { media: SearchMedia }) {
  const router = useRouter();

  return (
    <li className="group flex items-center gap-4 border-b border-line/60 py-3 transition-colors last:border-b-0 hover:bg-surface-2/60">
      <button
        type="button"
        onClick={() => router.push(mediaHref(media))}
        className="flex min-w-0 flex-1 items-center gap-3.5 text-left focus-visible:outline-none"
      >
        <MediaAvatarCard
          title={media.title}
          year={media.year ?? undefined}
          image={media.coverImage ?? undefined}
          type={asMediaType(media.mediaType)}
          size="md"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] leading-snug font-semibold text-foreground transition-colors group-hover:text-accent">
            {media.title}
          </p>
          <p className="mt-1 text-[10px] font-mono tracking-[0.1em] text-ink-3 uppercase">
            <span
              className={cn(
                "mr-1.5 inline-block size-2 rounded-full",
                `bg-media-${asMediaType(media.mediaType)}`,
              )}
              aria-hidden="true"
            />
            {buildSubtitle(media)}
          </p>
        </div>
      </button>

      <AddButton media={media} />
    </li>
  );
}

function SpotlightEmptyState() {
  return (
    <div className="mt-4 flex flex-1 flex-col items-center justify-center px-2 py-8 text-center">
      <span className="text-[9px] font-mono tracking-[0.16em] text-ink-3 uppercase">
        Nothing to spotlight
      </span>
      <h3 className="mt-3 font-serif text-xl leading-tight text-foreground">
        No picks right now.
      </h3>
      <p className="mt-2 max-w-xs text-[13px] leading-relaxed text-ink-2">
        <Link href="/discover" className="text-accent hover:underline">
          Browse Discover
        </Link>{" "}
        and new picks will show up here.
      </p>
    </div>
  );
}

export function SpotlightSkeleton() {
  return (
    <article aria-hidden="true" className="rounded-xl border border-line bg-surface-2 p-5 sm:p-6">
      <SectionLabel>Spotlight</SectionLabel>
      <ul className="mt-4 flex flex-1 flex-col">
        {[0, 1, 2, 3, 4].map((index) => (
          <li key={index} className="flex items-center gap-3.5 border-b border-line/60 py-3 last:border-b-0">
            <div className="h-[54px] w-[42px] shrink-0 animate-pulse rounded-lg bg-surface-3" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-3.5 w-2/5 animate-pulse rounded-full bg-surface-3" />
              <div className="h-2.5 w-1/4 animate-pulse rounded-full bg-surface-3" />
            </div>
            <div className="size-8 shrink-0 animate-pulse rounded-lg bg-surface-3" />
          </li>
        ))}
      </ul>
    </article>
  );
}

export default function SpotlightCard() {
  const { user, loading } = useCurrentUser();
  const [spotlight, setSpotlight] = useState<Spotlight | null>(null);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    try {
      setSpotlight(await loadSpotlight(user !== null));
      setError(false);
    } catch {
      setSpotlight(null);
      setError(true);
    }
  }, [user]);

  // Deferred like the discover surface: setState calls must not run
  // synchronously in the effect body (react-hooks/set-state-in-effect).
  // Logged-out users skip the authed fetch and go straight to trending.
  useEffect(() => {
    if (loading) return;

    let cancelled = false;
    const handle = setTimeout(() => {
      if (cancelled) return;
      if (user === null) {
        void loadSpotlight(false).then(
          (next) => {
            if (!cancelled) setSpotlight(next);
          },
          () => {
            if (!cancelled) setError(true);
          },
        );
      } else {
        void load().catch(() => undefined);
      }
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [user, loading, load]);

  if (error) {
    return (
      <article className="flex flex-col rounded-xl border border-line bg-surface-2 p-5 sm:p-6">
        <SectionLabel>Spotlight</SectionLabel>
        <div className="mt-4 flex flex-1 flex-col items-center justify-center gap-3 px-2 py-8 text-center">
          <p className="text-[13px] text-ink-2">Couldn&rsquo;t load your picks.</p>
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
      <SectionLabel>Spotlight</SectionLabel>

      {spotlight === null ? (
        <ul aria-hidden="true" className="mt-4 flex flex-1 flex-col">
          {[0, 1, 2, 3, 4].map((index) => (
            <li key={index} className="flex items-center gap-3.5 border-b border-line/60 py-3 last:border-b-0">
              <div className="h-[54px] w-[42px] shrink-0 animate-pulse rounded-lg bg-surface-3" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-3.5 w-2/5 animate-pulse rounded-full bg-surface-3" />
                <div className="h-2.5 w-1/4 animate-pulse rounded-full bg-surface-3" />
              </div>
              <div className="size-8 shrink-0 animate-pulse rounded-lg bg-surface-3" />
            </li>
          ))}
        </ul>
      ) : spotlight.items.length === 0 ? (
        <SpotlightEmptyState />
      ) : (
        <>
          <span className="mt-4 text-[9px] font-mono tracking-[0.16em] text-ink-3 uppercase">
            {spotlight.kicker}
          </span>
          <h3 className="mt-3 font-serif text-xl leading-tight text-foreground">
            {spotlight.title}
          </h3>
          <ul className="mt-2 flex flex-1 flex-col">
            {spotlight.items.map((media, index) => (
              <SpotlightRow
                key={
                  typeof media.id === "number" && media.id > 0
                    ? `id:${media.id}`
                    : `ext:${media.externalSource}:${media.externalId}:${index}`
                }
                media={media}
              />
            ))}
          </ul>
          <Link
            href="/discover"
            className={cn(
              "mt-4 inline-flex items-center gap-1.5 self-start rounded-full border border-line-2/70 px-3.5 py-1.5 text-[11px] font-mono tracking-[0.08em] text-ink-2 uppercase",
              "transition-colors duration-150 motion-reduce:transition-none",
              "hover:bg-surface-3 hover:text-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
            )}
          >
            More in Discover
            <ArrowRight className="size-3.5" />
          </Link>
        </>
      )}
    </article>
  );
}
