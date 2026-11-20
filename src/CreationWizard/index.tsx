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
  const [creationRules, setCreationRules] = useState<CreationRules>();
  const rules = useMemo(
    () =>
      houseRules({
        ...readHouseRuleSettings(),
        raceMode: creationRules?.races.length
          ? creationRules.raceMode
          : undefined,
        scoreMethods: creationRules?.scoreMethods,
      }),
    [creationRules],
  );
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let live = true;
    void foundryCreationRules(actor).then(
      (loaded) => live && setCreationRules(loaded),
      (error) => {
        console.error(error);
        if (live) setFailed(true);
      },
    );
    return () => {
      live = false;
    };
  }, [actor, attempt]);
  if (failed)
    return (
      <div className="osc-sheet-app osc-creation-wizard-app vm-paper">
        <div role="alert" className="u-stack u-gap-3 u-items-start u-p-5">
          <p className="vm-help">
            Couldn’t load the classes and races for character creation.
          </p>
          <button
            type="button"
            className="vm-btn vm-btn-secondary"
            onClick={() => {
              setFailed(false);
              setAttempt((n) => n + 1);
            }}
          >
            Try again
          </button>
        </div>
      </div>
    );
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
