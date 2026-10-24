"use client";

import { Check, Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import SectionLabel from "@/app/features/home/section-label";
import AddonSection from "@/app/features/settings/addon-section";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { avatarSrc, AVATAR_IDS } from "@/lib/avatars";
import { changePassword, deleteAccount, updateMe } from "@/lib/api/me";
import { initialOf } from "@/lib/current-user";
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

const destructiveButtonClass = cn(
  "inline-flex shrink-0 items-center gap-2 rounded-md border border-[#C4533C]/40 px-3.5 py-2 font-mono text-[11px] tracking-[0.08em] text-[#C4533C] uppercase",
  "transition-colors duration-150 motion-reduce:transition-none",
  "hover:bg-[#C4533C]/10",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C4533C]/30",
  "disabled:pointer-events-none disabled:opacity-50",
  "dark:border-[#D9705A]/40 dark:text-[#D9705A] dark:hover:bg-[#D9705A]/10 dark:focus-visible:ring-[#D9705A]/30",
);

const cancelButtonClass = cn(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-md border border-line-2 px-3.5 py-2 font-mono text-[11px] tracking-[0.08em] text-ink-2 uppercase",
  "transition-colors duration-150 motion-reduce:transition-none",
  "hover:text-foreground",
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

function AvatarSection() {
  const { user } = useCurrentUser();
  // Id of the avatar being saved ("initials" while clearing); null = idle.
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const current = user?.avatarId ?? null;

  const choose = async (next: string | null) => {
    if (saving || next === current) return;

    setSaving(next ?? "initials");
    setError(null);
    setSaved(false);

    try {
      // null would mean "unchanged" on the backend, so "" clears the avatar.
      // Session sync pushes the updated user into context everywhere.
      await updateMe({ avatarId: next ?? "" });
      setSaved(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Couldn't update avatar.");
    } finally {
      setSaving(null);
    }
  };

  const optionClass = (selected: boolean) =>
    cn(
      "relative grid aspect-square place-items-center overflow-hidden rounded-lg border bg-accent-soft text-[15px] font-semibold text-accent",
      "transition-colors duration-150 motion-reduce:transition-none",
      "hover:border-line-2",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
      "disabled:pointer-events-none disabled:opacity-50",
      selected ? "border-accent ring-2 ring-accent/30" : "border-line-2/70",
    );

  return (
    <section aria-labelledby="settings-avatar" className="rounded-xl border border-line bg-surface-2/60 p-4 sm:p-5">
      <h2 id="settings-avatar" className="font-mono text-[11px] tracking-[0.16em] text-ink-2 uppercase">
        Avatar
      </h2>
      <p className="mt-1.5 text-[13px] text-ink-2">
        Pick a critter — or stick with your initial.
      </p>
      <div className="mt-3 grid grid-cols-5 gap-2 sm:grid-cols-10" role="group" aria-label="Choose an avatar">
        <button
          type="button"
          onClick={() => void choose(null)}
          disabled={saving !== null}
          aria-pressed={current === null}
          aria-label="Use your initial as avatar"
          title="Use your initial"
          className={optionClass(current === null)}
        >
          {user ? initialOf(user.username) : "?"}
        </button>
        {AVATAR_IDS.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => void choose(id)}
            disabled={saving !== null}
            aria-pressed={current === id}
            aria-label={`Use the ${id} avatar`}
            title={id}
            className={optionClass(current === id)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- local SVG avatar; next/image refuses SVGs without dangerouslyAllowSVG. */}
            <img src={avatarSrc(id)} alt="" className="size-full object-cover" draggable={false} />
            {saving === id && (
              <span className="absolute inset-0 grid place-items-center bg-background/60">
                <Loader2 className="size-4 animate-spin text-foreground" strokeWidth={2} aria-hidden="true" />
              </span>
            )}
          </button>
        ))}
      </div>
      <FieldError message={error} />
      <FieldSuccess message={saved ? "Avatar updated." : null} />
    </section>
  );
}

