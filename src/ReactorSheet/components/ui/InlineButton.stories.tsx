import { InlineButton } from "./InlineButton";

export default { title: "Controls / InlineButton" };

export const Variants = () => (
  <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
    <InlineButton>Edit</InlineButton>
    <InlineButton>
      <i className="fa-solid fa-pen" aria-hidden="true" /> With icon
    </InlineButton>
    <InlineButton aria-label="Add" title="Add">
      <i className="fa-solid fa-plus" aria-hidden="true" />
    </InlineButton>
    <InlineButton disabled>Disabled</InlineButton>
  </div>
);
