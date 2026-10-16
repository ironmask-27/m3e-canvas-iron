"use client";

import { t, useLang } from "@/lib/i18n";
import { ASSET_KINDS, Asset, AssetKind, MAX_ASSETS, Palette, uid } from "@/lib/tokens";
import { Icon } from "./M3Node";
import { Field, IconBtn, Section, Segmented } from "./ui";

/** how long a name and a use may be */
const NAME_MAX = 80;
const USE_MAX = 300;

/** the key each kind is labelled with in the panel */
const KIND_KEY: Record<AssetKind, "assetLogo" | "assetIcon" | "assetImage" | "assetFont" | "assetOther"> = {
  logo: "assetLogo",
  icon: "assetIcon",
  image: "assetImage",
  font: "assetFont",
  other: "assetOther",
};

/** The files the author hands to the coding tool with the prompt: a logo, a font, an icon set.
 *  The prompt names each one and tells the tool not to invent a substitute. An empty list
 *  removes the field, so a sketch that lists nothing reads exactly as it did before. */
export function AssetsEditor({
  assets,
  onChange,
  p,
}: {
  assets: Asset[];
  onChange: (assets: Asset[] | undefined) => void;
  p: Palette;
}) {
  const lang = useLang();
  /* one in, one out: the field is dropped rather than kept as an empty list */
  const write = (next: Asset[]) => onChange(next.length ? next : undefined);
  const set = (i: number, patch: Partial<Asset>) => write(assets.map((a, j) => (j === i ? { ...a, ...patch } : a)));

  return (
    <Section id="doc-assets" icon="folder_open" title={t("assets", lang)} p={p} defaultOpen={assets.length > 0}>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {assets.length > 0 && <div style={{ fontSize: 12, lineHeight: 1.5, color: p.onSurfaceVariant, padding: "0 4px" }}>{t("assetsHint", lang)}</div>}
        {assets.map((a, i) => (
          <div key={a.id} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <Field value={a.name} onChange={(name) => set(i, { name })} placeholder={t("assetName", lang)} p={p} maxLength={NAME_MAX} />
              <IconBtn icon="close" p={p} onClick={() => write(assets.filter((_, j) => j !== i))} title={t("delete", lang)} />
            </div>
            <Segmented
              label={t("assetKind", lang)}
              options={ASSET_KINDS.map((k) => ({ key: k, label: t(KIND_KEY[k], lang) }))}
              value={a.kind}
              onChange={(k) => set(i, { kind: k as AssetKind })}
              p={p}
              tight
            />
            <Field value={a.use ?? ""} onChange={(use) => set(i, { use: use.trim() ? use : undefined })} placeholder={t("assetUse", lang)} p={p} maxLength={USE_MAX} />
          </div>
        ))}
        {assets.length < MAX_ASSETS && (
          <button
            onClick={() => write([...assets, { id: uid(), name: "", kind: "logo" }])}
            className="m3-press"
            style={{
              height: 44,
              borderRadius: 22,
              border: `1px solid ${p.outline}`,
              background: "transparent",
              color: p.primary,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            <Icon name="add" size={18} />
            {t("addAsset", lang)}
          </button>
        )}
      </div>
    </Section>
  );
}
