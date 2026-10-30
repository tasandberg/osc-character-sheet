import "./wizard.scss";
import "./vellum-candidates.scss";
import { useEffect, useMemo, useState } from "react";
import { foundryCreationRules } from "./foundryRules";
import { houseRules, readHouseRuleSettings } from "./houseRuleSettings";
import { CreationWizard } from "./CreationWizard";
import type { CreationRules } from "./rules";
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
  const [creationRules, setCreationRules] = useState<CreationRules>();
  useEffect(() => {
    let live = true;
    void foundryCreationRules(actor).then(
      (loaded) => live && setCreationRules(loaded),
    );
    return () => {
      live = false;
    };
  }, [actor]);
  if (!creationRules) return null;
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
