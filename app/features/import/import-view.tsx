"use client";

import { Check, Loader2, Upload, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import SectionLabel from "@/app/features/home/section-label";
import {
  cancelImport,
  fetchImportJob,
  fetchImportJobs,
  resolveImport,
  startImport,
  TERMINAL_IMPORT_STATUSES,
  type ImportItemDto,
  type ImportJobDetailsDto,
  type ImportJobDto,
} from "@/lib/api/imports";
import { useCurrentUser } from "@/lib/use-current-user";
import { cn } from "@/lib/utils";

const MAX_FILE_CHARS = 2_000_000;
const MAX_FILES = 50;
const MAX_TOTAL_CHARS = 5_000_000;

const SOURCE_OPTIONS = [
  { value: "", label: "Auto-detect" },
  { value: "mal-xml", label: "MyAnimeList (XML)" },
  { value: "anilist-json", label: "AniList (JSON)" },
  { value: "trakt-json", label: "Trakt (JSON)" },
  { value: "csv", label: "CSV" },
];

const FIELD_LABELS: Record<string, string> = {
  status: "Status",
  progress: "Progress",
  rating: "Rating",
  platform: "Platform",
  favorite: "Favorite",
};

function prettyValue(field: string, value?: string | null) {
  if (value === null || value === undefined || value === "") return "—";
  if (field === "status") return value.replace(/_/g, " ");
  if (field === "favorite") return value === "true" ? "Yes" : "No";
  return value;
}

function statusLabel(status: string) {
  switch (status) {
    case "pending":
      return "Queued";
    case "running":
      return "Working";
    case "awaiting_resolution":
      return "Needs review";
    case "applying":
      return "Applying";
    case "completed":
      return "Done";
    case "failed":
      return "Failed";
    case "cancelled":
      return "Cancelled";
    default:
      return status;
  }
}

function UploadCard({ onStarted }: { onStarted: (job: ImportJobDto) => void }) {
  const [files, setFiles] = useState<{ name: string; content: string }[]>([]);
  const [source, setSource] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickFiles = async (list: FileList | null) => {
    setError(null);
    if (!list || list.length === 0) return;
    if (list.length > MAX_FILES) {
      setError(`Too many files (${MAX_FILES} max). Select the Trakt .json files only.`);
      return;
    }
    const picked: { name: string; content: string }[] = [];
    let total = 0;
    for (const file of Array.from(list)) {
      if (file.name.toLowerCase().endsWith(".zip")) {
        setError("Zip archives aren't accepted — unzip the Trakt export first and select the .json files.");
        return;
      }
      if (file.size > MAX_FILE_CHARS) {
        setError(`'${file.name}' is too large (2 MB max per file).`);
        return;
      }
      const text = await file.text().catch(() => null);
      if (text === null || !text.trim()) {
        setError(`Couldn't read '${file.name}'.`);
        return;
      }
      if (text[0] === "P" && text[1] === "K") {
        setError("That looks like a zip archive — unzip it first and select the .json files.");
        return;
      }
      total += text.length;
      if (total > MAX_TOTAL_CHARS) {
        setError("These files are too large in total (5 MB max).");
        return;
      }
      picked.push({ name: file.name, content: text });
    }
    setFiles(picked);
  };

  const start = async () => {
    if (files.length === 0 || busy) return;
    if (files.length > 1 && source !== "" && source !== "trakt-json") {
      setError("Uploading multiple files is only supported for Trakt exports.");
      return;
    }
    setBusy(true);
    setError(null);
    const payload =
      files.length === 1
        ? { fileName: files[0].name, content: files[0].content, source: source || null }
        : {
            fileName: `Trakt export (${files.length} files)`,
            content: "",
            source: source || "trakt-json",
            files: files.map((file) => ({ fileName: file.name, content: file.content })),
          };
    const { job, error: message } = await startImport(payload);
    setBusy(false);
    if (!job) {
      setError(message ?? "Couldn't start the import.");
      return;
    }
    setFiles([]);
    onStarted(job);
  };

  const totalChars = files.reduce((sum, file) => sum + file.content.length, 0);
  const fileLabel =
    files.length === 0
      ? "Choose file(s)"
      : files.length === 1
        ? files[0].name
        : `${files.length} files · ${Math.round(totalChars / 1024)} KB`;

  return (
    <section
      aria-labelledby="import-upload"
      className="rounded-xl border border-line bg-surface-2/60 p-4 sm:p-5"
    >
      <h2 id="import-upload" className="font-mono text-[11px] tracking-[0.16em] text-ink-2 uppercase">
        New import
      </h2>
      <p className="mt-1.5 text-[13px] leading-relaxed text-ink-2">
        Drop a MyAnimeList, AniList or Trakt export — or a CSV with title, status, score and
        progress columns. Trakt ships many .json files: unzip the backup and select them all
        at once. Matching runs in the background; you can leave this page.
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
        <label
          className={cn(
            "inline-flex cursor-pointer items-center gap-2 rounded-md border border-line-2/70 px-3.5 py-2 font-mono text-[11px] tracking-[0.08em] text-ink-2 uppercase",
            "transition-colors hover:bg-surface-3 hover:text-foreground",
            "focus-within:outline-none focus-within:ring-2 focus-within:ring-accent/30",
          )}
        >
          <Upload className="size-3.5" strokeWidth={2} aria-hidden="true" />
          {fileLabel}
          <input
            type="file"
            accept=".xml,.json,.csv,.txt"
            multiple
            className="sr-only"
            onChange={(event) => void pickFiles(event.target.files)}
          />
        </label>
        <select
          value={source}
          onChange={(event) => setSource(event.target.value)}
          aria-label="Export format"
          className={cn(
            "h-[34px] cursor-pointer appearance-none rounded-md border border-line-2/70 bg-transparent pr-3 pl-3",
            "font-mono text-[11px] tracking-[0.08em] text-ink-2 uppercase",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
          )}
        >
          {SOURCE_OPTIONS.map((option) => (
            <option key={option.value || "auto"} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => void start()}
          disabled={files.length === 0 || busy}
          className={cn(
            "inline-flex items-center gap-2 rounded-md bg-foreground px-3.5 py-2 font-mono text-[11px] tracking-[0.08em] text-background uppercase",
            "transition-opacity hover:opacity-90",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
            "disabled:pointer-events-none disabled:opacity-50",
          )}
        >
          {busy && <Loader2 className="size-3.5 animate-spin" strokeWidth={2} aria-hidden="true" />}
          Start import
        </button>
      </div>
      {error && <p className="mt-2.5 text-[12px] text-[#C4533C] dark:text-[#D9705A]">{error}</p>}
    </section>
  );
}

function ConflictCard({
  item,
  effective,
  onDecide,
}: {
  item: ImportItemDto;
  effective: "keep" | "import" | "skip";
  onDecide: (decision: "keep" | "import" | "skip") => void;
}) {
  return (
    <li className="rounded-lg border border-line-2/70 bg-background px-3.5 py-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-[14px] font-semibold text-foreground">{item.title}</p>
        {item.importedRating !== null && item.importedRating !== undefined && (
          <p className="font-mono text-[10px] tabular-nums text-ink-3">
            Import rates it {item.importedRating}/10
          </p>
        )}
      </div>
      <div className="mt-2 space-y-1.5">
        {item.conflicts.map((conflict, index) => (
          <div
            key={`${conflict.field}-${index}`}
            className="grid grid-cols-[90px_1fr_1fr] items-baseline gap-2 text-[12px]"
          >
            <span className="font-mono text-[10px] tracking-[0.1em] text-ink-3 uppercase">
              {FIELD_LABELS[conflict.field] ?? conflict.field}
            </span>
            <span className="truncate text-ink-2">
              <span className="mr-1 font-mono text-[9px] tracking-[0.1em] text-ink-3 uppercase">Mine</span>
              {prettyValue(conflict.field, conflict.local)}
            </span>
            <span className="truncate text-foreground">
              <span className="mr-1 font-mono text-[9px] tracking-[0.1em] text-accent uppercase">Import</span>
              {prettyValue(conflict.field, conflict.imported)}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-2.5 flex flex-wrap gap-1.5" role="radiogroup" aria-label={`Resolution for ${item.title}`}>
        {(
          [
            { value: "keep", label: "Keep mine" },
            { value: "import", label: "Use import" },
            { value: "skip", label: "Skip" },
          ] as const
        ).map((option) => {
          const active = effective === option.value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onDecide(option.value)}
              className={cn(
                "rounded-full border px-2.5 py-1 font-mono text-[10px] tracking-[0.08em] uppercase",
                "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
                active
                  ? "border-accent/60 bg-accent/10 text-accent"
                  : "border-line-2/70 text-ink-3 hover:text-foreground",
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </li>
  );
}

function JobDetails({
  job,
  onChanged,
}: {
  job: ImportJobDetailsDto;
  onChanged: () => void;
}) {
  const [bulk, setBulk] = useState<"keep" | "import">("keep");
  const [decisions, setDecisions] = useState<Record<number, "keep" | "import" | "skip">>({});
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const conflicts = job.items.filter((item) => item.status === "conflict");
  const ready = job.items.filter((item) => item.status === "ready");
  const unmatched = job.items.filter((item) => item.status === "unmatched");
  const failed = job.items.filter((item) => item.status === "failed");

  const apply = async () => {
    if (applying) return;
    setApplying(true);
    setError(null);
    const { error: message } = await resolveImport(job.id, bulk, decisions);
    setApplying(false);
    if (message !== null) {
      setError(message);
      return;
    }
    setDecisions({});
    onChanged();
  };

  const progressPct =
    job.totalItems > 0 ? Math.min(100, Math.round((job.processedItems / job.totalItems) * 100)) : 0;

  return (
    <section
      aria-label={`Import ${job.fileName || `#${job.id}`}`}
      className="rounded-xl border border-line bg-surface-2/60 p-4 sm:p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <h2 className="truncate text-[15px] font-semibold text-foreground">
            {job.fileName || `Import #${job.id}`}
          </h2>
          <p className="mt-0.5 font-mono text-[10px] tracking-[0.1em] text-ink-3 uppercase">
            {job.source} · {statusLabel(job.status)} · {job.processedItems}/{job.totalItems}
          </p>
        </div>
        {!TERMINAL_IMPORT_STATUSES.has(job.status) && (
          <button
            type="button"
            onClick={async () => {
              const message = await cancelImport(job.id);
              if (message === null) onChanged();
              else setError(message);
            }}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md border border-line-2/70 px-3 py-1.5 font-mono text-[11px] tracking-[0.08em] text-ink-2 uppercase",
              "transition-colors hover:bg-surface-3 hover:text-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
            )}
          >
            <X className="size-3" strokeWidth={2} aria-hidden="true" />
            Cancel
          </button>
        )}
      </div>

      {!TERMINAL_IMPORT_STATUSES.has(job.status) && (
        <div
          className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-3"
          role="progressbar"
          aria-valuenow={progressPct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Import progress"
        >
          <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${progressPct}%` }} />
        </div>
      )}

      {job.status === "completed" && (
        <p className="mt-3 inline-flex items-center gap-1.5 text-[13px] text-emerald-600 dark:text-emerald-400">
          <Check className="size-4" strokeWidth={2} aria-hidden="true" />
          {job.addedCount} added · {job.updatedCount} updated · {job.skippedCount} skipped
        </p>
      )}
      {job.status === "failed" && (
        <p className="mt-3 text-[13px] text-[#C4533C] dark:text-[#D9705A]">
          {job.error ?? "Import failed."}
        </p>
      )}

      {job.status === "awaiting_resolution" && (
        <div className="mt-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[10px] tracking-[0.12em] text-ink-3 uppercase">
              Bulk default:
            </span>
            {(
              [
                { value: "keep", label: "Keep all mine" },
                { value: "import", label: "Use all imported" },
              ] as const
            ).map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={bulk === option.value}
                onClick={() => setBulk(option.value)}
                className={cn(
                  "rounded-full border px-3 py-1.5 font-mono text-[11px] tracking-[0.08em] uppercase",
                  "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
                  bulk === option.value
                    ? "border-transparent bg-foreground text-background"
                    : "border-line-2/70 text-ink-2 hover:bg-surface-3 hover:text-foreground",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>

          {ready.length > 0 && (
            <p className="mt-3 text-[13px] text-ink-2">
              {ready.length} new {ready.length === 1 ? "title" : "titles"} will be added.
            </p>
          )}

          <ul className="mt-3 space-y-2.5">
            {conflicts.map((item) => (
              <ConflictCard
                key={item.id}
                item={item}
                effective={decisions[item.id] ?? bulk}
                onDecide={(decision) =>
                  setDecisions((prev) => ({ ...prev, [item.id]: decision }))
                }
              />
            ))}
          </ul>

          {unmatched.length > 0 && (
            <details className="mt-3 rounded-lg border border-line-2/70 px-3.5 py-2.5">
              <summary className="cursor-pointer text-[13px] text-ink-2">
                {unmatched.length} couldn&rsquo;t be matched — will be skipped
              </summary>
              <ul className="mt-2 space-y-1">
                {unmatched.map((item) => (
                  <li key={item.id} className="truncate text-[12px] text-ink-3">
                    {item.title}
                  </li>
                ))}
              </ul>
            </details>
          )}
          {failed.length > 0 && (
            <p className="mt-2 text-[12px] text-ink-3">
              {failed.length} couldn&rsquo;t be processed — will be skipped.
            </p>
          )}

          <div className="mt-4">
            <button
              type="button"
              onClick={() => void apply()}
              disabled={applying}
              className={cn(
                "inline-flex items-center gap-2 rounded-md bg-foreground px-3.5 py-2 font-mono text-[11px] tracking-[0.08em] text-background uppercase",
                "transition-opacity hover:opacity-90",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
                "disabled:pointer-events-none disabled:opacity-50",
              )}
            >
              {applying && <Loader2 className="size-3.5 animate-spin" strokeWidth={2} aria-hidden="true" />}
              Apply import
            </button>
          </div>
          {error && <p className="mt-2 text-[12px] text-[#C4533C] dark:text-[#D9705A]">{error}</p>}
        </div>
      )}
    </section>
  );
}

export default function ImportView() {
  const { user, loading } = useCurrentUser();

  const [jobs, setJobs] = useState<ImportJobDto[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [details, setDetails] = useState<ImportJobDetailsDto | null>(null);
  const [loaded, setLoaded] = useState(false);
  const requestRef = useRef(0);

  const reloadJobs = useCallback(async () => {
    const list = await fetchImportJobs();
    if (list !== null) {
      setJobs(list);
      setLoaded(true);
      // No history list: stick with a job that still needs attention,
      // otherwise follow the newest result.
      setSelectedId((prev) => {
        if (list.length === 0) return null;
        const current = prev === null ? null : (list.find((job) => job.id === prev) ?? null);
        if (current && !TERMINAL_IMPORT_STATUSES.has(current.status)) return prev;
        return list[0].id;
      });
    }
  }, []);

  const reloadDetails = useCallback(async () => {
    if (selectedId === null) {
      setDetails(null);
      return;
    }
    const requestId = ++requestRef.current;
    const job = await fetchImportJob(selectedId);
    if (requestId !== requestRef.current) return;
    setDetails(job);
  }, [selectedId]);

  useEffect(() => {
    if (loading || !user) return;
    const handle = setTimeout(() => {
      void reloadJobs();
    }, 0);
    return () => clearTimeout(handle);
  }, [loading, user, reloadJobs]);

  useEffect(() => {
    const handle = setTimeout(() => {
      void reloadDetails();
    }, 0);
    return () => clearTimeout(handle);
  }, [reloadDetails]);

  // Poll while anything is still moving. Fully passive otherwise.
  useEffect(() => {
    const active =
      jobs.some((job) => !TERMINAL_IMPORT_STATUSES.has(job.status)) ||
      (details !== null && !TERMINAL_IMPORT_STATUSES.has(details.status));
    if (!active || loading || !user) return;

    const timer = setInterval(() => {
      void reloadJobs();
      void reloadDetails();
    }, 2000);
    return () => clearInterval(timer);
  }, [jobs, details, loading, user, reloadJobs, reloadDetails]);

  if (loading || user === null) {
    return (
      <div className="mx-auto w-full max-w-[720px] px-5 py-8 sm:px-8 sm:py-10">
        <SectionLabel>Import</SectionLabel>
        <div className="mt-5 space-y-4" aria-hidden="true">
          {[0, 1].map((index) => (
            <div key={index} className="h-36 animate-pulse rounded-xl bg-surface-3" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[720px] px-5 py-8 sm:px-8 sm:py-10">
      <section aria-labelledby="import-heading">
        <SectionLabel>Import</SectionLabel>
        <h1
          id="import-heading"
          className="mt-5 font-serif text-[clamp(28px,4vw,40px)] leading-[1.08] tracking-[-0.01em] text-foreground"
        >
          Bring your list<span className="text-accent">.</span>
        </h1>
        <p className="mt-3 max-w-xl text-[14px] leading-relaxed text-ink-2">
          Upload an export and keep browsing — matching runs in the background. Anything that
          disagrees with your library waits for your call.
        </p>
      </section>

      <div className="mt-6 space-y-4">
        <UploadCard
          onStarted={(job) => {
            setSelectedId(job.id);
            void reloadJobs();
          }}
        />

        {details && (
          <JobDetails
            key={details.id}
            job={details}
            onChanged={() => {
              void reloadJobs();
              void reloadDetails();
            }}
          />
        )}

        {loaded && (
          <p className="text-center text-[12px] text-ink-3">
          Done here?{" "}
            <Link href="/library" className="text-accent hover:underline">
              Back to your library
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
