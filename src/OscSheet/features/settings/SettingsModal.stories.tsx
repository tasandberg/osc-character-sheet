import * as React from "react";
import { SettingsModal } from "./SettingsModal";

export default { title: "Overlays / SettingsModal" };

export const Open = () => {
  const [open, setOpen] = React.useState(true);
  return <SettingsModal open={open} onClose={() => setOpen(false)} />;
};
