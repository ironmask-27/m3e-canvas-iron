/**
 * A golden snapshot of the generated prompt.
 *
 * One rich document — two screens (a phone one and a desktop one), a top app bar, a
 * connected pair of buttons (one with a tap action, one a toggle), a card, a
 * navigation bar, a rail, list items, a text field and a carousel — is written out in
 * every language, for both platforms, whole and for a single screen. Any change to the
 * generator's wording or ordering shows up here, so later features must keep it
 * byte-for-byte identical.
 */
import { afterEach, describe, expect, it } from "vitest";

import { Lang, setGlobalLang } from "./i18n";
import { buildPrompt } from "./prompt";
import { DEFAULT_THEME, Doc, Item, Platform, defaultTabs, makeItem } from "./tokens";

const LANGS: Lang[] = ["ja", "en", "zh", "ko"];
const PLATFORMS: Platform[] = ["android", "web"];

/** the phone screen, and the desktop screen the phone one opens */
const HOME = "f-home";
const WIDE = "f-wide";

/** the document every snapshot is taken from: build it after setGlobalLang so the part
 *  defaults follow the language, exactly as the other prompt tests do */
function fixture(platform: Platform): Doc {
  const appBar: Item = { ...makeItem("topAppBar"), id: "appbar", label: "Home", icon: "menu", icon2: "search" };
  const open: Item = { ...makeItem("button"), id: "open", label: "Open", action: { to: WIDE, transition: "slide" } };
  const starring: Item = {
    ...makeItem("button"),
    id: "star",
    label: "Star",
    variant: "tonal",
    icon: "star",
    toggle: { icon: "star", variant: "filled", label: "Starred" },
  };
  const nav: Item = { ...makeItem("bottomNav"), id: "nav", tabs: defaultTabs(), selected: 1 };
  const card: Item = {
    ...makeItem("card"),
    id: "card",
    label: "Espresso",
    supporting: "A short description of the picture",
    src: "https://example.com/photo.png",
    imageSize: 120,
  };
  const rail: Item = { ...makeItem("navRail"), id: "rail", tabs: defaultTabs() };
  const rows: Item[] = [
    { ...makeItem("listItem"), id: "row-a", label: "Dark roast", supporting: "Yesterday", icon: "local_cafe", icon2: "star" },
    { ...makeItem("listItem"), id: "row-b", label: "Light roast", supporting: "2 days ago", icon: "local_cafe", icon2: "star" },
  ];
  const field: Item = { ...makeItem("textField"), id: "field", label: "Search" };
  const carousel: Item = { ...makeItem("carousel"), id: "carousel" };
  return {
    groups: [
      { id: "g-appbar", x: 0, y: 0, axis: "x", items: [appBar] },
      { id: "g-buttons", x: 16, y: 400, axis: "x", items: [open, starring] },
      { id: "g-card", x: 16, y: 500, axis: "x", items: [card] },
      { id: "g-nav", x: 0, y: 812, axis: "x", items: [nav] },
      { id: "g-rail", x: 500, y: 0, axis: "x", items: [rail] },
      { id: "g-list", x: 600, y: 120, axis: "y", items: rows },
      { id: "g-field", x: 600, y: 300, axis: "x", items: [field] },
      { id: "g-carousel", x: 600, y: 400, axis: "x", items: [carousel] },
    ],
    frames: [
      { id: HOME, name: "Home", x: 0, y: 0, note: "The screen the app opens on.", swipe: { left: WIDE } },
      { id: WIDE, name: "Home wide", x: 500, y: 0, w: 1280, h: 800 },
    ],
    paletteKey: "purple",
    frame: "phone",
    platform,
    title: "Brew Log",
    brief: "A small app for logging the coffee you brew.",
    theme: { ...DEFAULT_THEME, bothModes: true },
    promptOptions: ["deliverable", "tests", "darkMode"],
  };
}

const CASES = LANGS.flatMap((lang) => PLATFORMS.map((platform) => ({ lang, platform })));

describe("golden prompt", () => {
  afterEach(() => setGlobalLang("ja"));

  it.each(CASES)("writes the whole document in $lang for $platform", ({ lang, platform }) => {
    setGlobalLang(lang);
    expect(buildPrompt(fixture(platform), {}, undefined, lang)).toMatchSnapshot();
  });

  it.each(CASES)("writes one screen of it in $lang for $platform", ({ lang, platform }) => {
    setGlobalLang(lang);
    expect(buildPrompt(fixture(platform), {}, HOME, lang)).toMatchSnapshot();
  });
});
