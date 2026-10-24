"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { probeSession } from "@/lib/api/session";

type GateStatus = "checking" | "ready" | "degraded";

// Wraps the sign-in / register forms. A visitor with a live session is sent
// straight into the app instead of being asked to sign in again; everyone else
// sees the form. The probe decides, so a cookie merely existing is never enough.
export default function SessionGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [status, setStatus] = useState<GateStatus>("checking");

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    probeSession({ signal: controller.signal }).then((result) => {
      if (!active) return;

      if (result.state === "authenticated") {
        // replace, not push: the auth page must not stay in the history stack.
        // Keep the placeholder up until the navigation completes.
        router.replace("/home");
        return;
      }

      setStatus(result.state === "unavailable" ? "degraded" : "ready");
    });

    return () => {
      active = false;
      controller.abort();
    };
  }, [router]);

  if (status === "checking") {
    return (
      <div role="status" aria-live="polite" className="min-h-[440px]">
        <p className="flex items-center gap-3 text-[9.5px] leading-none font-mono tracking-[0.18em] text-ink-3 uppercase">
          <span>Account</span>
          <span aria-hidden="true" className="h-px flex-1 bg-line" />
        </p>

        <p className="mt-6 text-[13px] text-ink-2">Checking your session…</p>

        {/* Sized like the form so revealing it does not shift the layout. */}
        <div aria-hidden="true" className="mt-6 space-y-5">
          <div className="h-[66px] animate-pulse rounded-lg bg-surface-2" />
          <div className="h-[66px] animate-pulse rounded-lg bg-surface-2" />
          <div className="h-11 animate-pulse rounded-lg bg-surface-2" />
        </div>
      </div>
    );
  }

  return (
    <>
      {status === "degraded" && (
        <p
          role="status"
          className="mb-5 rounded-lg border border-line bg-surface-2 px-4 py-3 text-[13px] text-ink-2"
        >
          We couldn&apos;t verify your session. You can still continue.
        </p>
      )}
      {children}
    </>
  );
}
