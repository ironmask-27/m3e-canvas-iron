"use client";

import { t, useLang } from "@/lib/i18n";
import { ELEVATION_DP, ELEVATIONS, Elevation, Item, ItemStyle, Palette, normalizeStyle } from "@/lib/tokens";
import { Section, Segmented } from "./ui";

/** the opacities the panel offers: 100% is the part's normal look and is stored as nothing */
const OPACITIES = [100, 80, 60, 40, 20] as const;

/** A part's own look, beyond the variant it wears: how far it is faded, and -- for a box,
 *  the one kind a shadow means anything on -- which elevation level it sits at. Both are
 *  written into the generated prompt. */
export function AppearanceRows({
  item,
  palette: p,
  onChange,
}: {
  item: Item;
  palette: Palette;
  onChange: (patch: Partial<Item>) => void;
}) {
  const lang = useLang();
  const style = normalizeStyle(item.style);
  /* every write goes through normalizeStyle, so a field put back to its default leaves no trace */
  const set = (patch: ItemStyle) => onChange({ style: normalizeStyle({ ...style, ...patch }) });

  return (
    <Section id="part-appearance" icon="opacity" title={t("appearance", lang)} p={p}>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <Segmented
          label={t("opacity", lang)}
          options={OPACITIES.map((v) => ({ key: String(v), label: `${v}%`, title: `${v}%` }))}
          value={String(style?.opacity ?? 100)}
          onChange={(k) => {
            const v = Number(k);
            set({ opacity: v === 100 ? undefined : v });
          }}
          p={p}
        />
        {item.kind === "box" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <Segmented
              label={t("elevation", lang)}
              options={ELEVATIONS.map((v: Elevation) => ({ key: String(v), label: String(v), title: `${t("elevation", lang)} ${v} (${ELEVATION_DP[v]}dp)` }))}
              value={String(style?.elevation ?? 0)}
              onChange={(k) => set({ elevation: Number(k) === 0 ? undefined : (Number(k) as Elevation) })}
              p={p}
              grow
            />
            <div style={{ fontSize: 12, lineHeight: 1.5, color: p.onSurfaceVariant, padding: "0 4px" }}>
              {t("elevationHint", lang)}
            </div>
          </div>
        )}
      </div>
    </Section>
  );
}
