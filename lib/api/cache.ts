// Cache headers for proxy routes whose responses do not vary by user.
//
// These endpoints forward no Authorization header, so letting Vercel's CDN
// answer repeat requests removes a function invocation and an upstream Render
// request each time. Authenticated routes must keep using `NO_STORE`.
export function publicCache(seconds: number, staleWhileRevalidate?: number) {
  const parts = ["public", `s-maxage=${seconds}`];
  if (staleWhileRevalidate !== undefined) {
    parts.push(`stale-while-revalidate=${staleWhileRevalidate}`);
  }
  return { "Cache-Control": parts.join(", ") } as const;
}
