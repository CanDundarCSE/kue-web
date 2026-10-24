"use client";

import { Check, Copy, Loader2, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

import {
  confirmPlaybackCandidate,
  createAddonCredential,
  dismissPlaybackCandidate,
  getAddonCredential,
  getPlaybackCandidates,
  revokeAddonCredential,
  type AddonCredentialCreated,
  type AddonCredentialStatus,
  type PlaybackCandidate,
} from "@/lib/api/addon";
import { cn } from "@/lib/utils";

const primaryButtonClass = cn(
  "inline-flex shrink-0 items-center gap-2 rounded-md bg-foreground px-3.5 py-2 font-mono text-[11px] tracking-[0.08em] text-background uppercase",
  "transition-opacity duration-150 motion-reduce:transition-none",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
  "disabled:pointer-events-none disabled:opacity-50",
);

const secondaryButtonClass = cn(
  "inline-flex shrink-0 items-center gap-2 rounded-md border border-line-2 px-3.5 py-2 font-mono text-[11px] tracking-[0.08em] text-ink-2 uppercase",
  "transition-colors duration-150 motion-reduce:transition-none",
  "hover:text-foreground",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
  "disabled:pointer-events-none disabled:opacity-50",
);

const dangerButtonClass = cn(
  "inline-flex shrink-0 items-center gap-2 rounded-md border border-[#C4533C]/40 px-3.5 py-2 font-mono text-[11px] tracking-[0.08em] text-[#C4533C] uppercase",
  "transition-colors duration-150 motion-reduce:transition-none",
  "hover:bg-[#C4533C]/10",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C4533C]/30",
  "disabled:pointer-events-none disabled:opacity-50",
  "dark:border-[#D9705A]/40 dark:text-[#D9705A] dark:hover:bg-[#D9705A]/10",
);

