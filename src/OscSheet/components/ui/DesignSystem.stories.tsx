// Foundations overview for the Vellum design system: type scale, font families,
// in-context type samples, the semantic color palette, and the copy-pasteable
// color utilities (u-text-* / u-bg-* / u-border-*). Everything is token-derived
// (var(--…)); no hardcoded px/hex. Reads correctly on both themes since swatches
// resolve tokens live. Story-only scaffolding uses a few inline styles for demo
// sizing + the dynamic var() the swatch is demonstrating.

import type { CSSProperties, ReactNode } from "react";
import { SectionTitle } from "./SectionTitle";
import { Stamp } from "./Stamp";

export default { title: "Foundations / Design System" };

const mono: CSSProperties = { fontFamily: "var(--mono)", fontSize: "var(--fs-2xs)" };
const monoSm: CSSProperties = { fontFamily: "var(--mono)", fontSize: "var(--fs-3xs)" };

const Token = ({ children }: { children: ReactNode }) => (
  <span className="u-text-faint" style={mono}>{children}</span>
);

/* ─── Type scale ──────────────────────────────────────────────────────────── */

const TYPE_SCALE: Array<{ token: string; px: string; note?: string }> = [
  { token: "--fs-3xs", px: "10px", note: "micro labels, timestamps" },
  { token: "--fs-2xs", px: "11px", note: "stat keys, stamps" },
  { token: "--fs-xs", px: "12px", note: "fine print, meta" },
  { token: "--fs-sm", px: "13px", note: "secondary body" },
  { token: "--fs-md", px: "14px" },
  { token: "--fs-base", px: "15px", note: "body default" },
  { token: "--fs-lg", px: "16px", note: "emphasized body" },
  { token: "--fs-xl", px: "18px", note: "small headings, lead-in" },
  { token: "--fs-2xl", px: "21px" },
  { token: "--fs-3xl", px: "24px", note: "section heads" },
  { token: "--fs-4xl", px: "28px" },
  { token: "--fs-5xl", px: "33px", note: "large stat numerals" },
  { token: "--fs-6xl", px: "38px", note: "hero numerals (HP/AC)" },
  { token: "--fs-7xl", px: "44px" },
  { token: "--fs-8xl", px: "56px", note: "display numerals" },
];

const TypeScaleRow = ({ token, px, note }: { token: string; px: string; note?: string }) => (
  <div className="u-row u-gap-4 u-items-baseline u-border-soft u-py-2" style={{ borderWidth: 0, borderBottomWidth: 1 }}>
    <div
      className="u-flex-1 u-text"
      style={{ fontFamily: "var(--display)", fontSize: `var(${token})`, lineHeight: "var(--lh-tight)" }}
    >
      Vellum Ag
    </div>
    <div className="u-stack u-gap-0 u-items-end u-flex-none">
      <Token>{token}</Token>
      <span className="u-text-muted" style={monoSm}>{px}{note ? ` · ${note}` : ""}</span>
    </div>
  </div>
);

/* ─── Font families ───────────────────────────────────────────────────────── */

const FAMILIES: Array<{ token: string; name: string }> = [
  { token: "--display", name: "IM Fell English SC" },
  { token: "--serif", name: "IM Fell English" },
  { token: "--sans", name: "Inter" },
  { token: "--mono", name: "JetBrains Mono" },
];

const FamilySpecimen = ({ token, name }: { token: string; name: string }) => (
  <div className="u-stack u-gap-1 u-bg-surface u-border-soft u-p-4" style={{ borderRadius: "var(--r-md)" }}>
    <div className="u-row u-justify-between u-items-baseline">
      <span className="u-text" style={{ fontFamily: "var(--sans)", fontSize: "var(--fs-md)", fontWeight: 600 }}>{name}</span>
      <Token>var({token})</Token>
    </div>
    <div className="u-text" style={{ fontFamily: `var(${token})`, fontSize: "var(--fs-2xl)", lineHeight: "var(--lh-snug)" }}>
      The Rogue Delves Ever Deeper
    </div>
    <div className="u-text-dim" style={{ fontFamily: `var(${token})`, fontSize: "var(--fs-sm)" }}>
      Sphinx of black quartz, judge my vow — 0123456789
    </div>
  </div>
);

/* ─── Color palette ───────────────────────────────────────────────────────── */

type ColorGroup = { label: string; note?: string; tokens: string[] };

const COLOR_GROUPS: ColorGroup[] = [
  {
    label: "Surfaces",
    note: "page → raised panels",
    tokens: ["--bg", "--bg-2", "--surface", "--surface-2", "--surface-3", "--ink"],
  },
  {
    label: "Text tiers",
    note: "on --bg (--stamp-text is ink-on-cream, theme-constant)",
    tokens: ["--text", "--text-dim", "--text-mute", "--text-faint", "--stamp-text"],
  },
  {
    label: "Accents",
    note: "teal = primary, brass (--accent-alt) = gold/treasure/XP",
    tokens: ["--teal", "--teal-dim", "--accent-alt", "--accent-alt-dim", "--forest", "--mustard", "--gold-bright"],
  },
  {
    label: "Intents",
    note: "semantic aliases — resolve to the accents above",
    tokens: ["--crimson", "--crimson-dim", "--hit", "--damage", "--magic", "--gold", "--miss"],
  },
  {
    label: "Borders",
    note: "hairlines + the section rule under titles",
    tokens: ["--border", "--border-soft", "--section-rule"],
  },
];

