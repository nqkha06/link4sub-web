import type { AnonymousLinkDraft } from "./types"

const STORAGE_KEY = "link4sub:anon-create-draft"
const MAX_AGE_MS = 30 * 60 * 1000 // 30 minutes — long enough to finish signup, short enough to avoid stale surprises

export function saveAnonymousDraft(draft: Omit<AnonymousLinkDraft, "createdAt">) {
  try {
    const value: AnonymousLinkDraft = { ...draft, createdAt: Date.now() }
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(value))
  } catch {
    // sessionStorage unavailable (private mode, storage disabled, etc.) — the
    // composer still works, the visitor just has to redo the form after auth.
  }
}

export function readAnonymousDraft(): AnonymousLinkDraft | null {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as AnonymousLinkDraft
    if (!parsed || typeof parsed !== "object") return null
    if (Date.now() - (parsed.createdAt ?? 0) > MAX_AGE_MS) return null
    return parsed
  } catch {
    return null
  }
}

export function clearAnonymousDraft() {
  try {
    window.sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}
