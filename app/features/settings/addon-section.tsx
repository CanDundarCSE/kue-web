"use client";

import { Check, Copy, Loader2, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

import {
  createAddonCredential,
  getAddonCredential,
  revokeAddonCredential,
  type AddonCredentialCreated,
  type AddonCredentialStatus,
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

export default function AddonSection() {
  const [status, setStatus] = useState<AddonCredentialStatus | null>(null);
  const [created, setCreated] = useState<AddonCredentialCreated | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const credentialStatus = await getAddonCredential();
      if (cancelled) return;
      setStatus(credentialStatus);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const refresh = async () => {
    setStatus(await getAddonCredential());
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
            Nuvio connection
          </h2>
          <p className="mt-1 max-w-[46ch] text-[12px] leading-relaxed text-ink-3">
            Connect Nuvio once and Kue keeps your library in sync as you watch.
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

      <div className="mt-3 rounded-lg border border-line-2/60 bg-background/40 p-3">
        <p className="text-[12px] leading-relaxed text-ink-2">
          {configured
            ? "Nuvio is connected. Movies and series you open are added to your library automatically. Movie completion is still managed in Kue."
            : "No addon URL is active. Generate one below and install it in Nuvio to start tracking automatically."}
        </p>
        <p className="mt-1.5 text-[11px] leading-relaxed text-ink-3">
          Series and anime progress advances to the episode you open, using
          absolute episode numbers across seasons. Opening a title never marks it
          completed.
        </p>
      </div>

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
            Anyone with this URL can update your library.
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
    </section>
  );
}