function PrivacySection() {
  const { user } = useCurrentUser();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isPrivate = user?.isPrivate ?? false;

  const toggle = async () => {
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      // Session sync pushes the updated user into context everywhere,
      // so the profile header badge flips without a refetch.
      await updateMe({ isPrivate: !isPrivate });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Couldn't update privacy.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section aria-labelledby="settings-privacy" className="rounded-xl border border-line bg-surface-2/60 p-4 sm:p-5">
      <h2 id="settings-privacy" className="font-mono text-[11px] tracking-[0.16em] text-ink-2 uppercase">
        Privacy
      </h2>
      <p className="mt-1.5 text-[13px] text-ink-2">
        Private accounts only show the profile card to strangers — library, lists and
        activity stay visible to mutual friends.
      </p>
      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="font-mono text-[11px] tracking-[0.08em] text-ink-2 uppercase">
          {isPrivate ? "Private account" : "Public account"}
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={isPrivate}
          aria-label="Private account"
          onClick={() => void toggle()}
          disabled={saving}
          className={cn(
            "relative h-6 w-11 shrink-0 rounded-full transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
            "disabled:pointer-events-none disabled:opacity-50",
            isPrivate ? "bg-foreground" : "bg-surface-3",
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              "absolute top-0.5 left-0.5 size-5 rounded-full bg-background shadow transition-transform",
              isPrivate && "translate-x-5",
            )}
          />
        </button>
      </div>
      <FieldError message={error} />
    </section>
  );
}

function DeleteAccountSection() {
  const { user } = useCurrentUser();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirmDelete = async () => {
    if (deleting) return;

    setDeleting(true);
    setError(null);

    const message = await deleteAccount();
    if (message !== null) {
      // Surface the reason but keep the modal semantics intact: the user can
      // retry or cancel from the same dialog.
      setError(message);
      setDeleting(false);
      setOpen(false);
      return;
    }

    // The account is gone and the session cookies were cleared by the BFF. A
    // full navigation discards all client state and lands on the sign-in page.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign("/login");
  };

  return (
    <section
      aria-labelledby="settings-delete"
      className="rounded-xl border border-[#C4533C]/30 bg-surface-2/60 p-4 sm:p-5 dark:border-[#D9705A]/30"
    >
      <h2
        id="settings-delete"
        className="font-mono text-[11px] tracking-[0.16em] text-[#C4533C] uppercase dark:text-[#D9705A]"
      >
        Delete account
      </h2>
      <p className="mt-1.5 text-[13px] text-ink-2">
        Permanently delete your account and personal data &mdash; your right to erasure
        (right to be forgotten). This removes your profile, library, lists, ratings
        and reviews, and cannot be undone.
      </p>
      <div className="mt-3">
        <button
          type="button"
          onClick={() => {
            setError(null);
            setOpen(true);
          }}
          className={destructiveButtonClass}
        >
          Delete my account
        </button>
      </div>
      <FieldError message={error} />

      <Dialog open={open} onOpenChange={(next) => (!deleting ? setOpen(next) : undefined)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete your account?</DialogTitle>
            <DialogDescription>
              This permanently deletes{" "}
              <span className="font-medium text-foreground">{user?.username}</span> and
              all of your library entries, custom lists, ratings, reviews and profile
              data. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <button
              type="button"
              onClick={() => setOpen(false)}
              disabled={deleting}
              className={cancelButtonClass}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void confirmDelete()}
              disabled={deleting}
              className={destructiveButtonClass}
            >
              {deleting && (
                <Loader2 className="size-3.5 animate-spin" strokeWidth={2} aria-hidden="true" />
              )}
              {deleting ? "Deleting..." : "Delete account"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
        <AvatarSection />
        <UsernameSection />
        <EmailSection />
        <PrivacySection />
        <AddonSection />
        <PasswordSection />
        <DeleteAccountSection />
      </div>
    </div>
  );
}
