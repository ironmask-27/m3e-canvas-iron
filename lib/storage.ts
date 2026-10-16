/**
 * Writing the document into localStorage, with the failures told apart.
 *
 * A browser that is full or that has storage switched off simply throws, and the editor
 * used to swallow that: the author kept working and lost everything on the next reload.
 * These helpers turn the throw into a result the editor can report.
 */

export type SaveResult = { ok: true } | { ok: false; reason: "quota" | "unavailable" };

/** roughly what one origin gets in localStorage, in characters; browsers differ, so this is a
 *  heuristic — the error the browser throws is the authoritative warning */
export const STORAGE_BUDGET_CHARS = 5_000_000;

/** whether a thrown value is the browser refusing the write because the store is full */
export function isQuotaError(e: unknown): boolean {
  if (!e || typeof e !== "object") return false;
  const err = e as { name?: unknown; code?: unknown };
  return err.name === "QuotaExceededError" || err.name === "NS_ERROR_DOM_QUOTA_REACHED" || err.code === 22 || err.code === 1014;
}

/** writes one key, never throwing: a full store is told apart from one that refuses to write */
export function trySave(storage: Pick<Storage, "setItem">, key: string, value: string): SaveResult {
  try {
    storage.setItem(key, value);
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: isQuotaError(e) ? "quota" : "unavailable" };
  }
}

/** how much of the rough budget a stored document takes, as 0..1+ */
export const storageFill = (json: string): number => json.length / STORAGE_BUDGET_CHARS;
