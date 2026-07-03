import { SectionHeader } from "./SectionHeader";
import { IconButton } from "./IconButton";

export default { title: "Layout / SectionHeader" };

// Title only — a bare section head row.
export const TitleOnly = () => <SectionHeader title="Abilities" />;

// Title + a right-aligned control (the abilities/languages add affordance).
export const WithControls = () => (
  <SectionHeader
    title="Languages"
    controls={
      <IconButton variant="accent" title="Add language" aria-label="Add language">
        <i className="fas fa-plus" aria-hidden="true" />
      </IconButton>
    }
  />
);
