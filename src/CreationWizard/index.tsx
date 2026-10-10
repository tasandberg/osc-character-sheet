import "./wizard.scss";
import "./vellum-candidates.scss";
import { useMemo } from "react";
import { foundryCreationRules } from "./foundryRules";
import { houseRules, readHouseRuleSettings } from "./houseRuleSettings";
import { CreationWizard } from "./CreationWizard";

export default function CreationWizardApp({
  onTitle,
}: {
  onTitle?: (title: string) => void;
}) {
  const rules = useMemo(() => houseRules(readHouseRuleSettings()), []);
  const creationRules = useMemo(foundryCreationRules, []);
  return (
    <CreationWizard
      worldName={game.world?.title ?? ""}
      houseRules={rules}
      rules={creationRules}
      onTitle={onTitle}
    />
  );
}
