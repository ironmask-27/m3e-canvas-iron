/**
 * The names the author gives sections that are meant to be built once and reused.
 *
 * A name is read from the document's own groups, before the hand-made ones are written out run
 * by run, and it is written into the prompt only when it is set. Nothing links the copies to
 * each other: the section tells the coding tool how to build what it reads.
 */
import { afterEach, describe, expect, it } from "vitest";

import { Lang, setGlobalLang } from "./i18n";
import { isProject } from "./project";
import { buildPrompt, promptMarks } from "./prompt";
import { DEFAULT_THEME, Doc, Group, Item, makeItem } from "./tokens";

const LANGS: Lang[] = ["ja", "en", "zh", "ko"];

const HEAD: Record<Lang, string> = {
  ja: "## 再利用するコンポーネント",
  en: "## Reusable components",
  zh: "## 可复用组件",
  ko: "## 재사용 컴포넌트",
};

const STYLE_HEAD: Record<Lang, string> = { ja: "## 各部品のスタイル", en: "## Component styles", zh: "## 各组件的样式", ko: "## 부품별 스타일" };
const ASSET_HEAD: Record<Lang, string> = { ja: "## 別途提供されるアセット", en: "## Assets provided separately", zh: "## 另行提供的资源", ko: "## 별도로 제공되는 에셋" };

const NAME: Record<Lang, string> = { ja: "「ProductCard」", en: '"ProductCard"', zh: "“ProductCard”", ko: '"ProductCard"' };

const card = (id: string, label: string): Item => ({ ...makeItem("card"), id, label });

/** a free group the author put together by hand, which is the one that can be named */
function free(id: string, x: number, y: number, item: Item, component?: string): Group {
  return { id, x, y, axis: "x", free: true, items: [item], pos: { [item.id]: { x: 0, y: 0 } }, component };
}

function fixture(groups: Group[], patch: Partial<Doc> = {}): Doc {
  return {
    groups,
    frames: [
      { id: "f1", name: "Home", x: 0, y: 0 },
      { id: "f2", name: "Search", x: 500, y: 0 },
    ],
    paletteKey: "purple",
    frame: "phone",
    platform: "android",
    title: "Shop",
    brief: "",
    theme: DEFAULT_THEME,
    ...patch,
  };
}

/** a name on two screens, a name that appears once, one padded with spaces, one that is blank */
const DOC = (patch: Partial<Doc> = {}) =>
  fixture(
    [
      free("g1", 16, 100, card("c1", "Espresso"), "ProductCard"),
      free("g2", 516, 100, card("c2", "Latte"), "ProductCard"),
      free("g3", 16, 400, card("c3", "Tea"), " TeaRow "),
      free("g4", 16, 600, card("c4", "Cake"), "   "),
    ],
    patch,
  );

function prompt(lang: Lang, doc: Doc) {
  setGlobalLang(lang);
  return buildPrompt(doc, {}, undefined, lang);
}

describe("the component name field", () => {
  it("takes a string and turns down anything else", () => {
    expect(isProject(DOC())).toBe(true);
    expect(isProject(fixture([free("g1", 16, 100, card("c1", "Espresso"))]))).toBe(true);
    expect(isProject(fixture([free("g1", 16, 100, card("c1", "Espresso"), 7 as unknown as string)]))).toBe(false);
    expect(isProject(fixture([{ ...free("g1", 16, 100, card("c1", "Espresso")), component: ["a"] as unknown as string }]))).toBe(false);
  });
});

