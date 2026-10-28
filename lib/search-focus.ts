// Cross-component hand-off for the single global search field in the app top
// bar. Pages (e.g. the empty library) can ask for the search input to be
// focused without knowing where it is mounted or duplicating the component.
const FOCUS_EVENT = "kue:focus-search";

export function requestSearchFocus() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(FOCUS_EVENT));
}

export function onSearchFocusRequest(handler: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(FOCUS_EVENT, handler);
  return () => window.removeEventListener(FOCUS_EVENT, handler);
}
