import type { ReactNode } from "react";

// Auth pages never read the session, so this group deliberately renders
// without `CurrentUserProvider`: mounting it here would probe
// `/api/auth/me` on every anonymous visit and pay two extra round trips
// (refresh + logout) for a value nothing consumes.
//
// If a page in this group ever needs to know whether someone is already
// signed in, call `fetch("/api/auth/me")` directly rather than `authFetch`:
// that route rotates tokens server-side itself, and `authFetch`'s 401
// interceptor is meant for protected API calls.
export default function AuthGroupLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col justify-center">
      {children}
    </div>
  );
}
