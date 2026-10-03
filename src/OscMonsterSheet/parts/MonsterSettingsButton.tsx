import { useState } from "react";
import { IconButton } from "@ui/IconButton";
import { SettingsModal } from "@features/settings/SettingsModal";

export function MonsterSettingsButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <IconButton
        className="u-flex-none tw:self-start"
        aria-label="Settings"
        title="Settings"
        onClick={() => setOpen(true)}
      >
        <i className="fa-solid fa-gear" aria-hidden="true" />
      </IconButton>
      <SettingsModal
        open={open}
        onClose={() => setOpen(false)}
        sheet="monster"
      />
    </>
  );
}