function formatWhen(value: string | null | undefined) {
  if (!value) return "never";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "unknown";
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function episodeLabel(candidate: PlaybackCandidate) {
  if (candidate.season === null && candidate.episode === null) return null;
  const season = candidate.season === null ? "?" : candidate.season;
  const episode = candidate.episode === null ? "?" : candidate.episode;
  return `S${season} · E${episode}`;
}

export default function AddonSection() {
  const [status, setStatus] = useState<AddonCredentialStatus | null>(null);
  const [created, setCreated] = useState<AddonCredentialCreated | null>(null);
  const [candidates, setCandidates] = useState<PlaybackCandidate[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const [credentialStatus, pending] = await Promise.all([
        getAddonCredential(),
        getPlaybackCandidates(),
      ]);
      if (cancelled) return;
      setStatus(credentialStatus);
      setCandidates(pending);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const refresh = async () => {
    const [credentialStatus, pending] = await Promise.all([
      getAddonCredential(),
      getPlaybackCandidates(),
    ]);
    setStatus(credentialStatus);
    setCandidates(pending);
  };

  const generate = async () => {
    setBusy("generate");
    setError(null);
    setNotice(null);
    setCopied(false);

    try {
      const result = await createAddonCredential();
      setCreated(result);
      setStatus({
        configured: true,
        createdAt: result.createdAt,
        lastUsedAt: null,
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not create the addon URL.");
    } finally {
      setBusy(null);
    }
  };

  const revoke = async () => {
    setBusy("revoke");
    setError(null);
    setNotice(null);

    try {
      await revokeAddonCredential();
      setCreated(null);
      setStatus({ configured: false });
      setNotice("Addon access revoked.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not revoke the addon URL.");
    } finally {
      setBusy(null);
    }
  };

  const copy = async () => {
    if (!created) return;
    try {
      await navigator.clipboard.writeText(created.manifestUrl);
      setCopied(true);
    } catch {
      setError("Could not copy automatically — select the URL and copy it manually.");
    }
  };

  const confirm = async (candidate: PlaybackCandidate) => {
    setBusy(`confirm-${candidate.id}`);
    setError(null);
    setNotice(null);

    try {
      await confirmPlaybackCandidate(candidate.id);
      setCandidates((current) => current?.filter((item) => item.id !== candidate.id) ?? current);
      setNotice(
        candidate.mediaType === "movie"
          ? "Added to your library as watched."
          : "Episode progress saved to your library.",
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not confirm this playback.");
    } finally {
      setBusy(null);
    }
  };

  const dismiss = async (candidate: PlaybackCandidate) => {
    setBusy(`dismiss-${candidate.id}`);
    setError(null);
    setNotice(null);

    try {
      await dismissPlaybackCandidate(candidate.id);
      setCandidates((current) => current?.filter((item) => item.id !== candidate.id) ?? current);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not dismiss this candidate.");
    } finally {
      setBusy(null);
    }
  };

  const configured = status?.configured ?? false;

  return (
    <section
      aria-labelledby="settings-addon"
      className="rounded-xl border border-line bg-surface-2/60 p-4 sm:p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2
            id="settings-addon"
            className="font-serif text-[17px] leading-tight text-foreground"
          >
            Nuvio playback bridge
          </h2>
          <p className="mt-1 max-w-[46ch] text-[12px] leading-relaxed text-ink-3">
            Nuvio asks this addon for subtitles when a player starts. Kue records
            that as a playback-start candidate — never as a completed watch. You
            confirm what to save.
          </p>
        </div>
        {configured ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-600/30 px-2.5 py-1 font-mono text-[10px] tracking-[0.08em] text-emerald-600 uppercase dark:border-emerald-400/30 dark:text-emerald-400">
            <Check className="size-3" strokeWidth={2.5} aria-hidden="true" />
            Connected
          </span>
        ) : null}
      </div>

      {error ? (
        <p className="mt-3 text-[12px] text-[#C4533C] dark:text-[#D9705A]">{error}</p>
      ) : null}
      {notice ? (
        <p className="mt-3 inline-flex items-center gap-1.5 text-[12px] text-emerald-600 dark:text-emerald-400">
          <Check className="size-3.5" strokeWidth={2} aria-hidden="true" />
          {notice}
        </p>
      ) : null}

      {created ? (
        <div className="mt-4 rounded-lg border border-line-2/70 bg-background/60 p-3">
          <p className="font-mono text-[10px] tracking-[0.12em] text-ink-3 uppercase">
            Addon manifest URL
          </p>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <code className="min-w-0 flex-1 break-all rounded-md border border-line-2/60 bg-surface-3/50 px-2.5 py-2 text-[11px] leading-relaxed text-foreground">
              {created.manifestUrl}
            </code>
            <button type="button" onClick={copy} className={secondaryButtonClass}>
              {copied ? (
                <Check className="size-3.5" strokeWidth={2} aria-hidden="true" />
              ) : (
                <Copy className="size-3.5" strokeWidth={2} aria-hidden="true" />
              )}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-ink-3">
            Copy this now. Kue stores only a hash and cannot show the URL again.
            Anyone with this URL can record playback candidates for your account.
          </p>
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={generate}
          disabled={busy !== null}
          className={configured ? secondaryButtonClass : primaryButtonClass}
        >
          {busy === "generate" ? (
            <Loader2 className="size-3.5 animate-spin" strokeWidth={2} aria-hidden="true" />
          ) : configured ? null : (
            <Plus className="size-3.5" strokeWidth={2} aria-hidden="true" />
          )}
          {configured ? "Rotate addon URL" : "Generate addon URL"}
        </button>
        {configured ? (
          <button
            type="button"
            onClick={revoke}
            disabled={busy !== null}
            className={dangerButtonClass}
          >
            {busy === "revoke" ? (
              <Loader2 className="size-3.5 animate-spin" strokeWidth={2} aria-hidden="true" />
            ) : (
              <Trash2 className="size-3.5" strokeWidth={2} aria-hidden="true" />
            )}
            Revoke
          </button>
        ) : null}
        <button
          type="button"
          onClick={refresh}
          disabled={busy !== null}
          className={secondaryButtonClass}
        >
          Refresh
        </button>
      </div>

      {status ? (
        <p className="mt-3 text-[11px] text-ink-3">
          {configured
            ? `Created ${formatWhen(status.createdAt)} · last used ${formatWhen(status.lastUsedAt)}`
            : "No addon URL is active."}
        </p>
      ) : null}

      <div className="mt-5 border-t border-line pt-4">
        <h3 className="font-mono text-[10px] tracking-[0.14em] text-ink-3 uppercase">
          Playback candidates
        </h3>
        <p className="mt-1 text-[12px] leading-relaxed text-ink-3">
          These are unconfirmed. A subtitle request only proves that playback was
          started; it says nothing about how much was watched. Kue stores one
          progress number per title, so confirmation advances progress for season 1
          only; later seasons are added without guessing.
        </p>

        {candidates === null ? (
          <div className="mt-3 space-y-2" aria-hidden="true">
            {[0, 1].map((index) => (
              <div key={index} className="h-16 animate-pulse rounded-lg bg-surface-3" />
            ))}
          </div>
        ) : candidates.length === 0 ? (
          <p className="mt-3 text-[12px] text-ink-3">
            Nothing to review. Start a title in Nuvio and it will appear here.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {candidates.map((candidate) => {
              const episode = episodeLabel(candidate);
              const confirming = busy === `confirm-${candidate.id}`;
              const dismissing = busy === `dismiss-${candidate.id}`;

              return (
                <li
                  key={candidate.id}
                  className="flex flex-col gap-3 rounded-lg border border-line-2/60 bg-background/40 p-3 sm:flex-row sm:items-center"
                >
                  {candidate.coverImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={candidate.coverImage}
                      alt=""
                      className="h-16 w-11 shrink-0 rounded object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="h-16 w-11 shrink-0 rounded bg-surface-3" aria-hidden="true" />
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-foreground">
                      {candidate.title ?? candidate.externalId}
                    </p>
                    <p className="mt-0.5 text-[11px] text-ink-3">
                      {candidate.year ? `${candidate.year} · ` : ""}
                      {episode ? `${episode} · ` : ""}
                      {candidate.mediaType === "movie" ? "Movie" : "Series"}
                      {candidate.requestCount > 1 ? ` · ${candidate.requestCount} requests` : ""}
                    </p>
                    <p className="mt-0.5 text-[11px] text-ink-3">
                      Last seen {formatWhen(candidate.lastSeenAt)}
                      {candidate.isResolved
                        ? ""
                        : " · not matched to Kue media yet"}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => confirm(candidate)}
                      disabled={busy !== null || !candidate.isResolved}
                      title={
                        candidate.isResolved
                          ? "Save to your library"
                          : "Kue could not match this title to TMDB yet"
                      }
                      className={primaryButtonClass}
                    >
                      {confirming ? (
                        <Loader2
                          className="size-3.5 animate-spin"
                          strokeWidth={2}
                          aria-hidden="true"
                        />
                      ) : (
                        <Check className="size-3.5" strokeWidth={2} aria-hidden="true" />
                      )}
                      Confirm
                    </button>
                    <button
                      type="button"
                      onClick={() => dismiss(candidate)}
                      disabled={busy !== null}
                      className={secondaryButtonClass}
                      aria-label={`Dismiss ${candidate.title ?? candidate.externalId}`}
                    >
                      {dismissing ? (
                        <Loader2
                          className="size-3.5 animate-spin"
                          strokeWidth={2}
                          aria-hidden="true"
                        />
                      ) : (
                        <Trash2 className="size-3.5" strokeWidth={2} aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
