/**
 * A part's own look — its opacity, and the elevation of a box.
 *
 * The fields are optional and go into the generated prompt only when they are set, so a
 * document that never touches them must read exactly as it did before they existed.
 */
import { afterEach, describe, expect, it } from "vitest";

import { Lang, setGlobalLang } from "./i18n";
import { isProject } from "./project";
import { buildPrompt } from "./prompt";
import { DEFAULT_THEME, Doc, Group, Item, Kind, explodeGroup, makeItem, migrateCarousel, migrateFabMenu, migratePicker, migrateSheetBox, normalizeStyle } from "./tokens";

const LANGS: Lang[] = ["ja", "en", "zh", "ko"];

const fixture = (kind: Kind, patch: Partial<Item> = {}): Doc => ({
  groups: [{ id: "g", x: 16, y: 200, axis: "x", items: [{ ...makeItem(kind), id: "part", ...patch }] }],
  frames: [{ id: "f", name: "Home", x: 0, y: 0 }],
  paletteKey: "purple",
  frame: "phone",
  platform: "android",
  title: "Notes",
  brief: "",
  theme: DEFAULT_THEME,
});

/** the one line of the layout section that describes the part, without the full stop it ends with */
const partLine = (lang: Lang, kind: Kind, patch: Partial<Item> = {}, marker = "412×220dp") => {
  setGlobalLang(lang);
  const text = buildPrompt(fixture(kind, patch), {}, undefined, lang);
  const line = text.split("\n").find((l) => l.startsWith("- ") && l.includes(marker));
  expect(line, `${lang}: no line for ${kind}`).toBeTruthy();
  const body = line!.replace(/[.。]$/, "");
  expect(line!.slice(body.length)).toMatch(/^[.。]$/);
  return body;
};

const SUFFIX: Record<Lang, { opacity: string; elevation: string }> = {
  ja: { opacity: "（不透明度 40%）", elevation: "（エレベーション レベル3、6dp の影）" },
  en: { opacity: "(drawn at 40% opacity)", elevation: "(with a level 3 shadow, 6dp)" },
  zh: { opacity: "（不透明度 40%）", elevation: "（阴影层级 3，6dp）" },
  ko: { opacity: "(불투명도 40%)", elevation: "(고도 레벨 3, 6dp 그림자)" },
};

describe("normalizeStyle", () => {
  it("drops a field left at its default", () => {
    expect(normalizeStyle(undefined)).toBeUndefined();
    expect(normalizeStyle({})).toBeUndefined();
    expect(normalizeStyle({ opacity: 100 })).toBeUndefined();
    expect(normalizeStyle({ elevation: 0 })).toBeUndefined();
    expect(normalizeStyle({ opacity: 100, elevation: 0 })).toBeUndefined();
  });

  it("keeps what the author set, and lets the other field go", () => {
    expect(normalizeStyle({ opacity: 40 })).toEqual({ opacity: 40 });
    expect(normalizeStyle({ opacity: 100, elevation: 3 })).toEqual({ elevation: 3 });
    expect(normalizeStyle({ opacity: 40, elevation: 3 })).toEqual({ opacity: 40, elevation: 3 });
    expect(normalizeStyle({ elevation: 5 })).toEqual({ elevation: 5 });
  });
});

describe("a project with a part style", () => {
  const withStyle = (style: unknown) => {
    const doc = fixture("box");
    return { ...doc, groups: [{ ...doc.groups[0], items: [{ ...doc.groups[0].items[0], style }] }] };
  };

  it("accepts a style the panel can write", () => {
    expect(isProject(withStyle({ opacity: 40 }))).toBe(true);
    expect(isProject(withStyle({ opacity: 40, elevation: 0 }))).toBe(true);
    expect(isProject(withStyle({ elevation: 5 }))).toBe(true);
    expect(isProject(withStyle({}))).toBe(true);
    expect(isProject(withStyle(undefined))).toBe(true);
    expect(isProject(fixture("box"))).toBe(true);
  });

  it("turns down a malformed one", () => {
    expect(isProject(withStyle("faded"))).toBe(false);
    expect(isProject(withStyle({ opacity: 5 }))).toBe(false);
    expect(isProject(withStyle({ opacity: 101 }))).toBe(false);
    expect(isProject(withStyle({ opacity: 40.5 }))).toBe(false);
    expect(isProject(withStyle({ opacity: Number.NaN }))).toBe(false);
    expect(isProject(withStyle({ opacity: "40" }))).toBe(false);
    expect(isProject(withStyle({ elevation: 6 }))).toBe(false);
    expect(isProject(withStyle({ elevation: -1 }))).toBe(false);
    expect(isProject(withStyle({ elevation: "3" }))).toBe(false);
    expect(isProject(withStyle({ elevation: 2.5 }))).toBe(false);
  });
});

