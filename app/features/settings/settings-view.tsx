"use client";

import { Check, Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import SectionLabel from "@/app/features/home/section-label";
import { changePassword, updateMe } from "@/lib/api/me";
import { useCurrentUser } from "@/lib/use-current-user";
import { cn } from "@/lib/utils";

const inputClass = cn(
  "h-10 w-full rounded-lg border border-line-2/70 bg-background px-3 text-[13px] text-foreground placeholder:text-ink-3",
  "transition-colors duration-150 motion-reduce:transition-none",
  "hover:border-line-2",
  "focus:border-accent focus:ring-2 focus:ring-accent/30 focus:outline-none",
  "disabled:pointer-events-none disabled:opacity-50",
);

const saveButtonClass = cn(
  "inline-flex shrink-0 items-center gap-2 rounded-md bg-foreground px-3.5 py-2 font-mono text-[11px] tracking-[0.08em] text-background uppercase",
  "transition-opacity duration-150 motion-reduce:transition-none",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
  "disabled:pointer-events-none disabled:opacity-50",
);

function FieldError({ message }: { message: string | null }) {
  if (!message) return null;
  return <p className="mt-2 text-[12px] text-[#C4533C] dark:text-[#D9705A]">{message}</p>;
}

function FieldSuccess({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p className="mt-2 inline-flex items-center gap-1.5 text-[12px] text-emerald-600 dark:text-emerald-400">
      <Check className="size-3.5" strokeWidth={2} aria-hidden="true" />
      {message}
    </p>
  );
}

function UsernameSection() {
  const { user } = useCurrentUser();
  const [value, setValue] = useState("");
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Seed from the session once it arrives. Deferred like other data effects
  // here: setState must not run synchronously in the effect body.
  useEffect(() => {
    if (!user || dirty) return;
    const handle = setTimeout(() => setValue(user.username), 0);
    return () => clearTimeout(handle);
  }, [user, dirty]);

  const save = async () => {
    const trimmed = value.trim();
    if (trimmed.length < 3 || trimmed.length > 50) {
      setError("Username must be between 3 and 50 characters.");
      return;
    }
    if (trimmed === user?.username || saving) return;

    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      // Session sync pushes the updated user into context everywhere.
      await updateMe({ username: trimmed });
      setSaved(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Couldn't update username.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section aria-labelledby="settings-username" className="rounded-xl border border-line bg-surface-2/60 p-4 sm:p-5">
      <h2 id="settings-username" className="font-mono text-[11px] tracking-[0.16em] text-ink-2 uppercase">
        Username
      </h2>
      <p className="mt-1.5 text-[13px] text-ink-2">
        Unique across Kue — this is how friends find you, alongside your Kue ID.
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            setDirty(true);
            setSaved(false);
          }}
          maxLength={50}
          autoComplete="username"
          aria-label="Username"
          disabled={saving}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void save();
            }
          }}
          className={inputClass}
        />
        <button type="button" onClick={() => void save()} disabled={saving} className={saveButtonClass}>
          {saving && <Loader2 className="size-3.5 animate-spin" strokeWidth={2} aria-hidden="true" />}
          Save
        </button>
      </div>
      <FieldError message={error} />
      <FieldSuccess message={saved ? "Username updated." : null} />
    </section>
  );
}

function EmailSection() {
  const { user } = useCurrentUser();
  const [value, setValue] = useState("");
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user || dirty) return;
    const handle = setTimeout(() => setValue(user.email), 0);
    return () => clearTimeout(handle);
  }, [user, dirty]);

  const save = async () => {
    const trimmed = value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("Enter a valid email address.");
      return;
    }
    if (trimmed === user?.email || saving) return;

    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      await updateMe({ email: trimmed });
      setSaved(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Couldn't update email.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section aria-labelledby="settings-email" className="rounded-xl border border-line bg-surface-2/60 p-4 sm:p-5">
      <h2 id="settings-email" className="font-mono text-[11px] tracking-[0.16em] text-ink-2 uppercase">
        Email
      </h2>
      <p className="mt-1.5 text-[13px] text-ink-2">
        Used for sign-in and password recovery.
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          type="email"
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            setDirty(true);
            setSaved(false);
          }}
          maxLength={256}
          autoComplete="email"
          aria-label="Email"
          disabled={saving}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void save();
            }
          }}
          className={inputClass}
        />
        <button type="button" onClick={() => void save()} disabled={saving} className={saveButtonClass}>
          {saving && <Loader2 className="size-3.5 animate-spin" strokeWidth={2} aria-hidden="true" />}
          Save
        </button>
      </div>
      <FieldError message={error} />
      <FieldSuccess message={saved ? "Email updated." : null} />
    </section>
  );
}

