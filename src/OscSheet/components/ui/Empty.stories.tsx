import { Empty } from "./Empty";
import { Button } from "./Button";

export default { title: "Overlays / Empty" };

export const NoSpells = () => (
  <Empty
    title="No spells memorized"
    message="Prepare spells from your spellbook to see them here."
    action={<Button variant="primary">Memorize a spell</Button>}
  />
);