describe("the prompt reusable components section", () => {
  afterEach(() => setGlobalLang("ja"));

  it.each(LANGS)("names each component and counts the places it appears, in %s", (lang) => {
    const text = prompt(lang, DOC());
    expect(text).toContain(HEAD[lang]);
    /* one bullet per named component: the two copies of one name are counted together, the
     * name padded with spaces is trimmed, and the blank one is left out */
    const lines = text.split("\n");
    const rest = lines.slice(lines.indexOf(HEAD[lang]) + 1);
    const bullets = rest.slice(0, rest.findIndex((l) => l.startsWith("## "))).filter((l) => l.startsWith("- "));
    expect(bullets).toHaveLength(2);
    const twice: Record<Lang, RegExp> = { ja: /2 か所に登場する/, en: /appears 2 times/, zh: /出现 2 次/, ko: /2곳에 나온다/ };
    const once: Record<Lang, RegExp> = { ja: /1 か所に登場する/, en: /appears once/, zh: /出现 1 次/, ko: /1곳에 나온다/ };
    expect(bullets[0]).toMatch(twice[lang]);
    expect(bullets[0]).toContain(NAME[lang]);
    expect(bullets[1]).toMatch(once[lang]);
    expect(bullets[1]).toContain(lang === "ja" ? "「TeaRow」" : lang === "zh" ? "“TeaRow”" : '"TeaRow"');
  });

  it.each(LANGS)("names the screens it sits on, in %s", (lang) => {
    const text = prompt(lang, DOC());
    const screens: Record<Lang, string> = {
      ja: "「Home」画面、「Search」画面",
      en: '"Home" and "Search" screens',
      zh: "在“Home”屏幕、“Search”屏幕",
      ko: '"Home" 화면, "Search" 화면',
    };
    expect(text).toContain(screens[lang]);
  });

  it.each(LANGS)("asks for one component, and says so differently for a single place, in %s", (lang) => {
    const text = prompt(lang, DOC());
    const once: Record<Lang, string> = {
      ja: "1 か所に登場する（「Home」画面）。独立したコンポーネントとして実装する。",
      en: 'appears once (on the "Home" screen). Build it as its own component.',
      zh: "出现 1 次（在“Home”屏幕）。作为独立组件实现。",
      ko: '1곳에 나온다("Home" 화면). 독립된 컴포넌트로 구현한다.',
    };
    const several: Record<Lang, string> = {
      ja: "1 つのコンポーネントとして実装し、内容を引数にして使い回す。",
      en: "Build it once as its own component and reuse it, taking its content as parameters.",
      zh: "只实现一次，作为独立组件复用，内容通过参数传入。",
      ko: "하나의 컴포넌트로 한 번만 구현하고 내용을 매개변수로 받아 재사용한다.",
    };
    expect(text).toContain(once[lang]);
    expect(text).toContain(several[lang]);
  });

  it.each(LANGS)("sits after the component styles and before the assets, in %s", (lang) => {
    const lines = prompt(lang, fixture(DOC().groups, { assets: [{ id: "a", name: "logo.svg", kind: "logo" }] })).split("\n");
    expect(lines.indexOf(HEAD[lang])).toBeGreaterThan(lines.indexOf(STYLE_HEAD[lang]));
    expect(lines.indexOf(HEAD[lang])).toBeLessThan(lines.indexOf(ASSET_HEAD[lang]));
  });

  it("counts only the screens of the one screen being written", () => {
    setGlobalLang("en");
    const one = buildPrompt(DOC(), {}, "f2", "en");
    expect(one).toContain(HEAD.en);
    expect(one).toContain('"ProductCard": appears once (on the "Search" screen)');
    expect(one).not.toContain("TeaRow");
  });

  it("counts a name on no screen, without naming a screen for it", () => {
    setGlobalLang("en");
    const loose = fixture([free("g1", 3000, 3000, card("c1", "Espresso"), "ProductCard")]);
    const text = prompt("en", loose);
    expect(text).toContain('"ProductCard": appears once. Build it as its own component.');
  });

  it("leaves a sketch with no names exactly as it was", () => {
    setGlobalLang("en");
    const plain = fixture([free("g1", 16, 100, card("c1", "Espresso")), free("g2", 16, 400, card("c2", "Latte"))]);
    const text = prompt("en", plain);
    expect(text).not.toContain(HEAD.en);
    expect(prompt("en", fixture(plain.groups.map((g) => ({ ...g, component: "" }))))).toBe(text);
    expect(prompt("en", fixture(plain.groups.map((g) => ({ ...g, component: "   " }))))).toBe(text);
  });

  it("keeps one mark per screen in the outline", () => {
    setGlobalLang("en");
    const doc = DOC();
    const text = prompt("en", doc);
    const screens = promptMarks(text, doc.frames, "en").filter((m) => m.kind === "screen");
    expect(screens.map((m) => m.frameId)).toEqual(["f1", "f2"]);
    /* and the new heading is picked up as a section of its own */
    expect(promptMarks(text, doc.frames, "en").some((m) => m.kind === "section" && m.label === "Reusable components")).toBe(true);
  });
});