const PASSWORD_PATTERN = /^(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).+$/;

function PasswordSection() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const save = async () => {
    if (saving) return;

    if (!current) {
      setError("Enter your current password.");
      return;
    }
    if (next.length < 8) {
      setError("New password must be at least 8 characters long.");
      return;
    }
    if (!PASSWORD_PATTERN.test(next)) {
      setError("New password must contain at least one uppercase letter and one special character.");
      return;
    }
    if (next !== confirm) {
      setError("New passwords don't match.");
      return;
    }

    setSaving(true);
    setError(null);
    setSaved(false);

    const message = await changePassword({ currentPassword: current, newPassword: next });
    setSaving(false);

    if (message !== null) {
      setError(message);
      return;
    }

    setCurrent("");
    setNext("");
    setConfirm("");
    setSaved(true);
  };

  const field = (
    label: string,
    value: string,
    onChange: (next: string) => void,
    autoComplete: string,
  ) => (
    <label className="block">
      <span className="mb-1.5 block font-mono text-[10px] tracking-[0.12em] text-ink-3 uppercase">
        {label}
      </span>
      <input
        type="password"
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          setSaved(false);
        }}
        autoComplete={autoComplete}
        disabled={saving}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            void save();
          }
        }}
        className={inputClass}
      />
    </label>
  );

  return (
    <section aria-labelledby="settings-password" className="rounded-xl border border-line bg-surface-2/60 p-4 sm:p-5">
      <h2 id="settings-password" className="font-mono text-[11px] tracking-[0.16em] text-ink-2 uppercase">
        Password
      </h2>
      <p className="mt-1.5 text-[13px] text-ink-2">
        At least 8 characters, with one uppercase letter and one special character.
      </p>
      <div className="mt-3 grid gap-3 sm:max-w-md">
        {field("Current password", current, setCurrent, "current-password")}
        {field("New password", next, setNext, "new-password")}
        {field("Confirm new password", confirm, setConfirm, "new-password")}
      </div>
      <div className="mt-3">
        <button type="button" onClick={() => void save()} disabled={saving} className={saveButtonClass}>
          {saving && <Loader2 className="size-3.5 animate-spin" strokeWidth={2} aria-hidden="true" />}
          Change password
        </button>
      </div>
      <FieldError message={error} />
      <FieldSuccess message={saved ? "Password changed." : null} />
    </section>
  );
}

export default function SettingsView() {
  const { user, loading } = useCurrentUser();

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-[720px] px-5 py-8 sm:px-8 sm:py-10">
        <SectionLabel>Settings</SectionLabel>
        <div className="mt-5 space-y-4" aria-hidden="true">
          {[0, 1, 2].map((index) => (
            <div key={index} className="h-36 animate-pulse rounded-xl bg-surface-3" />
          ))}
        </div>
      </div>
    );
  }

  if (user === null) {
    return (
      <div className="mx-auto flex w-full max-w-[720px] flex-col items-center px-5 py-24 text-center sm:px-8">
        <span className="font-mono text-[10px] tracking-[0.2em] text-ink-3 uppercase">
          Settings
        </span>
        <h1 className="mt-4 font-serif text-[28px] leading-tight text-foreground">
          Sign in to manage your account<span className="text-accent">.</span>
        </h1>
        <Link
          href="/login"
          className="mt-6 rounded-lg bg-foreground px-4 py-2 text-xs font-semibold text-background transition-opacity hover:opacity-90"
        >
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[720px] px-5 py-8 sm:px-8 sm:py-10">
      <section aria-labelledby="settings-heading">
        <SectionLabel>Settings</SectionLabel>
        <h1
          id="settings-heading"
          className="mt-5 font-serif text-[clamp(28px,4vw,40px)] leading-[1.08] tracking-[-0.01em] text-foreground"
        >
          Your account<span className="text-accent">.</span>
        </h1>
      </section>

      <div className="mt-6 space-y-4">
        <UsernameSection />
        <EmailSection />
        <PasswordSection />
      </div>
    </div>
  );
}
