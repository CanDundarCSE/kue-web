// Spoiler ranges are UTF-16 char offsets with an exclusive end, matching
// both C# string indexing and JS textarea selectionStart/selectionEnd, so
// indexes computed here line up with what the backend stores.

export type SpoilerRange = {
  start: number;
  end: number;
};

export const MAX_SPOILER_RANGES = 20;

/** Clamp, drop degenerate spans, sort, merge overlaps, cap the count. */
export function normalizeSpoilerRanges(
  ranges: readonly SpoilerRange[],
  contentLength: number,
): SpoilerRange[] {
  if (contentLength <= 0) return [];

  const clamped: SpoilerRange[] = [];
  for (const range of ranges) {
    const start = Math.max(0, Math.floor(range.start));
    const end = Math.min(contentLength, Math.floor(range.end));
    if (start < end) clamped.push({ start, end });
  }

  clamped.sort((a, b) => a.start - b.start);

  const merged: SpoilerRange[] = [];
  for (const span of clamped) {
    const last = merged[merged.length - 1];
    if (last && span.start <= last.end) {
      last.end = Math.max(last.end, span.end);
    } else {
      merged.push({ ...span });
    }
    if (merged.length >= MAX_SPOILER_RANGES) break;
  }

  return merged;
}

export type SpoilerSegment = {
  text: string;
  spoiler: boolean;
};

/** Splits content into plain/masked segments for rendering. */
export function splitSpoilerSegments(
  content: string,
  ranges: readonly SpoilerRange[],
): SpoilerSegment[] {
  const spans = normalizeSpoilerRanges(ranges, content.length);
  if (spans.length === 0) return content ? [{ text: content, spoiler: false }] : [];

  const segments: SpoilerSegment[] = [];
  let cursor = 0;
  for (const span of spans) {
    if (span.start > cursor) {
      segments.push({ text: content.slice(cursor, span.start), spoiler: false });
    }
    segments.push({ text: content.slice(span.start, span.end), spoiler: true });
    cursor = span.end;
  }
  if (cursor < content.length) {
    segments.push({ text: content.slice(cursor), spoiler: false });
  }

  return segments.filter((segment) => segment.text.length > 0);
}

/**
 * Coerces unknown client input into spoiler ranges. Non-numeric or missing
 * endpoints are dropped here; bounds are enforced by
 * {@link normalizeSpoilerRanges} / the backend.
 */
export function toSpoilerRanges(value: unknown): SpoilerRange[] {
  if (!Array.isArray(value)) return [];
  const ranges: SpoilerRange[] = [];
  for (const item of value) {
    if (item !== null && typeof item === "object") {
      const { start, end } = item as { start?: unknown; end?: unknown };
      if (
        typeof start === "number" &&
        Number.isFinite(start) &&
        typeof end === "number" &&
        Number.isFinite(end)
      ) {
        ranges.push({ start, end });
      }
    }
  }
  return ranges;
}

/**
 * Rebases ranges computed against raw (untrimmed) text onto the trimmed
 * text that is actually stored. The backend trims content before validating
 * spans, so without this a leading newline/space would shift every mask.
 */
export function rebaseSpoilersForTrim(
  content: string,
  ranges: readonly SpoilerRange[],
): SpoilerRange[] {
  const leading = content.length - content.trimStart().length;
  const trimmedLength = content.trim().length;
  return normalizeSpoilerRanges(
    ranges.map((range) => ({ start: range.start - leading, end: range.end - leading })),
    trimmedLength,
  );
}
