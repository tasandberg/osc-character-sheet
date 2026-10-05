import "./wizard.scss";
import { useMemo } from "react";
import { houseRules, readHouseRuleSettings } from "./houseRuleSettings";
import { CreationWizard } from "./CreationWizard";

export default function CreationWizardApp() {
  const rules = useMemo(() => houseRules(readHouseRuleSettings()), []);
  return (
    <CreationWizard worldName={game.world?.title ?? ""} houseRules={rules} />
  );
}
