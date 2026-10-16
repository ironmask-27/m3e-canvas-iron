/**
 * A screen the author drew again at another width under the same name.
 *
 * Locks in:
 *  - the two layouts are said to be one screen at two widths, once, with both sizes named
 *  - the wide layout is read as the same screen rearranged rather than a second screen
 *  - two screens with different names, or two screens of one size, are left as they are
 *  - a single-screen prompt only speaks about the layouts it contains
 *  - the outline still finds one mark per screen with the link in place
 */
import { describe, expect, it } from "vitest";
import { LANGS as LANG_LIST } from "./i18n";
import { buildPrompt, promptMarks } from "./prompt";
import { DEFAULT_THEME, DESKTOP_H, DESKTOP_W, Doc, Frame, Group, makeItem } from "./tokens";

const LANGS = LANG_LIST.map(({ key }) => key);

/** how each language says the two layouts are one screen, and how it links the wide one */
const PAIR: Record<string, RegExp> = {
  ja: /同じ画面を 2 つの幅で描いた/,
  en: /is drawn twice, as one screen at two widths/,
  zh: /画了两遍，是同一屏幕的两种宽度/,
  ko: /같은 화면을 두 가지 너비로 그린/,
};
const LINK: Record<string, RegExp> = {
  ja: /と同じ画面をこの幅に並べ替えた/,
  en: /arranged for this width: keep its parts/,
  zh: /只是按此宽度重排/,
  ko: /이 너비에 맞게 재배치한/,
};

const box = (id: string, x: number, y: number): Group => ({
  id: `g-${id}`,
  x,
  y,
  axis: "x",
  items: [{ ...makeItem("box"), id, size: 380, size2: 100 }],
});

const phone = (id: string, name: string): Frame => ({ id, name, x: 0, y: 0 });
const wide = (id: string, name: string): Frame => ({ id, name, x: 0, y: 1200, w: DESKTOP_W, h: DESKTOP_H });

const doc = (groups: Group[], frames: Frame[]): Doc => ({
  title: "Notes",
  brief: "",
  paletteKey: "purple",
  frame: "phone",
  platform: "android",
  theme: DEFAULT_THEME,
  frames,
  groups,
});

/** one screen drawn at both widths, the wide one below the phone one */
const pair = doc([box("a", 16, 100), box("b", 116, 1300)], [phone("p", "Home"), wide("w", "Home")]);

const lines = (text: string, re: RegExp) => text.split("\n").filter((l) => re.test(l));

describe("a screen drawn at two widths", () => {
  it.each(LANGS)("links the two layouts as one screen, in %s", (lang) => {
    const text = buildPrompt(pair, {}, undefined, lang);
    const said = lines(text, PAIR[lang]);
    expect(said).toHaveLength(1);
    /* both sizes are named, so the reader knows which layout is which */
    expect(said[0]).toContain("412×892");
    expect(said[0]).toContain("1280×800");
    /* the wide layout is the same screen rearranged, said where it is read */
    expect(lines(text, LINK[lang])).toHaveLength(1);
  });

  it.each(LANGS)("leaves two differently named screens alone, in %s", (lang) => {
    const apart = doc([box("a", 16, 100), box("b", 116, 1300)], [phone("p", "Home"), wide("w", "Search")]);
    const text = buildPrompt(apart, {}, undefined, lang);
    expect(text).not.toMatch(PAIR[lang]);
    expect(text).not.toMatch(LINK[lang]);
  });

  it.each(LANGS)("leaves two screens of one size alone, in %s", (lang) => {
    const same = doc([box("a", 16, 100), box("b", 16, 1300)], [phone("p", "Home"), phone("w", "Home")]);
    expect(buildPrompt(same, {}, undefined, lang)).not.toMatch(PAIR[lang]);
  });

  it.each(LANGS)("speaks only about the layouts a single-screen prompt contains, in %s", (lang) => {
    expect(buildPrompt(pair, {}, "p", lang)).not.toMatch(PAIR[lang]);
    expect(buildPrompt(pair, {}, "w", lang)).not.toMatch(PAIR[lang]);
  });

  it.each(LANGS)("keeps one outline mark per screen, in %s", (lang) => {
    const text = buildPrompt(pair, {}, undefined, lang);
    const marks = promptMarks(text, pair.frames, lang);
    expect(marks.filter((m) => m.kind === "screen").map((m) => m.frameId)).toEqual(["p", "w"]);
    expect(marks.filter((m) => m.kind === "section")).toHaveLength(text.split("\n").filter((l) => l.startsWith("## ")).length);
  });
});
