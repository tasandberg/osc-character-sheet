import * as React from "react";
import { PillSelect } from "./PillSelect";

export default { title: "Controls / PillSelect" };

export const SpellLevels = () => {
  const [value, setValue] = React.useState(1);
  return (
    <PillSelect<number>
      ariaLabel="Spell level"
      value={value}
      onValueChange={setValue}
      options={[
        { value: 1, label: "Lv 1", count: 3 },
        { value: 2, label: "Lv 2", count: 0 },
        { value: 3, label: "Lv 3", count: 4 },
        { value: 4, label: "Lv 4", count: 4 },
        { value: 5, label: "Lv 5", count: 3 },
        { value: 6, label: "Lv 6", count: 3 },
      ]}
    />
  );
};
