import "./wizard.scss";
import "./vellum-candidates.scss";
import { useMemo } from "react";
import { foundryCreationRules } from "./foundryRules";
import { houseRules, readHouseRuleSettings } from "./houseRuleSettings";
import { CreationWizard } from "./CreationWizard";
import type { OSEActor } from "@domain/types";

export default function CreationWizardApp({
  actor,
  onTitle,
  onCreated,
}: {
  actor?: OSEActor;
  onTitle?: (title: string) => void;
  onCreated?: () => void;
}) {
  const rules = useMemo(() => houseRules(readHouseRuleSettings()), []);
  const creationRules = useMemo(() => foundryCreationRules(actor), [actor]);
  return (
    <CreationWizard
      worldName={game.world?.title ?? ""}
      houseRules={rules}
      rules={creationRules}
      onTitle={onTitle}
      onCreated={onCreated}
    />
  );
}
