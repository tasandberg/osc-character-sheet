import * as React from "react";
import { Segmented } from "./Segmented";

export default { title: "Controls / Segmented" };

// TODO(P2, report §3): icon-only segments (AttacksTable .kind-switch) need a new
// prop — Option.label is a plain string today. Add an icon/render option before
// storying the icon-only toggle; not part of this stories-only wave.

export const Interactive = () => {
  const [value, setValue] = React.useState("combat");
  return (
    <Segmented
      options={[
        { value: "combat", label: "Combat" },
        { value: "spells", label: "Spells" },
      ]}
      value={value}
      onValueChange={setValue}
    />
  );
};
