"use client";

import { EyeOff, Eye, Loader2, Save, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import MediaAvatarCard, { type MediaType } from "@/app/components/media-avatar-card";
import LibraryMediaPicker, { type PickerMedia } from "@/app/features/reviews/library-media-picker";
import { REVIEW_MAX_LENGTH } from "@/lib/api/reviews";
import { cn } from "@/lib/utils";

function CharacterCount({ value }: { value: string }) {
  const remaining = REVIEW_MAX_LENGTH - value.length;
  const over = remaining < 0;

  return (
    <span
      className={cn(
        "font-mono text-[11px] tabular-nums",
        over ? "text-[#C4533C] dark:text-[#D9705A]" : remaining <= 20 ? "text-ink-3" : "text-ink-3",
      )}
    >
      {value.length}/{REVIEW_MAX_LENGTH}
    </span>
  );
}

export const RATING_MIN = 1;
export const RATING_MAX = 10;

/** Clamps to the 1-10 range the backend enforces, or null when unset. */
export function normalizeRating(value: number | null | undefined): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return Math.min(RATING_MAX, Math.max(RATING_MIN, Math.round(value)));
}

const RATING_STEPS = Array.from({ length: RATING_MAX }, (_, index) => index + 1);

/**
 * Ten-step segmented control matching the 1-10 backend scale. Buttons rather
 * than a slider so every value is reachable by keyboard and screen reader.
 */
function RatingScale({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (rating: number | null) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div
        className="inline-flex rounded-lg border border-line-2/70 p-0.5"
        role="radiogroup"
        aria-label="Rating out of 10"
      >
        {RATING_STEPS.map((step) => {
          const selected = value === step;
          return (
            <button
              key={step}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={`Rate ${step} out of 10`}
              // Clicking the current value clears the score.
              onClick={() => onChange(selected ? null : step)}
              className={cn(
                "h-7 w-6 font-mono text-[11px] tabular-nums",
                "transition-colors duration-150 motion-reduce:transition-none",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
                selected
                  ? "rounded-md bg-accent text-background"
                  : "rounded-md text-ink-3 hover:bg-surface-3 hover:text-foreground",
              )}
            >
              {step}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => onChange(null)}
        disabled={value === null}
        className={cn(
          "font-mono text-[10px] tracking-[0.12em] uppercase",
          "transition-colors duration-150 motion-reduce:transition-none",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
          "disabled:pointer-events-none disabled:opacity-40",
          value === null ? "text-foreground" : "text-ink-3 hover:text-foreground",
        )}
      >
        {value === null ? "No score" : "Clear"}
      </button>
    </div>
  );
}

function VisibilityToggle({
  isPublic,
  onChange,
}: {
  isPublic: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="inline-flex rounded-lg border border-line-2/70 p-0.5" role="group" aria-label="Visibility">
      <button
        type="button"
        aria-pressed={isPublic}
        onClick={() => onChange(true)}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 font-mono text-[10px] tracking-[0.12em] uppercase",
          "transition-colors duration-150 motion-reduce:transition-none",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
          isPublic ? "bg-foreground text-background" : "text-ink-3 hover:text-foreground",
        )}
      >
        <Eye className="size-3" strokeWidth={2} />
        Public
      </button>
      <button
        type="button"
        aria-pressed={!isPublic}
        onClick={() => onChange(false)}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 font-mono text-[10px] tracking-[0.12em] uppercase",
          "transition-colors duration-150 motion-reduce:transition-none",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
          !isPublic ? "bg-foreground text-background" : "text-ink-3 hover:text-foreground",
        )}
      >
        <EyeOff className="size-3" strokeWidth={2} />
        Private
      </button>
    </div>
  );
}

const fieldLabel =
  "text-[9px] font-mono tracking-[0.16em] text-ink-3 uppercase";

