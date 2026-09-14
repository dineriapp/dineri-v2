export const POPUP_SEEN_KEY = "dineri:popups-seen";

export type PopupSeenStore = Pick<Storage, "getItem" | "setItem">;

function browserSessionStore(): PopupSeenStore | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

export function readSeenPopups(store: PopupSeenStore | null = browserSessionStore()): Set<string> {
  if (!store) return new Set();

  try {
    const raw = store.getItem(POPUP_SEEN_KEY);
    if (!raw) return new Set();

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();

    return new Set(parsed.filter((id): id is string => typeof id === "string"));
  } catch {
    return new Set();
  }
}

export function markPopupSeen(
  id: string,
  store: PopupSeenStore | null = browserSessionStore(),
): void {
  if (!store || !id) return;

  try {
    const seen = readSeenPopups(store);
    if (seen.has(id)) return;

    seen.add(id);
    store.setItem(POPUP_SEEN_KEY, JSON.stringify([...seen]));
  } catch {
    // Quota or a denied write - not worth breaking the page over.
  }
}
