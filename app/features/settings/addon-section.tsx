"use client";

import { Check, Copy, Loader2, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

import {
  createAddonCredential,
  getAddonCredentials,
  revokeAddonCredential,
  type AddonCredential,
  type AddonCredentialCreated,
  type AddonCredentialList,
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

function suggestedLabel() {
  if (typeof navigator === "undefined") return "";
  const ua = navigator.userAgent;
  if (/Windows/i.test(ua)) return "Windows PC";
  if (/Android/i.test(ua)) return "Android device";
  if (/iPhone|iPad|iPod/i.test(ua)) return "iPhone / iPad";
  if (/Macintosh|Mac OS X/i.test(ua)) return "macOS";
  if (/Linux/i.test(ua)) return "Linux PC";
  return "";
}

export default function AddonSection() {
  const [status, setStatus] = useState<AddonCredentialList | null>(null);
  const [created, setCreated] = useState<AddonCredentialCreated | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [label, setLabel] = useState("");
  const [confirmRevokeAll, setConfirmRevokeAll] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const credentialStatus = await getAddonCredentials();
      if (cancelled) return;
      setStatus(credentialStatus);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const refresh = async () => {
    setBusy("refresh");
    setError(null);
    setStatus(await getAddonCredentials());
    setBusy(null);
  };

  const generate = async () => {
    setBusy("generate");
    setError(null);
    setNotice(null);
    setCopied(false);

    try {
      const result = await createAddonCredential(label.trim() || suggestedLabel() || undefined);
      setCreated(result);
      setStatus((current) => ({
        configured: true,
        credentials: [
          {
            id: result.id,
            label: result.label,
            createdAt: result.createdAt,
            lastUsedAt: null,
          },
          ...(current?.credentials ?? []),
        ],
      }));
      setNotice("New addon URL created. Your other devices stay connected.");
      setLabel("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not create the addon URL.");
    } finally {
      setBusy(null);
    }
  };

  const revokeOne = async (credential: AddonCredential) => {
    setBusy(`revoke-${credential.id}`);
    setError(null);
    setNotice(null);

    try {
      await revokeAddonCredential(credential.id);
      if (created?.id === credential.id) setCreated(null);
      setStatus((current) => {
        const remaining = (current?.credentials ?? []).filter(
          (entry) => entry.id !== credential.id,
        );
        return { configured: remaining.length > 0, credentials: remaining };
      });
      setNotice(
        credential.label
          ? `${credential.label} disconnected. Other devices stay connected.`
          : "Device disconnected. Other devices stay connected.",
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not revoke the addon URL.");
    } finally {
      setBusy(null);
    }
  };

  const revokeAll = async () => {
    setBusy("revoke-all");
    setError(null);
    setNotice(null);

    try {
      await revokeAddonCredential();
      setCreated(null);
      setStatus({ configured: false, credentials: [] });
      setConfirmRevokeAll(false);
      setNotice("All addon URLs revoked.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not revoke the addon URLs.");
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
  const credentials = status?.credentials ?? [];

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
            {credentials.length > 1 ? ` · ${credentials.length}` : null}
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
          Each device needs its own URL. Adding one here does not disconnect your
          other devices. Series and anime progress advances to the episode you
          open, using absolute episode numbers across seasons. Opening a title
          never marks it completed.
        </p>
      </div>

      {created ? (
        <div className="mt-4 rounded-lg border border-line-2/70 bg-background/60 p-3">
          <p className="font-mono text-[10px] tracking-[0.12em] text-ink-3 uppercase">
            Addon manifest URL{created.label ? ` · ${created.label}` : ""}
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
            Copy this now and install it in Nuvio on this device. Kue stores only a
            hash and cannot show the URL again. Anyone with this URL can update
            your library.
          </p>
        </div>
      ) : null}

      {credentials.length > 0 ? (
        <div className="mt-4">
          <p className="font-mono text-[10px] tracking-[0.12em] text-ink-3 uppercase">
            Connected devices
          </p>
          <ul className="mt-2 divide-y divide-line overflow-hidden rounded-lg border border-line-2/60">
            {credentials.map((credential) => (
              <li
                key={credential.id}
                className="flex flex-wrap items-center justify-between gap-3 bg-background/40 px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-[12px] font-medium text-foreground">
                    {credential.label ?? "Addon connection"}
                  </p>
                  <p className="mt-0.5 text-[11px] text-ink-3">
                    Created {formatWhen(credential.createdAt)} · last used{" "}
                    {formatWhen(credential.lastUsedAt)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void revokeOne(credential)}
                  disabled={busy !== null}
                  aria-label={`Revoke ${credential.label ?? "addon connection"}`}
                  className={dangerButtonClass}
                >
                  {busy === `revoke-${credential.id}` ? (
                    <Loader2 className="size-3.5 animate-spin" strokeWidth={2} aria-hidden="true" />
                  ) : (
                    <Trash2 className="size-3.5" strokeWidth={2} aria-hidden="true" />
                  )}
                  Revoke
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <label className="flex min-w-0 flex-1 items-center gap-2">
          <span className="sr-only">Connection label</span>
          <input
            type="text"
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            maxLength={40}
            placeholder="Label this device (e.g. Windows PC)"
            disabled={busy !== null}
            className="min-w-0 flex-1 rounded-md border border-line-2/70 bg-background/60 px-2.5 py-2 text-[12px] text-foreground placeholder:text-ink-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
          />
        </label>
        <button
          type="button"
          onClick={generate}
          disabled={busy !== null}
          className={configured ? secondaryButtonClass : primaryButtonClass}
        >
          {busy === "generate" ? (
            <Loader2 className="size-3.5 animate-spin" strokeWidth={2} aria-hidden="true" />
          ) : (
            <Plus className="size-3.5" strokeWidth={2} aria-hidden="true" />
          )}
          {configured ? "Add device" : "Generate addon URL"}
        </button>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        {configured ? (
          confirmRevokeAll ? (
            <span className="inline-flex flex-wrap items-center gap-2 rounded-md border border-[#C4533C]/30 px-2.5 py-1.5 text-[11px] text-ink-2">
              Disconnect every device?
              <button
                type="button"
                onClick={revokeAll}
                disabled={busy !== null}
                className={dangerButtonClass}
              >
                {busy === "revoke-all" ? (
                  <Loader2 className="size-3.5 animate-spin" strokeWidth={2} aria-hidden="true" />
                ) : null}
                Yes, revoke all
              </button>
              <button
                type="button"
                onClick={() => setConfirmRevokeAll(false)}
                disabled={busy !== null}
                className={secondaryButtonClass}
              >
                Cancel
              </button>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmRevokeAll(true)}
              disabled={busy !== null}
              className={dangerButtonClass}
            >
              <Trash2 className="size-3.5" strokeWidth={2} aria-hidden="true" />
              Revoke all
            </button>
          )
        ) : null}
        <button
          type="button"
          onClick={refresh}
          disabled={busy !== null}
          className={secondaryButtonClass}
        >
          {busy === "refresh" ? (
            <Loader2 className="size-3.5 animate-spin" strokeWidth={2} aria-hidden="true" />
          ) : null}
          Refresh
        </button>
      </div>
    </section>
  );
}
