import { useState } from "react";
import { Frame } from "@layout/Frame";
import type { TabItem } from "@layout/types";
import { Card } from "@ui/Card";
import { SectionTitle } from "@ui/SectionTitle";

export default { title: "Shell / App Shell" };

// Glyph icons (FontAwesome isn't loaded in Storybook); the real sheet passes <i class="fa…"/>.
const TABS: TabItem[] = [
  { id: "actions", label: "Actions", icon: <span>◈</span> },
  { id: "inventory", label: "Inventory", icon: <span>▤</span>, count: 15 },
  { id: "spells", label: "Spells", icon: <span>✦</span>, count: 3 },
  { id: "abilities", label: "Abilities", icon: <span>❖</span> },
  { id: "notes", label: "Notes", icon: <span>✎</span> },
];

function Demo() {
  const [active, setActive] = useState("actions");
  const label = TABS.find((t) => t.id === active)?.label ?? "";
  return (
    <Frame tabs={TABS} active={active} onSelect={setActive}>
      <SectionTitle hint="resize the frame to see the reflow">{label}</SectionTitle>
      <Card>
        Active tab: <b>{active}</b>. Drag the panel's right edge: vertical rail ⇄ horizontal
        tabs at ~800c, single-column ⇄ two-pane at ~760c. Append <code>?theme=cream</code> to
        the URL for the cream theme.
      </Card>
    </Frame>
  );
}

export const Responsive = () => <Demo />;
