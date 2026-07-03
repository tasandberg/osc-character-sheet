import * as React from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";

export default { title: "Overlays / Modal" };

export const LevelUp = () => {
  const [open, setOpen] = React.useState(true);
  return (
    <Modal
      open={open}
      title="Level Up — Magic-User 3 → 4"
      onClose={() => setOpen(false)}
      footer={
        <>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => setOpen(false)}>
            Confirm
          </Button>
        </>
      }
    >
      Your hit points increase and you gain access to new spell slots. Confirm to apply
      the changes to your character.
    </Modal>
  );
};
