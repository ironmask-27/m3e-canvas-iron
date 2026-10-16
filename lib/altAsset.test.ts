/**
 * Descriptions of pictures, and the files handed to the coding tool with the prompt.
 *
 * Both are optional and are written into the prompt only when they exist, so a sketch that
 * uses neither reads exactly as it did before they were added.
 */
import { afterEach, describe, expect, it } from "vitest";

import { Lang, setGlobalLang } from "./i18n";
import { isProject } from "./project";
import { buildPrompt } from "./prompt";
import { ASSET_KINDS, Asset, DEFAULT_THEME, Doc, Item, defaultTabs, makeItem } from "./tokens";

const LANGS: Lang[] = ["ja", "en", "zh", "ko"];

const quote = (lang: Lang, s: string) => (lang === "ja" ? `「${s}」` : lang === "zh" ? `“${s}”` : `"${s}"`);

const ASSETS_HEAD: Record<Lang, string> = {
  ja: "## 別途提供されるアセット",
  en: "## Assets provided separately",
  zh: "## 另行提供的资源",
  ko: "## 별도로 제공되는 에셋",
};

const ASSETS_INTRO: Record<Lang, string> = {
  ja: "以下のファイルはこのプロンプトとは別に渡される。",
  en: "These files are handed over with this prompt.",
  zh: "以下文件会与本提示词一起另行提供。",
  ko: "다음 파일은 이 프롬프트와 별도로 제공된다.",
};

const STYLE_HEAD: Record<Lang, string> = {
  ja: "## 各部品のスタイル",
  en: "## Component styles",
  zh: "## 各组件的样式",
  ko: "## 부품별 스타일",
};

const GENERAL_HEAD: Record<Lang, string> = {
  ja: "## 全体の指針",
  en: "## General guidance",
  zh: "## 整体原则",
  ko: "## 전체 지침",
};

const LOGO: Record<Lang, string> = { ja: "ロゴ", en: "logo", zh: "标志", ko: "로고" };
const FONT: Record<Lang, string> = { ja: "フォント", en: "font", zh: "字体", ko: "글꼴" };

const ALT: Record<Lang, (s: string) => string> = {
  ja: (s) => `（代替テキスト：「${s}」）`,
  en: (s) => `(alt text: "${s}")`,
  zh: (s) => `（替代文本：“${s}”）`,
  ko: (s) => `(대체 텍스트: "${s}")`,
};

const TWO: Asset[] = [
  { id: "a1", name: "logo.svg", kind: "logo", use: "used on the splash screen" },
  { id: "a2", name: "cafe.ttf", kind: "font" },
];

/** a screen holding one part, so the prompt describes it in its own words */
function fixture(parts: Item[], patch: Partial<Doc> = {}): Doc {
  return {
    groups: parts.map((p, i) => ({ id: `g${i}`, x: 16, y: 200 + i * 320, axis: "x", items: [p] })),
    frames: [{ id: "f", name: "Home", x: 0, y: 0 }],
    paletteKey: "purple",
    frame: "phone",
    platform: "android",
    title: "Notes",
    brief: "",
    theme: DEFAULT_THEME,
    ...patch,
  };
}

function prompt(lang: Lang, doc: Doc) {
  setGlobalLang(lang);
  return buildPrompt(doc, {}, undefined, lang);
}

describe("the alt field", () => {
  const withAlt = (alt: unknown, patch: Partial<Item> = {}) => {
    const doc = fixture([{ ...makeItem("image"), id: "i", alt: alt as string, ...patch }]);
    return doc;
  };

  it("takes a string and turns down anything else", () => {
    expect(isProject(withAlt("A cup of coffee"))).toBe(true);
    expect(isProject(withAlt(undefined))).toBe(true);
    expect(isProject(fixture([{ ...makeItem("image"), id: "i" }]))).toBe(true);
    expect(isProject(withAlt(42))).toBe(false);
    expect(isProject(withAlt(["a"]))).toBe(false);
  });
});

describe("the assets list", () => {
  const withAssets = (assets: unknown) => fixture([makeItem("box")], { assets: assets as Asset[] });

  it("takes a proper list, including an empty one, and turns down a malformed one", () => {
    expect(isProject(withAssets(TWO))).toBe(true);
    expect(isProject(withAssets([]))).toBe(true);
    expect(isProject(withAssets(undefined))).toBe(true);
    expect(isProject(withAssets({ id: "a", name: "n", kind: "logo" }))).toBe(false);
    expect(isProject(withAssets([{ id: "a", name: "logo.svg", kind: "video" }]))).toBe(false);
    expect(isProject(withAssets([{ id: "a", name: "", kind: "logo" }]))).toBe(false);
    expect(isProject(withAssets([{ id: "", name: "logo.svg", kind: "logo" }]))).toBe(false);
    expect(isProject(withAssets([{ id: "a", name: "logo.svg", kind: "logo", use: 3 }]))).toBe(false);
    expect(isProject(withAssets([{ id: "a", kind: "logo" }]))).toBe(false);
    const many = (n: number) => Array.from({ length: n }, (_, i) => ({ id: `a${i}`, name: `f${i}.png`, kind: "image" }));
    expect(isProject(withAssets(many(41)))).toBe(false);
    expect(isProject(withAssets(many(40)))).toBe(true);
    for (const kind of ASSET_KINDS) expect(isProject(withAssets([{ id: "a", name: "n", kind }]))).toBe(true);
  });
});

