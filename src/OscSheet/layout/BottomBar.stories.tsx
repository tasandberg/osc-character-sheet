import { useState } from "react";
import { BottomBar } from "@layout/BottomBar";
import type { TabItem } from "@layout/types";

export default { title: "Shell / Bottom Bar" };

const TABS: TabItem[] = [
  { id: "actions", label: "Actions", icon: <span>◈</span> },
  { id: "inventory", label: "Inventory", icon: <span>▤</span>, count: 15 },
  { id: "spells", label: "Spells", icon: <span>✦</span>, count: 3 },
  { id: "abilities", label: "Abilities", icon: <span>❖</span> },
  { id: "notes", label: "Notes", icon: <span>✎</span> },
];

function Demo() {
  const [active, setActive] = useState("actions");
  return (
    <div style={{ width: 360, border: "1px solid #3a342c", borderRadius: 8, overflow: "hidden" }}>
      <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: "#8a8270", fontSize: 13 }}>
        Active: <b style={{ marginLeft: 6, color: "#e5dec8" }}>{active}</b>
      </div>
      {/* Force display:flex so story shows the bar regardless of container width */}
      <div style={{ display: "flex" }}>
        <BottomBar tabs={TABS} active={active} onSelect={setActive} />
      </div>
    </div>
  );
}

export const Default = () => <Demo />;