export default function ReviewComposer({
  mode,
  initialContent,
  initialRating,
  initialIsPublic,
  reviewedMediaIds,
  busy,
  error,
  onSubmit,
  onCancel,
}: {
  mode: "create" | "edit";
  initialContent: string;
  /** Stored 1-10 rating. */
  initialRating: number | null;
  initialIsPublic: boolean;
  reviewedMediaIds: Set<number>;
  busy: boolean;
  error: string | null;
  onSubmit: (input: {
    media: PickerMedia | null;
    content: string;
    rating: number | null;
    isPublic: boolean;
  }) => void;
  onCancel: () => void;
}) {
  const idPrefix = mode === "edit" ? "edit-review" : "new-review";
  const [media, setMedia] = useState<PickerMedia | null>(null);
  const [content, setContent] = useState(initialContent);
  const [rating, setRating] = useState<number | null>(normalizeRating(initialRating));
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [touched, setTouched] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // Tracks whether the user has set the rating themselves, so the library
  // prefill does not overwrite a deliberate choice when the title changes.
  const touchedRating = useRef(false);

  // The form is a controlled draft seeded from props. The parent remounts it
  // with a React `key` when the target review changes, so there is no need to
  // sync prop changes back into state here.

  // Grow the textarea with its content, capped by maxLength anyway.
  useEffect(() => {
    const node = textareaRef.current;
    if (!node) return;
    node.style.height = "auto";
    node.style.height = `${node.scrollHeight}px`;
  }, [content]);

  const trimmed = content.trim();
  const needsMedia = mode === "create" && media === null;
  const empty = trimmed.length === 0;
  const tooLong = trimmed.length > REVIEW_MAX_LENGTH;
  const invalid = needsMedia || empty || tooLong;

  const submit = () => {
    setTouched(true);
    if (invalid || busy) return;
    onSubmit({ media, content: trimmed, rating: normalizeRating(rating), isPublic });
  };

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
      className="rounded-xl border border-line bg-surface-2/60 p-4 sm:p-5"
    >
      {mode === "create" && (
        <div className="mb-5">
          <p className={fieldLabel} id={`${idPrefix}-media-label`}>
            Pick a title from your library
          </p>
          <div className="mt-3">
            {media === null ? (
              <LibraryMediaPicker
                value={null}
                reviewedMediaIds={reviewedMediaIds}
                onChange={(next) => {
                  setMedia(next);
                  // Carry the library entry's score across so the user does
                  // not re-enter a rating they already set. Only prefill while
                  // they haven't touched the control, and let a title without
                  // a score clear a stale value from the previous pick.
                  if (!touchedRating.current) {
                    setRating(normalizeRating(next.rating));
                  }
                }}
              />
            ) : (
              <div className="flex items-center gap-3 rounded-lg border border-line-2/70 bg-background px-3 py-2.5">
                <MediaAvatarCard
                  title={media.title}
                  image={media.image}
                  type={media.type as MediaType}
                  size="sm"
                />
                <span className="min-w-0 flex-1 truncate text-[13px] text-foreground">
                  {media.title}
                </span>
                {normalizeRating(media.rating) !== null && (
                  <span className="shrink-0 font-mono text-[10px] tabular-nums text-ink-3">
                    {normalizeRating(media.rating)}/10 in library
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setMedia(null);
                    touchedRating.current = false;
                  }}
                  aria-label="Choose a different title"
                  className={cn(
                    "grid size-7 shrink-0 place-items-center rounded-md text-ink-3",
                    "transition-colors hover:bg-surface-3 hover:text-foreground",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
                  )}
                >
                  <X className="size-3.5" strokeWidth={2} />
                </button>
              </div>
            )}
          </div>
          {touched && needsMedia && (
            <p className="mt-2 text-[12px] text-[#C4533C] dark:text-[#D9705A]">
              Choose a title from your library first.
            </p>
          )}
        </div>
      )}

      <div>
        <div className="flex items-center justify-between gap-3">
          <label className={fieldLabel} htmlFor={`${idPrefix}-content`}>
            Your review
          </label>
          <CharacterCount value={trimmed} />
        </div>

        <textarea
          ref={textareaRef}
          id={`${idPrefix}-content`}
          value={content}
          onChange={(event) => setContent(event.target.value)}
          maxLength={REVIEW_MAX_LENGTH}
          rows={4}
          placeholder="What did you make of it?"
          aria-invalid={touched && empty}
          aria-describedby={`${idPrefix}-content-help`}
          className={cn(
            "mt-2 w-full resize-none rounded-lg border border-line-2/70 bg-background px-3 py-2.5",
            "font-serif text-[15px] leading-relaxed text-foreground placeholder:text-ink-3",
            "focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-accent/30 focus-visible:outline-none",
          )}
        />
        <p id={`${idPrefix}-content-help`} className="sr-only">
          Up to {REVIEW_MAX_LENGTH} characters.
        </p>
        {touched && empty && (
          <p className="mt-2 text-[12px] text-[#C4533C] dark:text-[#D9705A]">
            Write something before saving.
          </p>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <RatingScale
          value={rating}
          onChange={(next) => {
            touchedRating.current = true;
            setRating(next);
          }}
        />
        <VisibilityToggle isPublic={isPublic} onChange={setIsPublic} />
      </div>

      {error && (
        <p className="mt-4 text-[12px] text-[#C4533C] dark:text-[#D9705A]">{error}</p>
      )}

      <div className="mt-4 flex items-center gap-2">
        <button
          type="submit"
          disabled={busy}
          className={cn(
            "inline-flex items-center gap-2 rounded-md bg-foreground px-3.5 py-2 font-mono text-[11px] tracking-[0.08em] text-background uppercase",
            "transition-opacity duration-150 motion-reduce:transition-none",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
            "disabled:pointer-events-none disabled:opacity-50",
          )}
        >
          {busy ? (
            <>
              <Loader2 className="size-3.5 animate-spin" strokeWidth={2} />
              Saving
            </>
          ) : (
            <>
              <Save className="size-3.5" strokeWidth={2} />
              {mode === "edit" ? "Save changes" : "Publish review"}
            </>
          )}
        </button>

        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          className={cn(
            "inline-flex items-center gap-2 rounded-md border border-line-2/70 px-3.5 py-2 font-mono text-[11px] tracking-[0.08em] text-ink-2 uppercase",
            "transition-colors duration-150 motion-reduce:transition-none",
            "hover:bg-surface-3 hover:text-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
            "disabled:pointer-events-none disabled:opacity-40",
          )}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}