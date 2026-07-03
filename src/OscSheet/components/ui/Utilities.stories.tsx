// Demos the vellum utility classes (styles/vellum/utilities.scss). Story-only
// scaffolding — a few inline styles size the demo boxes; the utilities under
// test are the `u-*` classes.

import type { ReactNode } from "react";

export default { title: "Foundations / Utilities" };

const Label = ({ children }: { children: ReactNode }) => (
  <div className="u-text-muted u-mb-2" style={{ fontFamily: "var(--mono)", fontSize: "var(--fs-2xs)" }}>
    {children}
  </div>
);

const Box = ({ children }: { children?: ReactNode }) => (
  <div
    className="u-bg-surface-2 u-border-soft u-text-dim"
    style={{ minWidth: 32, minHeight: 32, display: "grid", placeItems: "center", fontFamily: "var(--mono)", fontSize: "var(--fs-3xs)" }}
  >
    {children}
  </div>
);

const SPACE_STEPS = [1, 2, 3, 4, 5, 6, 8, 10, 12];

export const Spacing = () => (
  <div className="u-stack u-gap-4">
    <Label>padding — .u-p-{"{step}"}</Label>
    <div className="u-row u-gap-3 u-items-end u-wrap">
      {SPACE_STEPS.map((s) => (
        <div key={s} className="u-stack u-gap-1 u-items-center">
          <div className={`u-bg-accent u-p-${s}`} style={{ borderRadius: "var(--r-sm)" }}>
            <div className="u-bg-ink" style={{ width: 16, height: 16 }} />
          </div>
          <div className="u-text-faint" style={{ fontFamily: "var(--mono)", fontSize: "var(--fs-3xs)" }}>{s}</div>
        </div>
      ))}
    </div>
  </div>
);

export const StackRowGrid = () => (
  <div className="u-stack u-gap-6">
    <div>
      <Label>.u-stack (flex column + gap)</Label>
      <div className="u-stack u-gap-2">
        <Box>1</Box>
        <Box>2</Box>
        <Box>3</Box>
      </div>
    </div>

    <div>
      <Label>.u-row .u-justify-between</Label>
      <div className="u-row u-justify-between u-bg-surface u-p-3" style={{ borderRadius: "var(--r-md)" }}>
        <Box>A</Box>
        <Box>B</Box>
        <Box>C</Box>
      </div>
    </div>

    <div>
      <Label>.u-grid-3 .u-gap-3</Label>
      <div className="u-grid-3 u-gap-3">
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <Box key={n}>{n}</Box>
        ))}
      </div>
    </div>

    <div>
      <Label>.u-row + .u-flex-1 (middle grows)</Label>
      <div className="u-row u-gap-2">
        <Box>fixed</Box>
        <div className="u-flex-1 u-bg-surface-2 u-border-soft u-p-2 u-text-dim" style={{ fontFamily: "var(--mono)", fontSize: "var(--fs-3xs)" }}>
          .u-flex-1
        </div>
        <Box>fixed</Box>
      </div>
    </div>
  </div>
);

// Color utilities (u-text-* / u-bg-* / u-border-*) and swatches live on the
// "Foundations / Design System" page. Keep this story focused on spacing/layout.
