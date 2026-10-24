"use client";

import Button from "@/app/components/button";
import LogoMark from "@/app/features/landing/logo-mark";

// Full-screen state shown in place of the app chrome while the session is
// unresolved. Deliberately renders no sidebar, topbar or page children, so a
// signed-out visitor never sees protected UI, not even for a frame.
export default function SessionStatusScreen({
  state,
}: {
  state: "loading" | "unavailable";
}) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-background px-6 text-center">
      <div className="flex items-center gap-2.5 text-[16px] font-semibold tracking-[-0.01em]">
        <LogoMark />
        Kue
      </div>

      {state === "loading" ? (
        <>
          <span
            aria-hidden="true"
            className="size-6 animate-spin rounded-full border-2 border-line border-t-accent"
          />
          <p role="status" aria-live="polite" className="text-[13px] text-ink-2">
            Checking your session…
          </p>
        </>
      ) : (
        <>
          <div role="alert" className="max-w-[42ch] space-y-2">
            <p className="text-[15px] font-medium text-foreground">
              We couldn&apos;t load your account
            </p>
            <p className="text-[13px] leading-relaxed text-ink-2">
              The session check failed, but you have not been signed out. Check
              your connection and try again.
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            onClick={() => {
              window.location.reload();
            }}
          >
            Retry
          </Button>
        </>
      )}
    </div>
  );
}
