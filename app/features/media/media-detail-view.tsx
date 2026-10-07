"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ExternalLink,
  Heart,
  Loader2,
  Minus,
  Plus,
  Share2,
} from "lucide-react";

import MediaAvatarCard, { type MediaType } from "@/app/components/media-avatar-card";
import {
  fetchMediaDetails,
  fetchExternalMedia,
  fetchSimilarMedia,
  fetchMediaLibraryEntry,
  saveMediaLibraryStatus,
  setMediaProgress,
  setMediaRating,
  addMediaToLibrary,
  type MediaDto,
} from "@/lib/api/media";
import type { LibraryEntryDto } from "@/lib/api/library";
import { useCurrentUser } from "@/lib/use-current-user";
import { cn } from "@/lib/utils";

// Strip HTML tags if external provider description contains <br>, <i>, etc.
function cleanDescription(raw?: string | null): string {
  if (!raw) return "";
  return raw.replace(/<[^>]*>?/gm, "").trim();
}

const MEDIA_TYPES = new Set<MediaType>(["movie", "series", "game", "anime", "manga"]);

function asMediaType(value?: string | null): MediaType {
  const normalized = (value || "").toLowerCase() as MediaType;
  return MEDIA_TYPES.has(normalized) ? normalized : "movie";
}

const MEDIA_DOT_COLOR: Record<MediaType, string> = {
  movie: "bg-[#C4533C] dark:bg-[#D9705A]",
  series: "bg-[#B98E2F] dark:bg-[#CFA544]",
  game: "bg-[#4E9066] dark:bg-[#5FAE7C]",
  anime: "bg-[#A85777] dark:bg-[#C4708F]",
  manga: "bg-[#47748F] dark:bg-[#5E93B0]",
};

function getMediaDotColorClass(type: string): string {
  const normalized = asMediaType(type);
  return MEDIA_DOT_COLOR[normalized];
}

