import type { ReactNode } from "react";

// Auth pages don't mount `CurrentUserProvider`. The login and register pages
// instead wrap their form in `SessionGate`, which probes `/api/auth/me` once so
// an already-signed-in visitor is forwarded to /home without seeing the form.
// The other auth pages (password recovery) must stay reachable either way and
// deliberately don't probe.
//
// If a page in this group ever needs the current user beyond that gate, call
// `fetch("/api/auth/me")` directly rather than `authFetch`: that route rotates
// tokens server-side itself, and `authFetch`'s 401 interceptor is meant for
// protected API calls.
export default function AuthGroupLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col justify-center">
      {children}
    </div>
  );
}