describe("the prompt a part style writes", () => {
  afterEach(() => setGlobalLang("ja"));

  it.each(LANGS)("says how far a faded part is drawn in %s", (lang) => {
    const line = partLine(lang, "button", { label: "Save", style: { opacity: 40 } }, "Save");
    expect(line).toContain(SUFFIX[lang].opacity);
  });

  it.each(LANGS)("says a box carries the elevation it was given in %s", (lang) => {
    expect(partLine(lang, "box", { style: { elevation: 3 } })).toContain(SUFFIX[lang].elevation);
  });

  it.each(LANGS)("writes opacity first and elevation right after it in %s", (lang) => {
    const line = partLine(lang, "box", { style: { opacity: 40, elevation: 3 } });
    /* the two suffixes sit together, the opacity one first */
    expect(line).toContain(`${SUFFIX[lang].opacity} ${SUFFIX[lang].elevation}`);
  });

  it.each(LANGS)("says nothing about a part drawn as usual in %s", (lang) => {
    const plain = partLine(lang, "box");
    for (const word of [SUFFIX[lang].opacity, SUFFIX[lang].elevation]) {
      expect(plain).not.toContain(word);
      expect(partLine(lang, "box", { style: { opacity: 100, elevation: 0 } })).toBe(plain);
    }
  });

  it.each(LANGS)("names the faded member of a connected run in %s", (lang) => {
    setGlobalLang(lang);
    const doc = fixture("button", { label: "Save", style: { opacity: 40 } });
    doc.groups = [{ ...doc.groups[0], items: [doc.groups[0].items[0], { ...makeItem("button"), id: "other", label: "Send" }] }];
    const text = buildPrompt(doc, {}, undefined, lang);
    /* the suffix sits right after the faded part's own name, in the run's own sentence */
    const save = text.indexOf("Save");
    const send = text.indexOf("Send", save);
    const suffix = text.indexOf(SUFFIX[lang].opacity);
    expect(save).toBeGreaterThanOrEqual(0);
    expect(suffix).toBeGreaterThan(save);
    expect(send).toBeGreaterThan(suffix);
  });

  it("leaves elevation out of a part that is not a box", () => {
    setGlobalLang("en");
    expect(partLine("en", "button", { label: "Save", style: { elevation: 3 } }, "Save")).not.toContain("level 3 shadow");
  });
});

describe("parts keep their style", () => {
  it("through the runs a free group is written as", () => {
    const a: Item = { ...makeItem("button"), id: "a", label: "One", style: { opacity: 40 } };
    const b: Item = { ...makeItem("button"), id: "b", label: "Two", style: { elevation: 3 } };
    const g: Group = { id: "g", x: 0, y: 0, axis: "x", free: true, items: [a, b], pos: { a: { x: 0, y: 0 }, b: { x: 200, y: 0 } } };
    const runs = explodeGroup(g, {});
    const items = runs.flatMap((r) => r.items);
    expect(items.find((it) => it.id === "a")?.style).toEqual({ opacity: 40 });
    expect(items.find((it) => it.id === "b")?.style).toEqual({ elevation: 3 });
  });

  it("through the migrations a sketch from an older version goes through", () => {
    setGlobalLang("en");
    const box: Item = { ...makeItem("box"), id: "b", style: { elevation: 3 } };
    /* a box with a handle was read back as a bottom sheet; the look travels with it */
    expect(migrateSheetBox({ ...box, checked: true }).style).toEqual({ elevation: 3 });
    const picked = { ...box, day: 3 };
    expect(migratePicker(picked).style).toEqual({ elevation: 3 });
    const carousel: Item = { ...makeItem("carousel"), id: "c", label: "Featured", style: { opacity: 60 } };
    expect(migrateCarousel(carousel).style).toEqual({ opacity: 60 });
    const menu: Item = { ...makeItem("fabMenu"), id: "m", style: { opacity: 60 } };
    expect(migrateFabMenu(menu).style).toEqual({ opacity: 60 });
  });
});