describe("the prompt picture descriptions write", () => {
  afterEach(() => setGlobalLang("ja"));

  it.each(LANGS)("says what a picture shows, in %s", (lang) => {
    const text = prompt(lang, fixture([{ ...makeItem("image"), id: "i", alt: "A black coffee" }]));
    expect(text).toContain(ALT[lang]("A black coffee"));
  });

  it.each(LANGS)("says what a card's picture shows, in %s", (lang) => {
    const text = prompt(lang, fixture([{ ...makeItem("card"), id: "c", label: "Espresso", alt: "A black coffee" }]));
    expect(text).toContain(ALT[lang]("A black coffee"));
  });

  it.each(LANGS)("stays quiet about a card that keeps no picture, in %s", (lang) => {
    const text = prompt(lang, fixture([{ ...makeItem("card"), id: "c", label: "Espresso", noImage: true, alt: "A black coffee" }]));
    expect(text).not.toContain(ALT[lang]("A black coffee"));
  });

  it("leaves a card with no description, and any other kind, alone", () => {
    setGlobalLang("en");
    expect(prompt("en", fixture([{ ...makeItem("card"), id: "c", label: "Espresso" }]))).not.toContain("alt text");
    /* only a part that shows a picture is described */
    expect(prompt("en", fixture([{ ...makeItem("button"), id: "b", label: "Save", alt: "A black coffee" }]))).not.toContain("alt text");
  });

  it("reads exactly as before when the field is unset", () => {
    setGlobalLang("en");
    const plain = prompt("en", fixture([{ ...makeItem("image"), id: "i" }]));
    expect(prompt("en", fixture([{ ...makeItem("image"), id: "i", alt: "" }]))).toBe(plain);
    expect(prompt("en", fixture([{ ...makeItem("image"), id: "i", alt: "   " }]))).toBe(plain);
  });
});

describe("the prompt assets section", () => {
  afterEach(() => setGlobalLang("ja"));

  it.each(LANGS)("lists each file with its kind and its use, in %s", (lang) => {
    const text = prompt(lang, fixture([makeItem("box")], { assets: TWO }));
    const q = (s: string) => quote(lang, s);
    expect(text).toContain(ASSETS_HEAD[lang]);
    expect(text).toContain(ASSETS_INTRO[lang]);
    expect(text).toContain(`- ${q("logo.svg")} (${LOGO[lang]}): used on the splash screen${lang === "ja" || lang === "zh" ? "。" : "."}`);
    /* a file with no use named is listed by name and kind alone */
    expect(text).toContain(`- ${q("cafe.ttf")} (${FONT[lang]})`);
  });

  it.each(LANGS)("sits between the component styles and the general guidance, in %s", (lang) => {
    const lines = prompt(lang, fixture([makeItem("box")], { assets: TWO })).split("\n");
    expect(lines.indexOf(ASSETS_HEAD[lang])).toBeGreaterThan(lines.indexOf(STYLE_HEAD[lang]));
    expect(lines.indexOf(ASSETS_HEAD[lang])).toBeLessThan(lines.indexOf(GENERAL_HEAD[lang]));
  });

  it("is written for one screen too, since the files belong to the app", () => {
    setGlobalLang("en");
    const text = buildPrompt(fixture([makeItem("box")], { assets: TWO }), {}, "f", "en");
    expect(text).toContain(ASSETS_HEAD.en);
    expect(text).toContain("logo.svg");
  });

  it("leaves a sketch that lists nothing alone", () => {
    setGlobalLang("en");
    const plain = prompt("en", fixture([makeItem("box")]));
    expect(plain).not.toContain(ASSETS_HEAD.en);
    expect(prompt("en", fixture([makeItem("box")], { assets: [] }))).toBe(plain);
    /* a row whose name is empty is not a file yet: it is left out, and on its own it is no section */
    expect(prompt("en", fixture([makeItem("box")], { assets: [{ id: "a", name: "  ", kind: "logo" }] }))).toBe(plain);
  });

  it("keeps a row with no name out of the list but keeps the section alive", () => {
    setGlobalLang("en");
    const text = prompt("en", fixture([makeItem("box")], { assets: [TWO[0], { id: "b", name: "", kind: "other" }] }));
    expect(text).toContain(ASSETS_HEAD.en);
    expect(text).toContain("logo.svg");
    expect(text.split("\n").filter((l) => l.startsWith("- ") && l.endsWith("(other)")).length).toBe(0);
  });
});
