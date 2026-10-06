"use client";

import { Check, Loader2, Lock, Pencil, Plus } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/app/components/ui/button";
import { updateMe } from "@/lib/api/me";
import { fetchOverview, type StatsOverview } from "@/lib/api/stats";
import { initialOf } from "@/lib/current-user";
import { useCurrentUser } from "@/lib/use-current-user";
import { cn } from "@/lib/utils";

function StatValue({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <p className="font-serif text-[26px] leading-none tracking-[-0.01em] text-foreground">
        {value}
      </p>
      <p className="mt-2 text-[9px] font-mono tracking-[0.14em] text-ink-3 uppercase">
        {label}
      </p>
    </div>
  );
}

function StatSkeleton() {
  return (
    <div aria-hidden="true" className="flex flex-col items-center gap-2">
      <div className="h-6 w-10 animate-pulse rounded-md bg-surface-3" />
      <div className="h-2 w-14 animate-pulse rounded-full bg-surface-3" />
    </div>
  );
}

export default function ProfileHeader() {
  const { user, loading } = useCurrentUser();
  const [overview, setOverview] = useState<StatsOverview | null>(null);

  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioInput, setBioInput] = useState("");
  const [bioSaving, setBioSaving] = useState(false);
  const [bioError, setBioError] = useState<string | null>(null);

  useEffect(() => {
    if (loading || user === null) return;

    let cancelled = false;

    fetchOverview()
      .then((data) => {
        if (!cancelled) setOverview(data);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [user, loading]);

  const handleStartEditing = () => {
    setBioInput(user?.bio ?? "");
    setBioError(null);
    setIsEditingBio(true);
  };

  const handleCancelEditing = () => {
    setIsEditingBio(false);
    setBioInput("");
    setBioError(null);
  };

  const handleSaveBio = async () => {
    if (bioSaving) return;
    setBioSaving(true);
    setBioError(null);

    try {
      const trimmed = bioInput.trim();
      await updateMe({ bio: trimmed });
      setIsEditingBio(false);
    } catch (err: unknown) {
      setBioError(err instanceof Error ? err.message : "Failed to update bio.");
    } finally {
      setBioSaving(false);
    }
  };

  if (loading || user === null) {
    return (
      <article className="rounded-xl border border-line bg-surface-2 p-5 sm:p-6">
        <div className="flex flex-col items-center gap-6">
          <div className="flex w-full max-w-md items-center justify-center gap-3 sm:max-w-none">
            <div
              aria-hidden="true"
              className="size-14 shrink-0 animate-pulse rounded-full bg-surface-3 sm:size-16"
            />
            <div className="h-7 w-44 max-w-[50vw] animate-pulse rounded-md bg-surface-3" />
          </div>
          <div
            aria-hidden="true"
            className="grid w-full max-w-sm grid-cols-2 gap-x-6 gap-y-5 sm:max-w-none sm:grid-cols-4"
          >
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
          </div>
        </div>
      </article>
    );
  }

  const stats = overview
    ? ([
        { label: "Library", value: overview.totalItems },
        { label: "Completed", value: overview.totalCompleted },
        { label: "In progress", value: overview.totalInProgress },
        { label: "Favorites", value: overview.totalFavorites },
      ] as const)
    : null;

  return (
    <article className="rounded-xl border border-line bg-surface-2 p-5 sm:p-6">
      <div className="flex flex-wrap items-center gap-5">
        <span
          aria-hidden="true"
          className="grid size-14 shrink-0 place-items-center rounded-full bg-accent-soft text-[22px] font-semibold text-accent sm:size-16 sm:text-[26px]"
        >
          {initialOf(user.username)}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h1 className="min-w-0 truncate font-serif text-[clamp(24px,3.5vw,36px)] leading-[1.05] tracking-[-0.01em] text-foreground">
              {user.username}
            </h1>

            {user.isPrivate && (
              <span
                className={cn(
                  "flex shrink-0 items-center gap-1 rounded-full border border-line bg-background px-2.5 py-1",
                  "text-[9px] font-mono tracking-[0.14em] text-ink-3 uppercase",
                )}
              >
                <Lock className="size-3" strokeWidth={2} />
                Private
              </span>
            )}
          </div>

          {isEditingBio ? (
            <div className="mt-3 max-w-xl">
              <textarea
                value={bioInput}
                onChange={(e) => setBioInput(e.target.value)}
                maxLength={500}
                rows={3}
                placeholder="Tell us a bit about yourself (up to 500 characters)..."
                className={cn(
                  "w-full rounded-lg border border-line-2/70 bg-background px-3 py-2 text-[13.5px] leading-relaxed text-foreground placeholder:text-ink-3",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 resize-none",
                )}
                autoFocus
                disabled={bioSaving}
                onKeyDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                    e.preventDefault();
                    void handleSaveBio();
                  } else if (e.key === "Escape") {
                    e.preventDefault();
                    handleCancelEditing();
                  }
                }}
              />
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] font-mono text-ink-3">
                  {bioInput.length} / 500
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleCancelEditing}
                    disabled={bioSaving}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => void handleSaveBio()}
                    disabled={bioSaving}
                  >
                    {bioSaving ? (
                      <>
                        <Loader2 className="size-3.5 animate-spin mr-1" />
                        Saving…
                      </>
                    ) : (
                      <>
                        <Check className="size-3.5 mr-1" />
                        Save bio
                      </>
                    )}
                  </Button>
                </div>
              </div>
              {bioError && (
                <p className="mt-2 text-[12px] text-red-500">{bioError}</p>
              )}
            </div>
          ) : user.bio ? (
            <div className="group mt-2 flex max-w-xl items-start gap-2.5">
              <p className="text-[14px] leading-relaxed text-ink-2 break-words">
                {user.bio}
              </p>
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={handleStartEditing}
                className="h-6 shrink-0 gap-1 rounded-md px-2 text-[11px] font-mono tracking-[0.05em] text-ink-3 hover:text-foreground opacity-80 group-hover:opacity-100 transition-opacity"
                title="Edit bio"
              >
                <Pencil className="size-3" />
                Edit
              </Button>
            </div>
          ) : (
            <div className="mt-2.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleStartEditing}
                className="h-7 gap-1.5 rounded-md border-line-2/70 px-2.5 text-[11px] font-mono tracking-[0.08em] text-ink-2 uppercase hover:bg-surface-3 hover:text-foreground"
              >
                <Plus className="size-3" strokeWidth={2} />
                Add bio
              </Button>
            </div>
          )}
        </div>

        <div
          className="hidden shrink-0 items-center gap-6 sm:flex"
          aria-label="Profile statistics"
        >
          {stats === null
            ? ([0, 1, 2, 3] as const).map((index) => <StatSkeleton key={index} />)
            : stats.map((stat) => (
                <StatValue key={stat.label} label={stat.label} value={stat.value} />
              ))}
        </div>
      </div>

      <div
        className="mt-5 grid w-full grid-cols-4 gap-x-6 sm:hidden"
        aria-label="Profile statistics"
      >
        {stats === null
          ? ([0, 1, 2, 3] as const).map((index) => <StatSkeleton key={index} />)
          : stats.map((stat) => (
              <StatValue key={stat.label} label={stat.label} value={stat.value} />
            ))}
      </div>
    </article>
  );
}