function getInitials(title: string): string {
  const words = title.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "M";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

type StatusOption = {
  key: string;
  label: string;
};

function getStatusOptions(mediaType: string): StatusOption[] {
  const type = mediaType.toLowerCase();
  if (type === "manga") {
    return [
      { key: "planning", label: "Plan to read" },
      { key: "in_progress", label: "Reading" },
      { key: "completed", label: "Read" },
      { key: "on_hold", label: "On hold" },
      { key: "dropped", label: "Dropped" },
    ];
  }
  if (type === "game") {
    return [
      { key: "planning", label: "Plan to play" },
      { key: "in_progress", label: "Playing" },
      { key: "completed", label: "Completed" },
      { key: "on_hold", label: "On hold" },
      { key: "dropped", label: "Dropped" },
    ];
  }
  if (type === "movie") {
    return [
      { key: "planning", label: "Plan to watch" },
      { key: "completed", label: "Watched" },
      { key: "dropped", label: "Dropped" },
    ];
  }
  // anime, series
  return [
    { key: "planning", label: "Plan to watch" },
    { key: "in_progress", label: "Watching" },
    { key: "completed", label: "Watched" },
    { key: "on_hold", label: "On hold" },
    { key: "dropped", label: "Dropped" },
  ];
}

export default function MediaDetailView({
  mediaId,
  externalParams,
}: {
  mediaId?: number;
  externalParams?: { source: string; id: string; type: string };
}) {
  const router = useRouter();
  const { user } = useCurrentUser();

  const [media, setMedia] = useState<MediaDto | null>(null);
  const [similar, setSimilar] = useState<MediaDto[]>([]);
  const [entry, setEntry] = useState<LibraryEntryDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Load media, similar titles, and user library entry
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);

      let mediaData: MediaDto | null = null;
      let similarData: MediaDto[] = [];

      if (mediaId && mediaId > 0) {
        const [fetchedMedia, fetchedSimilar] = await Promise.all([
          fetchMediaDetails(mediaId),
          fetchSimilarMedia(mediaId),
        ]);
        mediaData = fetchedMedia;
        similarData = fetchedSimilar;
      } else if (externalParams?.source && externalParams?.id && externalParams?.type) {
        mediaData = await fetchExternalMedia(
          externalParams.source,
          externalParams.id,
          externalParams.type,
        );
        if (mediaData) {
          if (mediaData.id > 0) {
            similarData = await fetchSimilarMedia(mediaData.id);
          } else {
            similarData = await fetchSimilarMedia(null, mediaData.mediaType, mediaData.genres?.[0]);
          }
        }
      }

      if (cancelled) return;
      setMedia(mediaData);
      setSimilar(similarData);

      if (mediaData && mediaData.id > 0 && user) {
        const entryData = await fetchMediaLibraryEntry(mediaData.id);
        if (!cancelled) setEntry(entryData);
      } else {
        setEntry(null);
      }

      setLoading(false);
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [mediaId, externalParams?.source, externalParams?.id, externalParams?.type, user]);

  const handleStatusChange = async (newStatus: string) => {
    if (!user) {
      router.push("/login");
      return;
    }
    if (!media || updating) return;

    const isCompleted = newStatus === "completed";
    const targetProgress = isCompleted && media.totalUnits ? media.totalUnits : (entry?.progress ?? 0);

    setUpdating(true);
    try {
      if (entry && media.id > 0) {
        const updated = await saveMediaLibraryStatus(media.id, newStatus, {
          progress: targetProgress,
        });
        if (updated) {
          setEntry(updated);
        } else {
          setEntry((prev) =>
            prev ? { ...prev, status: newStatus, progress: targetProgress } : null,
          );
        }
      } else {
        const created = await addMediaToLibrary({
          mediaId: media.id > 0 ? media.id : undefined,
          mediaType: media.mediaType,
          externalSource: media.externalSource,
          externalId: media.externalId,
          status: newStatus,
          title: media.title,
          coverImage: media.coverImage,
          year: media.year,
          score: media.score,
          totalUnits: media.totalUnits,
          unitName: media.unitName,
          runtimeMinutes: media.runtimeMinutes,
          progress: targetProgress,
        });
        if (created) {
          setEntry({
            ...created,
            progress: targetProgress,
          });
          setMedia((prev) => (prev ? { ...prev, id: created.mediaId } : null));
          window.history.replaceState(null, "", `/media/${created.mediaId}`);
        }
      }
    } finally {
      setUpdating(false);
    }
  };

  const handleProgressChange = async (delta: number) => {
    if (!user) {
      router.push("/login");
      return;
    }
    if (!media || updating) return;

    const currentProgress = entry?.progress ?? 0;
    const maxUnits = media.totalUnits ?? 9999;
    const nextProgress = Math.max(0, Math.min(maxUnits, currentProgress + delta));

    if (nextProgress === currentProgress && entry) return;

    setUpdating(true);
    try {
      if (!entry || media.id <= 0) {
        const isFinished = media.totalUnits ? nextProgress >= media.totalUnits : false;
        const created = await addMediaToLibrary({
          mediaId: media.id > 0 ? media.id : undefined,
          mediaType: media.mediaType,
          externalSource: media.externalSource,
          externalId: media.externalId,
          status: isFinished ? "completed" : "in_progress",
          title: media.title,
          coverImage: media.coverImage,
          year: media.year,
          score: media.score,
          totalUnits: media.totalUnits,
          unitName: media.unitName,
          runtimeMinutes: media.runtimeMinutes,
          progress: nextProgress,
        });
        if (created) {
          setEntry(created);
          setMedia((prev) => (prev ? { ...prev, id: created.mediaId } : null));
          window.history.replaceState(null, "", `/media/${created.mediaId}`);
        }
      } else {
        const isFinished = media.totalUnits ? nextProgress >= media.totalUnits : false;
        await setMediaProgress(media.id, nextProgress);
        setEntry((prev) =>
          prev
            ? {
                ...prev,
                progress: nextProgress,
                status: isFinished ? "completed" : prev.status === "planning" ? "in_progress" : prev.status,
              }
            : null,
        );
      }
    } finally {
      setUpdating(false);
    }
  };

  const handleRatingClick = async (starIndex: number) => {
    if (!user) {
      router.push("/login");
      return;
    }
    if (!media || updating) return;

    // 5 dots correspond to 2, 4, 6, 8, 10 on backend's 1-10 rating scale
    const targetRating = starIndex * 2;
    const currentRating = entry?.rating ?? 0;
    const newRating = currentRating === targetRating ? 0 : targetRating;

    setUpdating(true);
    try {
      if (!entry || media.id <= 0) {
        const created = await addMediaToLibrary({
          mediaId: media.id > 0 ? media.id : undefined,
          mediaType: media.mediaType,
          externalSource: media.externalSource,
          externalId: media.externalId,
          status: "completed",
          title: media.title,
          coverImage: media.coverImage,
          year: media.year,
          score: media.score,
          totalUnits: media.totalUnits,
          unitName: media.unitName,
          runtimeMinutes: media.runtimeMinutes,
          rating: newRating > 0 ? newRating : undefined,
        });
        if (created) {
          setEntry(created);
          setMedia((prev) => (prev ? { ...prev, id: created.mediaId } : null));
          window.history.replaceState(null, "", `/media/${created.mediaId}`);
        }
      } else {
        await setMediaRating(media.id, newRating);
        setEntry((prev) =>
          prev ? { ...prev, rating: newRating > 0 ? newRating : null } : null,
        );
      }
    } finally {
      setUpdating(false);
    }
  };

  const handleShare = () => {
    if (typeof window !== "undefined") {
      void navigator.clipboard?.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-[1080px] px-5 py-12 sm:px-8">
        <div className="flex items-center gap-3">
          <div className="size-2 animate-pulse rounded-full bg-surface-3" />
          <div className="h-3 w-40 animate-pulse rounded-full bg-surface-3" />
        </div>
        <div className="mt-4 h-12 w-3/4 animate-pulse rounded-xl bg-surface-3" />
        <div className="mt-4 h-5 w-1/2 animate-pulse rounded-lg bg-surface-3" />
        <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div className="h-80 animate-pulse rounded-2xl bg-surface-2" />
          <div className="h-80 animate-pulse rounded-2xl bg-surface-2" />
        </div>
      </div>
    );
  }

  if (!media) {
    return (
      <div className="mx-auto flex w-full max-w-[1080px] flex-col items-center px-5 py-24 text-center sm:px-8">
        <span className="text-[10px] font-mono tracking-[0.16em] text-ink-3 uppercase">
          Catalog
        </span>
        <h1 className="mt-4 font-serif text-[28px] text-foreground">Media not found.</h1>
        <p className="mt-2 text-[14px] text-ink-2">
          We couldn&rsquo;t find this title in the catalog or database.
        </p>
        <Link
          href="/home"
          className="mt-6 inline-flex items-center gap-2 rounded-lg border border-line px-4 py-2 text-xs font-mono tracking-wider uppercase text-foreground hover:bg-surface-3 transition-colors"
        >
          <ArrowLeft className="size-3.5" /> Back to Dashboard
        </Link>
      </div>
    );
  }

  const statusOptions = getStatusOptions(media.mediaType);
  const currentStatus = entry?.status ?? null;
  const currentProgress = entry?.progress ?? 0;
  const totalUnits = media.totalUnits;
  const unitLabel = (media.unitName || (media.mediaType === "manga" ? "ch" : "ep")).toLowerCase();
  const percentage =
    entry && totalUnits && totalUnits > 0
      ? Math.min(100, Math.round((currentProgress / totalUnits) * 100))
      : entry?.status === "completed"
        ? 100
        : entry && currentProgress > 0
          ? 50
          : 0;

  const currentRating = entry?.rating ?? 0; // 0 to 10
  const activeDots = Math.round(currentRating / 2); // 0 to 5

  const communityScore =
    media.score !== null && media.score !== undefined
      ? (media.score > 10 ? media.score / 10 : media.score).toFixed(1)
      : null;

  const studioAuthor = media.developer?.trim() || "Unknown";

  const moreCategoryLabel = `More ${media.mediaType}`;

  return (
    <article className="mx-auto w-full max-w-[1080px] px-5 py-6 sm:px-8 sm:py-10">
      {/* Top Divider Line (from image) */}
      <div className="h-px w-full bg-line mb-6 sm:mb-8" aria-hidden="true" />

      {/* Banner Image Hero Part (Requested by user) */}
      {media.bannerImage && (
        <div className="relative mb-8 w-full overflow-hidden rounded-2xl border border-line bg-surface-3 shadow-xs">
          <div className="relative h-44 w-full sm:h-56 md:h-64 lg:h-72">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={media.bannerImage}
              alt={`${media.title} banner`}
              className="h-full w-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/25 to-transparent" />
            <div className="absolute inset-0 ring-1 ring-inset ring-black/10 dark:ring-white/10 rounded-2xl pointer-events-none" />
          </div>
        </div>
      )}

      {/* Header Info */}
      <header className="relative">
        {/* Category meta breadcrumb: • SERIES · 1997 · UNKNOWN */}
        <div className="flex items-center gap-2 text-[11px] font-mono tracking-[0.14em] text-ink-3 uppercase">
          <span
            className={cn("size-2 rounded-full shrink-0", getMediaDotColorClass(media.mediaType))}
            aria-hidden="true"
          />
          <span>{media.mediaType}</span>
          <span className="text-ink-3/60">·</span>
          <span>{media.year ?? "Unknown"}</span>
          <span className="text-ink-3/60">·</span>
          <span className="truncate">{studioAuthor}</span>
        </div>

        {/* Title */}
        <h1 className="mt-3.5 font-serif text-[36px] sm:text-[46px] lg:text-[52px] leading-[1.08] tracking-[-0.015em] text-foreground">
          {media.title}
        </h1>

        {/* Subtitle / Description */}
        {media.description && (
          <p className="mt-3 max-w-2xl text-[14px] sm:text-[15px] leading-relaxed text-ink-2">
            {cleanDescription(media.description)}
          </p>
        )}

        {/* Badges / Pills Row */}
        <div className="mt-6 flex flex-wrap items-center gap-2 sm:gap-2.5">
          {/* Rating pill */}
          {communityScore && (
            <span className="rounded-full border border-accent/80 px-3.5 py-1 font-mono text-[11px] font-medium tracking-wider text-accent uppercase">
              {communityScore} / 10 Rating
            </span>
          )}

          {/* Format / Units pill */}
          {totalUnits ? (
            <span className="rounded-full border border-line-2/80 px-3.5 py-1 font-mono text-[11px] tracking-wider text-ink-2 uppercase">
              {totalUnits} {unitLabel}
            </span>
          ) : media.runtimeMinutes ? (
            <span className="rounded-full border border-line-2/80 px-3.5 py-1 font-mono text-[11px] tracking-wider text-ink-2 uppercase">
              {media.runtimeMinutes} min
            </span>
          ) : null}

          {/* Genres pills */}
          {media.genres?.slice(0, 3).map((genre) => (
            <span
              key={genre}
              className="rounded-full border border-line-2/80 px-3.5 py-1 font-mono text-[11px] tracking-wider text-ink-2 uppercase"
            >
              {genre}
            </span>
          ))}

          {/* Source pill with green dot indicator */}
          <span className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-line-2 px-3.5 py-1 font-mono text-[11px] tracking-wider text-ink-2 uppercase">
            <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
            {media.externalSource || "Anilist"}
          </span>

          {/* Share button */}
          <button
            type="button"
            onClick={handleShare}
            aria-label="Share title"
            className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1 font-mono text-[10.5px] tracking-wider text-ink-3 uppercase hover:text-foreground hover:bg-surface-3 transition-colors"
          >
            {copied ? (
              <>
                <Check className="size-3 text-emerald-500" /> Copied
              </>
            ) : (
              <>
                <Share2 className="size-3" /> Share
              </>
            )}
          </button>
        </div>
      </header>

      {/* Two-Column Grid */}
      <section className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8 items-start">
        {/* Left Card: YOUR PROGRESS */}
        <div className="rounded-2xl border border-line bg-surface-2 p-6 sm:p-7 shadow-xs">
          {/* Card Section Header with divider line */}
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono tracking-[0.16em] text-ink-3 uppercase whitespace-nowrap">
              Your Progress
            </span>
            {!entry && (
              <span className="rounded-full border border-dashed border-line-2 px-2 py-0.5 text-[9px] font-mono tracking-wider text-ink-3 uppercase">
                Not in library
              </span>
            )}
            <div className="h-px flex-1 bg-line" aria-hidden="true" />
          </div>

          {/* Big Progress Number */}
          <div className="mt-8 flex items-baseline">
            <span className="font-serif text-[48px] sm:text-[56px] leading-none tracking-tight text-foreground">
              {entry ? currentProgress : "—"}
            </span>
            <span className="ml-2 font-serif text-[22px] sm:text-[26px] tracking-normal text-ink-3 italic">
              / {totalUnits ?? "—"} {unitLabel}
            </span>
          </div>

          {/* Linear Progress Bar */}
          <div
            className="mt-4 h-[3px] w-full max-w-[280px] rounded-full bg-surface-3 overflow-hidden"
            role="progressbar"
            aria-valuenow={percentage}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full bg-foreground rounded-full transition-all duration-300"
              style={{ width: `${percentage}%` }}
            />
          </div>

          {/* Stepper + Rating Row */}
          <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
            {/* Stepper: [-] 64% [+] */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void handleProgressChange(-1)}
                disabled={updating || currentProgress <= 0}
                aria-label="Decrease progress"
                className="grid size-9 place-items-center rounded-lg border border-line-2/70 text-ink-2 transition-colors hover:bg-surface-3 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 disabled:opacity-30 disabled:pointer-events-none"
              >
                <Minus className="size-3.5" strokeWidth={2.2} />
              </button>

              <span className="min-w-[46px] text-center font-mono text-[12.5px] font-semibold text-foreground">
                {percentage}%
              </span>

              <button
                type="button"
                onClick={() => void handleProgressChange(1)}
                disabled={updating || (totalUnits ? currentProgress >= totalUnits : false)}
                aria-label="Increase progress"
                className="grid size-9 place-items-center rounded-lg border border-line-2/70 text-ink-2 transition-colors hover:bg-surface-3 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 disabled:opacity-30 disabled:pointer-events-none"
              >
                <Plus className="size-3.5" strokeWidth={2.2} />
              </button>
            </div>

            {/* Rating Dots */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono tracking-[0.16em] text-ink-3 uppercase mr-1">
                Rating
              </span>
              <div className="flex items-center gap-1.5" role="radiogroup" aria-label="Rating out of 5">
                {[1, 2, 3, 4, 5].map((dotIndex) => {
                  const isFilled = dotIndex <= activeDots;
                  return (
                    <button
                      key={dotIndex}
                      type="button"
                      role="radio"
                      aria-checked={isFilled}
                      aria-label={`${dotIndex} out of 5 stars`}
                      onClick={() => void handleRatingClick(dotIndex)}
                      disabled={updating}
                      className={cn(
                        "size-2.5 rounded-full transition-all duration-150 transform hover:scale-125 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
                        isFilled
                          ? "bg-accent shadow-xs"
                          : "bg-surface-3 border border-line-2 hover:border-accent/60",
                      )}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {/* Status Tabs along the bottom */}
          <div className="mt-8 pt-6 border-t border-line">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              {statusOptions.map((opt) => {
                const isActive = currentStatus === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => void handleStatusChange(opt.key)}
                    disabled={updating}
                    className={cn(
                      "relative py-1 text-[11px] font-mono tracking-[0.12em] uppercase transition-colors duration-150",
                      isActive
                        ? "text-foreground font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-accent"
                        : "text-ink-3 hover:text-foreground",
                    )}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: DETAILS & MORE TITLES */}
        <div className="space-y-6">
          {/* Details Card */}
          <div className="rounded-2xl border border-line bg-surface-2 p-6 sm:p-7 shadow-xs">
            {/* Header */}
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono tracking-[0.16em] text-ink-3 uppercase whitespace-nowrap">
                Details
              </span>
              <div className="h-px flex-1 bg-line" aria-hidden="true" />
            </div>

            {/* Table rows */}
            <div className="mt-5 divide-y divide-line">
              <div className="flex items-center justify-between py-3">
                <span className="text-[10px] font-mono tracking-[0.16em] text-ink-3 uppercase">
                  Studio / Author
                </span>
                <span className="text-[13px] font-medium text-foreground">
                  {studioAuthor}
                </span>
              </div>

              <div className="flex items-center justify-between py-3">
                <span className="text-[10px] font-mono tracking-[0.16em] text-ink-3 uppercase">
                  Format
                </span>
                <span className="text-[13px] font-medium text-foreground capitalize">
                  {media.mediaType}
                  {totalUnits ? ` · ${totalUnits} ${unitLabel}` : ""}
                  {media.runtimeMinutes ? ` · ${media.runtimeMinutes} min` : ""}
                </span>
              </div>

              <div className="flex items-center justify-between py-3">
                <span className="text-[10px] font-mono tracking-[0.16em] text-ink-3 uppercase">
                  Source
                </span>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-mono tracking-wider text-ink-2 uppercase">
                  <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
                  {media.externalSource || "Anilist"}
                </span>
              </div>

              <div className="flex items-center justify-between py-3">
                <span className="text-[10px] font-mono tracking-[0.16em] text-ink-3 uppercase">
                  Rating
                </span>
                <span className="text-[13px] font-medium text-foreground">
                  {communityScore ? `${communityScore} / 10` : "Not rated"}
                </span>
              </div>
            </div>
          </div>

          {/* More Titles Card */}
          <div className="rounded-2xl border border-line bg-surface-2 p-6 sm:p-7 shadow-xs">
            {/* Header */}
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono tracking-[0.16em] text-ink-3 uppercase whitespace-nowrap">
                {moreCategoryLabel}
              </span>
              <div className="h-px flex-1 bg-line" aria-hidden="true" />
            </div>

            {/* List */}
            <div className="mt-5 space-y-2.5">
              {similar.length === 0 ? (
                <p className="py-4 text-center text-xs text-ink-3">
                  No related titles found in catalog.
                </p>
              ) : (
                similar.slice(0, 4).map((item) => {
                  const itemYear = item.year ?? "Unknown";
                  const itemScore =
                    item.score !== null && item.score !== undefined
                      ? (item.score > 10 ? item.score / 10 : item.score).toFixed(1)
                      : null;

                  const itemHref =
                    item.id > 0
                      ? `/media/${item.id}`
                      : `/media/ext?source=${encodeURIComponent(item.externalSource)}&id=${encodeURIComponent(item.externalId)}&type=${encodeURIComponent(item.mediaType)}`;

                  return (
                    <div
                      key={item.id > 0 ? item.id : `${item.externalSource}-${item.externalId}`}
                      className="group flex items-center justify-between gap-3.5 rounded-xl border border-line/60 bg-surface-2/70 p-2.5 sm:p-3 transition-colors hover:border-line-2 hover:bg-surface-3"
                    >
                      <Link
                        href={itemHref}
                        className="flex min-w-0 flex-1 items-center gap-3 focus-visible:outline-none"
                      >
                        <MediaAvatarCard
                          title={item.title}
                          year={item.year ?? undefined}
                          image={item.coverImage ?? undefined}
                          type={asMediaType(item.mediaType || media.mediaType)}
                          size="sm"
                        />

                        {/* Text info */}
                        <div className="min-w-0 flex-1">
                          <h4 className="truncate text-[13.5px] font-medium leading-snug text-foreground group-hover:text-accent transition-colors">
                            {item.title}
                          </h4>
                          <p className="mt-0.5 text-[10px] font-mono tracking-[0.1em] text-ink-3 uppercase">
                            {itemYear}{itemScore ? ` · ${itemScore} / 10` : ""}
                          </p>
                        </div>
                      </Link>

                      {/* Route Action Button */}
                      <Link
                        href={itemHref}
                        aria-label={`View ${item.title}`}
                        className="grid size-8 shrink-0 place-items-center rounded-lg border border-line-2/70 text-ink-2 transition-colors hover:bg-surface-3 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
                      >
                        <ArrowRight className="size-3.5" strokeWidth={2} />
                      </Link>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </section>
    </article>
  );
}