const Swatch = ({ token }: { token: string }) => (
  <div className="u-stack u-gap-1 u-items-center">
    <div
      className="u-border-soft"
      style={{ width: 60, height: 44, borderRadius: "var(--r-sm)", background: `var(${token})` }}
    />
    <Token>{token}</Token>
  </div>
);

const PaletteGroup = ({ label, note, tokens }: ColorGroup) => (
  <div className="u-stack u-gap-2">
    <div className="u-row u-gap-2 u-items-baseline u-wrap">
      <span className="section-title sub">{label}</span>
      {note && <span className="u-text-faint" style={monoSm}>{note}</span>}
    </div>
    <div className="u-row u-gap-4 u-wrap">
      {tokens.map((t) => <Swatch key={t} token={t} />)}
    </div>
  </div>
);

/* ─── Color utilities (copy-pasteable class names) ────────────────────────── */

const TEXT_UTILS = [
  "u-text", "u-text-dim", "u-text-muted", "u-text-faint",
  "u-text-accent", "u-text-brass", "u-text-danger", "u-text-warn", "u-text-success",
];
const BG_UTILS = [
  "u-bg", "u-bg-2", "u-bg-surface", "u-bg-surface-2", "u-bg-surface-3",
  "u-bg-ink", "u-bg-accent", "u-bg-brass", "u-bg-danger",
];
const BORDER_UTILS = ["u-border", "u-border-soft", "u-border-accent", "u-border-brass", "u-border-danger"];

const UtilChip = ({ cls, children }: { cls: string; children?: ReactNode }) => (
  <div className="u-stack u-gap-1 u-items-center">
    <div
      className={`${cls} u-border-soft u-row u-justify-center u-items-center`}
      style={{ width: 92, height: 44, borderRadius: "var(--r-sm)" }}
    >
      {children}
    </div>
    <Token>{cls}</Token>
  </div>
);

/* ─── Page ────────────────────────────────────────────────────────────────── */

export const Overview = () => (
  <div className="u-stack u-gap-8">
    {/* ── Typography ── */}
    <section className="u-stack u-gap-4">
      <SectionTitle hint="type scale · families · in-context">Typography</SectionTitle>

      <span className="section-title sub">Type scale — var(--fs-*)</span>
      <div className="u-stack u-gap-0">
        {TYPE_SCALE.map((t) => <TypeScaleRow key={t.token} {...t} />)}
      </div>

      <span className="section-title sub">Font families</span>
      <div className="u-grid-2 u-gap-3">
        {FAMILIES.map((f) => <FamilySpecimen key={f.token} {...f} />)}
      </div>

      <span className="section-title sub">In context</span>
      <div className="u-stack u-gap-3 u-bg-surface u-border-soft u-p-4" style={{ borderRadius: "var(--r-md)" }}>
        <SectionTitle hint="a section head with its rule">Combat</SectionTitle>
        <p className="rule">Italic serif rule callout — the print-sheet explanatory line.</p>
        <p className="u-text-dim" style={{ fontFamily: "var(--serif)", fontSize: "var(--fs-md)", margin: 0, maxWidth: "70ch" }}>
          Body copy is set in the serif face at <code style={mono}>--fs-md</code>. It carries
          rules text and descriptions across the sheet.
        </p>
        <div className="u-row u-gap-3 u-items-center u-wrap">
          <Stamp size="lg">STR</Stamp>
          <Stamp size="md">HP</Stamp>
          <Stamp size="sm">AC</Stamp>
          <span className="caps u-text-muted" style={{ fontFamily: "var(--sans)", fontSize: "var(--fs-2xs)" }}>
            Uppercase label
          </span>
          <span className="mono u-text" style={{ fontSize: "var(--fs-sm)" }}>+2 · 1d8 · THAC0 17</span>
        </div>
      </div>
    </section>

    {/* ── Colors ── */}
    <section className="u-stack u-gap-4">
      <SectionTitle hint="semantic palette · token per swatch">Colors</SectionTitle>
      {COLOR_GROUPS.map((g) => <PaletteGroup key={g.label} {...g} />)}
      <p className="u-text-faint" style={{ ...monoSm, margin: 0 }}>
        Legacy aliases (--brass, --oxblood, --sage, --lapis, --plum) are omitted — they remap to the accents above.
      </p>
    </section>

    {/* ── Color utilities ── */}
    <section className="u-stack u-gap-4">
      <SectionTitle hint="copy-pasteable u-* classes">Color utilities</SectionTitle>

      <span className="section-title sub">Text — .u-text-*</span>
      <div className="u-row u-gap-4 u-wrap" style={{ fontFamily: "var(--display)", fontSize: "var(--fs-xl)" }}>
        {TEXT_UTILS.map((cls) => (
          <span key={cls} className={cls} title={cls}>{cls.replace("u-text-", "").replace("u-text", "text") || "text"}</span>
        ))}
      </div>
      <div className="u-row u-gap-2 u-wrap">
        {TEXT_UTILS.map((cls) => <Token key={cls}>.{cls}</Token>)}
      </div>

      <span className="section-title sub">Background — .u-bg-*</span>
      <div className="u-row u-gap-4 u-wrap">
        {BG_UTILS.map((cls) => <UtilChip key={cls} cls={cls} />)}
      </div>

      <span className="section-title sub">Border — .u-border-*</span>
      <div className="u-row u-gap-3 u-wrap">
        {BORDER_UTILS.map((cls) => (
          <div
            key={cls}
            className={`${cls} u-p-3 u-text-dim`}
            style={{ borderRadius: "var(--r-sm)", ...mono }}
          >
            .{cls}
          </div>
        ))}
      </div>
    </section>
  </div>
);
