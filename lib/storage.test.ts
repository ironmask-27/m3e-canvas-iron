/**
 * The helpers that write the document into localStorage.
 *
 * A full store must be told apart from one that refuses to write for another reason, and
 * neither may throw: the editor shows one notice per failure streak and carries on.
 */
import { describe, expect, it } from "vitest";

import { STORAGE_BUDGET_CHARS, isQuotaError, storageFill, trySave } from "./storage";

const working = () => {
  const written: Record<string, string> = {};
  return { written, storage: { setItem: (k: string, v: string) => void (written[k] = v) } };
};

const throwing = (e: unknown) => ({ setItem: () => { throw e; } });

describe("trySave", () => {
  it("writes the value and reports success", () => {
    const { written, storage } = working();
    expect(trySave(storage, "m3e:doc", '{"a":1}')).toEqual({ ok: true });
    expect(written["m3e:doc"]).toBe('{"a":1}');
  });

  it("reports a full store as a quota failure", () => {
    expect(trySave(throwing(new DOMException("full", "QuotaExceededError")), "k", "v")).toEqual({ ok: false, reason: "quota" });
  });

  it("reports any other throw as the storage being unavailable", () => {
    expect(trySave(throwing(new Error("nope")), "k", "v")).toEqual({ ok: false, reason: "unavailable" });
    expect(trySave(throwing(new DOMException("blocked", "SecurityError")), "k", "v")).toEqual({ ok: false, reason: "unavailable" });
  });
});

describe("isQuotaError", () => {
  it("recognises each form a full store is thrown in", () => {
    expect(isQuotaError(new DOMException("full", "QuotaExceededError"))).toBe(true);
    expect(isQuotaError(new DOMException("full", "NS_ERROR_DOM_QUOTA_REACHED"))).toBe(true);
    expect(isQuotaError({ code: 22 })).toBe(true);
    expect(isQuotaError({ code: 1014 })).toBe(true);
  });

  it("leaves everything else alone", () => {
    expect(isQuotaError(null)).toBe(false);
    expect(isQuotaError(undefined)).toBe(false);
    expect(isQuotaError("QuotaExceededError")).toBe(false);
    expect(isQuotaError(new Error("x"))).toBe(false);
    expect(isQuotaError(new DOMException("x", "SecurityError"))).toBe(false);
    expect(isQuotaError({ name: "Error", code: 7 })).toBe(false);
  });
});

describe("storageFill", () => {
  it("is the fraction of the rough budget the text takes", () => {
    expect(storageFill("")).toBe(0);
    expect(storageFill("a".repeat(Math.round(STORAGE_BUDGET_CHARS * 0.8)))).toBeCloseTo(0.8, 6);
    expect(storageFill("a".repeat(STORAGE_BUDGET_CHARS + 1))).toBeGreaterThan(1);
  });
});
