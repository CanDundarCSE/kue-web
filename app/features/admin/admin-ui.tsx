import type { ReactNode } from "react";

import { Button } from "@/app/components/ui/button";
import { cn } from "@/lib/utils";

export const inputClass =
  "h-9 w-full rounded-lg border border-line-2/70 bg-background px-3 text-[13px] text-foreground placeholder:text-ink-3 transition-colors hover:border-line-2 focus:border-accent focus:ring-2 focus:ring-accent/30 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50";

export const selectClass =
  "h-9 rounded-lg border border-line-2/70 bg-background px-2.5 text-[12px] text-foreground transition-colors hover:border-line-2 focus:border-accent focus:ring-2 focus:ring-accent/30 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50";

export const labelClass =
  "font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3";

export const tableWrapClass = "overflow-x-auto rounded-lg border border-line";

export const tableClass = "min-w-full text-left text-[13px]";

export const thClass =
  "whitespace-nowrap border-b border-line bg-surface-3/40 px-3 py-2 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-ink-3";

export const tdClass =
  "border-b border-line/70 px-3 py-2.5 align-middle text-ink-2 last:border-b-0";

export function AdminPage({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-[1160px] px-5 py-8 sm:px-8 sm:py-10", className)}>
      {children}
    </div>
  );
}

export function Panel({
  title,
  description,
  action,
  children,
  className,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-xl border border-line bg-surface-2/60 p-4 sm:p-5", className)}>
      {(title || description || action) && (
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            {title && (
              <h2 className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-2">
                {title}
              </h2>
            )}
            {description && (
              <p className="mt-1.5 max-w-xl text-[13px] leading-relaxed text-ink-2">
                {description}
              </p>
            )}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "default",
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
  tone?: "default" | "danger" | "success";
}) {
  return (
    <div className="rounded-xl border border-line bg-surface-2/60 p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">{label}</p>
        {icon && (
          <span
            className={cn(
              "grid size-8 shrink-0 place-items-center rounded-lg border",
              tone === "danger"
                ? "border-red-500/25 bg-red-500/10 text-red-600 dark:text-red-400"
                : tone === "success"
                  ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "border-line bg-surface-3/60 text-ink-2",
            )}
          >
            {icon}
          </span>
        )}
      </div>
      <p className="mt-3 text-[26px] leading-none font-semibold tracking-[-0.02em] text-foreground">
        {value}
      </p>
      {hint && <p className="mt-2 text-[12px] text-ink-3">{hint}</p>}
    </div>
  );
}

export function StatusPill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em]",
        ok
          ? "border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
          : "border-red-500/30 text-red-600 dark:text-red-400",
      )}
    >
      <span className={cn("size-1.5 rounded-full", ok ? "bg-emerald-500" : "bg-red-500")} />
      {label}
    </span>
  );
}

export function RoleBadge({ role }: { role: string }) {
  const isAdmin = role.toLowerCase() === "admin";
  return (
    <span
      className={cn(
        "inline-flex rounded-md border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.08em]",
        isAdmin
          ? "border-accent/40 bg-accent/10 text-accent"
          : "border-line-2/70 text-ink-2",
      )}
    >
      {role}
    </span>
  );
}

export function ErrorBanner({
  message,
  onDismiss,
}: {
  message: string | null;
  onDismiss?: () => void;
}) {
  if (!message) return null;

  return (
    <div
      role="alert"
      className="mt-4 flex items-start justify-between gap-3 rounded-lg border border-red-500/30 bg-red-500/5 px-3.5 py-3 text-[13px] text-red-700 dark:text-red-300"
    >
      <p className="min-w-0 break-words">{message}</p>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 text-[11px] font-medium underline underline-offset-2 opacity-80 transition-opacity hover:opacity-100"
        >
          Dismiss
        </button>
      )}
    </div>
  );
}

export function Pagination({
  page,
  totalPages,
  totalItems,
  onPage,
  busy = false,
}: {
  page: number;
  totalPages: number;
  totalItems: number;
  onPage: (page: number) => void;
  busy?: boolean;
}) {
  if (totalPages <= 1) {
    return (
      <p className="mt-3 text-[12px] text-ink-3">
        {totalItems.toLocaleString("en-US")} total
      </p>
    );
  }

  return (
    <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-[12px] text-ink-3">
      <span>
        {totalItems.toLocaleString("en-US")} total · page {page} of {totalPages}
      </span>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={busy || page <= 1}
          onClick={() => onPage(page - 1)}
        >
          Previous
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={busy || page >= totalPages}
          onClick={() => onPage(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

export function formatDate(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatRelative(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  const seconds = Math.round((date.getTime() - Date.now()) / 1000);
  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const ranges: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["year", 60 * 60 * 24 * 365],
    ["month", 60 * 60 * 24 * 30],
    ["week", 60 * 60 * 24 * 7],
    ["day", 60 * 60 * 24],
    ["hour", 60 * 60],
    ["minute", 60],
  ];

  for (const [unit, size] of ranges) {
    if (Math.abs(seconds) >= size) {
      return formatter.format(Math.round(seconds / size), unit);
    }
  }

  return "just now";
}

export function formatBytes(value?: number | null): string {
  if (value === null || value === undefined || !Number.isFinite(value) || value < 0) {
    return "—";
  }
  if (value < 1024) return `${value} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let amount = value / 1024;
  let index = 0;
  while (amount >= 1024 && index < units.length - 1) {
    amount /= 1024;
    index += 1;
  }
  return `${amount.toFixed(amount >= 10 ? 1 : 2)} ${units[index]}`;
}

export function formatUptime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "—";
  const days = Math.floor(seconds / 86_400);
  const hours = Math.floor((seconds % 86_400) / 3_600);
  const minutes = Math.floor((seconds % 3_600) / 60);

  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}
