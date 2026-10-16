"use client";

import { t, useLang } from "@/lib/i18n";
import { COMPONENT_NAME_MAX, Palette } from "@/lib/tokens";
import { Field, Section } from "./ui";

/** The author's name for a section that is meant to be built once and reused: a card, a row.
 *  The generated prompt then asks the coding tool for one component instead of describing every
 *  copy part by part. Empty text removes the name.
 *
 *  A name is not a link between copies: naming a section does not make editing one copy change
 *  the others, it only tells the coding tool how to build what it is reading. */
export function ComponentNameRow({
  value,
  palette: p,
  onChange,
}: {
  value: string;
  palette: Palette;
  onChange: (name: string | undefined) => void;
}) {
  const lang = useLang();
  return (
    <Section id="group-component" icon="widgets" title={t("component", lang)} p={p}>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <Field
          value={value}
          onChange={(v) => onChange(v.trim() ? v : undefined)}
          placeholder={t("componentName", lang)}
          p={p}
          icon="widgets"
          maxLength={COMPONENT_NAME_MAX}
        />
        <div style={{ fontSize: 12, lineHeight: 1.5, color: p.onSurfaceVariant, padding: "0 4px", textWrap: "pretty" }}>{t("componentHint", lang)}</div>
      </div>
    </Section>
  );
}
