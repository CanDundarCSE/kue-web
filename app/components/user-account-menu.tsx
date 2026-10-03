"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn, LogOut } from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "@/app/components/ui/popover";
import { initialOf, type CurrentUser } from "@/lib/current-user";
import { cn } from "@/lib/utils";

const rowClasses = [
  "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] text-ink-2",
  "transition-colors duration-150 motion-reduce:transition-none",
  "hover:bg-surface-3 hover:text-foreground",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
].join(" ");

// The top-right account control. Clicking the avatar opens a small popover
// below it with a Sign out action (or Sign in when there's no session).
export default function UserAccountMenu({
  user,
  loading,
}: {
  user: CurrentUser | null;
  loading: boolean;
}) {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Fall through to the redirect regardless: the server clears the cookies
      // best-effort, and the client no longer holds a usable session.
    } finally {
      router.push("/login");
      router.refresh();
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={user ? `Account — ${user.username}` : "Account"}
          aria-expanded="false"
          className={cn(
            "grid size-9 shrink-0 place-items-center rounded-lg border border-line bg-surface-2 sm:size-10",
            "text-[13px] font-semibold text-foreground",
            "transition-colors duration-150 motion-reduce:transition-none",
            "hover:bg-surface-3",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
          )}
        >
          {user ? (
            initialOf(user.username)
          ) : loading ? (
            <span aria-hidden className="size-3.5 animate-pulse rounded bg-surface-3" />
          ) : (
            "•"
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent align="end" side="bottom" sideOffset={8}>
        {user ? (
          <>
            <div className="flex items-center gap-3 px-2 py-2">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent-soft text-[15px] font-semibold text-accent">
                {initialOf(user.username)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-foreground">
                  {user.username}
                </p>
                <p className="truncate text-[12px] text-ink-3">{user.email}</p>
              </div>
            </div>
            <div className="h-px bg-line" aria-hidden />
            <button
              type="button"
              onClick={handleSignOut}
              disabled={signingOut}
              className={cn(rowClasses, "disabled:pointer-events-none disabled:opacity-50")}
            >
              <LogOut className="size-4 shrink-0" strokeWidth={1.75} />
              {signingOut ? "Signing out..." : "Sign out"}
            </button>
          </>
        ) : loading ? (
          <div className="px-2.5 py-2 text-[13px] text-ink-3">Loading…</div>
        ) : (
          <a href="/login" className={rowClasses}>
            <LogIn className="size-4 shrink-0" strokeWidth={1.75} />
            Sign in
          </a>
        )}
      </PopoverContent>
    </Popover>
  );
}
