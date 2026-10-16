/**
 * The spacing line a screen gets when its parts are packed tighter than the standard.
 *
 * Locks in:
 *  - a screen laid out at the standard 16dp margins and 8dp gaps says nothing extra, in every
 *    language, so the common case keeps reading the way it did
 *  - a screen the author packed tighter gets one line naming the dp values it actually uses
 *  - roomier than the standard is left alone: leftover space between hand-placed parts is how the
 *    sketch was dragged, not a decision to pin the app to
 *  - a row that runs into the screen's edges (a bar, a sheet) says nothing about the margin
 *  - a free-form document and a single-screen prompt follow the screens they describe
 */
import { describe, expect, it } from "vitest";
import { LANGS as LANG_LIST } from "./i18n";
import { buildPrompt } from "./prompt";
import { DEFAULT_THEME, Doc, Frame, Group, PHONE_W, makeItem } from "./tokens";

const LANGS = LANG_LIST.map(({ key }) => key);

/** the words each language uses to open a screen's tighter-spacing line */
const PHRASE: Record<string, RegExp> = {
  ja: /この画面は標準より詰めます/,
  en: /tighter than the standard/,
  zh: /本屏幕比标准更紧凑/,
  ko: /표준보다 촘촘하게/,
};

const box = (id: string, x: number, y: number, w: number, h = 100): Group => ({
  id: `g-${id}`,
  x,
  y,
  axis: "x",
  items: [{ ...makeItem("box"), id, size: w, size2: h }],
});

const frame = (id: string, name: string, x: number): Frame => ({ id, name, x, y: 0 });

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

/** 16dp margins, 12dp between the rows: exactly what the general guidance asks for */
const standard = doc([box("a", 16, 100, 380), box("b", 16, 212, 380), box("c", 16, 324, 380)], [frame("f1", "Home", 0)]);
/** 16dp margins, 4dp between the rows: a dense list */
const packed = doc([box("a", 16, 100, 380), box("b", 16, 204, 380), box("c", 16, 308, 380)], [frame("f1", "Room", 0)]);
/** 8dp from the edges, standard gaps */
const narrow = doc([box("a", 8, 100, 396), box("b", 8, 220, 396), box("c", 8, 340, 396)], [frame("f1", "Feed", 0)]);
/** roomier than the standard in both directions */
const loose = doc([box("a", 24, 100, 200), box("b", 24, 300, 240), box("c", 24, 500, 300)], [frame("f1", "Room", 0)]);

const lineOf = (text: string, lang: string) => text.split("\n").find((l) => PHRASE[lang].test(l));

describe("screen spacing", () => {
  it.each(LANGS)("says nothing when a screen sits at the standard spacing, in %s", (lang) => {
    expect(buildPrompt(standard, {}, undefined, lang)).not.toMatch(PHRASE[lang]);
  });

  it.each(LANGS)("names the tight gaps when a screen is packed, in %s", (lang) => {
    const text = buildPrompt(packed, {}, undefined, lang);
    expect(lineOf(text, lang)).toBeDefined();
    const line = lineOf(text, lang)!;
    expect(line).toContain("4dp");
    expect(line).not.toContain("16dp");
  });

  it.each(LANGS)("names the tight margin when a screen keeps to the edge, in %s", (lang) => {
    const line = lineOf(buildPrompt(narrow, {}, undefined, lang), lang)!;
    expect(line).toContain("8dp");
  });

  it.each(LANGS)("leaves a roomier screen to the sketch, in %s", (lang) => {
    expect(buildPrompt(loose, {}, undefined, lang)).not.toMatch(PHRASE[lang]);
  });

  it.each(LANGS)("leaves out a row that runs into the screen's edges, in %s", (lang) => {
    /* the bar is drawn edge to edge on purpose; the margin belongs to the parts under it */
    const d = doc([box("bar", 0, 100, PHONE_W, 64), box("a", 8, 300, 396)], [frame("f1", "Home", 0)]);
    expect(lineOf(buildPrompt(d, {}, undefined, lang), lang)).toContain("8dp");
  });

  it.each(LANGS)("speaks only for the screen a single-screen prompt is about, in %s", (lang) => {
    const two = doc(
      [
        box("a", 16, 100, 380),
        box("b", 16, 212, 380),
        box("c", 16, 324, 380),
        box("d", 524, 100, 380),
        box("e", 524, 204, 380),
        box("f", 524, 308, 380),
      ],
      [frame("f1", "Home", 0), frame("f2", "Room", 500)],
    );
    expect(buildPrompt(two, {}, "f1", lang)).not.toMatch(PHRASE[lang]);
    expect(buildPrompt(two, {}, "f2", lang)).toMatch(PHRASE[lang]);
  });

  it.each(LANGS)("says nothing in a free-form document, in %s", (lang) => {
    /* there is no screen edge to measure against, so the parts are described and no more */
    const text = buildPrompt(doc([box("a", 8, 100, 396), box("b", 8, 204, 396)], []), {}, undefined, lang);
    expect(text).toContain("## ");
    expect(text).not.toMatch(PHRASE[lang]);
  });
});
