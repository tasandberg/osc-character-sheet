import "./wizard.scss";
import { useMemo } from "react";
import type { OSEActor } from "@domain/types";
import type { FlagDocument } from "@domain/flags";
import { userFlagDraftStore } from "./draftStore";
import { houseRules, readHouseRuleSettings } from "./houseRuleSettings";
import { CreationWizard } from "./CreationWizard";

type Props = {
  actor?: OSEActor;
  onClose: () => void;
};

export default function CreationWizardApp({ actor, onClose }: Props) {
  const store = useMemo(
    () =>
      userFlagDraftStore(
        game.user as unknown as FlagDocument,
        actor?.id ?? "new",
      ),
    [actor?.id],
  );
  const rules = useMemo(() => houseRules(readHouseRuleSettings()), []);
  return (
    <CreationWizard
      worldName={game.world?.title ?? ""}
      houseRules={rules}
      store={store}
      onClose={onClose}
    />
  );
}
