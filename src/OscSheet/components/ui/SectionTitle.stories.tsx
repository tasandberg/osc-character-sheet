import { SectionTitle } from "./SectionTitle";

export default { title: "Layout / SectionTitle" };

export const WithHint = () => (
  <SectionTitle hint="3 prepared">Spells</SectionTitle>
);

export const WithoutHint = () => <SectionTitle>Inventory</SectionTitle>;

// `sub` — small uppercase sans label for sub-section heads, no rule.
export const Sub = () => <SectionTitle variant="sub">Equipped</SectionTitle>;

// `bare` — display serif, rule + margins dropped (embedded heads like a modal title).
export const Bare = () => <SectionTitle variant="bare">Character Details</SectionTitle>;
