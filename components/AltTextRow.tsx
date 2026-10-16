"use client";

import { t, useLang } from "@/lib/i18n";
import { Item, Palette } from "@/lib/tokens";
import { Field } from "./ui";

/** how long a picture's description may be */
export const ALT_MAX = 200;

/** What a picture shows. It goes into the generated prompt in place of "the provided image",
 *  and it is the description a screen reader reads out. Empty text removes the field. */
export function AltTextRow({ item, palette: p, onChange }: { item: Item; palette: Palette; onChange: (patch: Partial<Item>) => void }) {
  const lang = useLang();
  return (
    <Field
      value={item.alt ?? ""}
      onChange={(v) => onChange({ alt: v.trim() ? v : undefined })}
      placeholder={t("altText", lang)}
      p={p}
      icon="image"
      maxLength={ALT_MAX}
    />
  );
}
