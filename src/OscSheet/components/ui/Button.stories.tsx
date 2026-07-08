import type { ReactNode } from "react";
import { Button } from "./Button";

export default { title: "Controls / Button" };

const Row = ({ label, children }: { label: string; children: ReactNode }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
    <span
      style={{
        fontSize: 11,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        opacity: 0.6,
      }}
    >
      {label}
    </span>
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
      {children}
    </div>
  </div>
);

export const Variants = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
    <Row label="Variants">
      <Button>Default</Button>
      <Button variant="primary">Primary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="danger">Danger</Button>
      <Button variant="ghost">Ghost</Button>
    </Row>
    <Row label="Sizes & state">
      <Button variant="primary">Default size</Button>
      <Button variant="primary" size="sm">Small</Button>
      <Button variant="primary" disabled>Disabled</Button>
    </Row>
  </div>
);

// Colored outline tones — variant="outline" + tone. Names match the Vellum
// color vocabulary; each maps to a palette token via the tokens.scss @each loop.
const TONES = ["accent", "brass", "danger", "success", "warn"] as const;

export const OutlineTones = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
    <Row label="Outline tones">
      <Button variant="outline">default</Button>
      {TONES.map((tone) => (
        <Button key={tone} variant="outline" tone={tone}>
          {tone}
        </Button>
      ))}
    </Row>
    <Row label="Outline tones · with icon">
      {TONES.map((tone) => (
        <Button key={tone} variant="outline" tone={tone}>
          <i className="fa-solid fa-dice-d20 u-mr-1" aria-hidden="true" />
          {tone}
        </Button>
      ))}
    </Row>
    <Row label="Outline tones · small">
      {TONES.map((tone) => (
        <Button key={tone} variant="outline" tone={tone} size="sm">
          {tone}
        </Button>
      ))}
    </Row>
    <Row label="Outline tones · disabled (e.g. read-only Attack)">
      {TONES.map((tone) => (
        <Button key={tone} variant="outline" tone={tone} disabled>
          {tone}
        </Button>
      ))}
    </Row>
  </div>
);
