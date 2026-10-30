import { useState } from "react";
import type { SaveVM, ExplorationVM, AbilityVM } from "@domain/vm-types";
import type { OSESave } from "@domain/types";
import { SectionTitle } from "@ui/SectionTitle";
import { cx } from "@ui/cx";
import { IconButton } from "@ui/IconButton";
import type { ActivateEvent } from "@ui/rollable";
import SavesModTag from "@src/OscSheet/components/ui/SavesModTag";

type Props = {
  abilities?: AbilityVM[];
  saves: SaveVM[];
  exploration: ExplorationVM[];
  tabbed?: boolean;
  onRollSave?: (key: OSESave, event: ActivateEvent) => void;
  onRollExploration?: (key: string, event: ActivateEvent) => void;
};

function RollRow({
  icon,
  label,
  value,
  die,
  rollLabel,
  onRoll,
  testId,
}: {
  icon: string;
  label: string;
  value: string | number;
  die: "d20" | "d6";
  rollLabel: string;
  onRoll?: (event: ActivateEvent) => void;
  testId?: string;
}) {
  return (
    <div className="fvtt-skill" data-testid={testId}>
      <i className={cx("skic", icon)} aria-hidden="true" />
      <span className="skn">{label}</span>
      <span className="skv">{value}</span>
      {onRoll && (
        <IconButton
          variant="raised"
          className="osc-icon-tone-brass"
          title={rollLabel}
          aria-label={rollLabel}
          onClick={onRoll}
        >
          <i className={`fa-solid fa-dice-${die}`} aria-hidden="true" />
        </IconButton>
      )}
    </div>
  );
}

export function SavesList({
  saves,
  onRoll,
}: {
  saves: SaveVM[];
  onRoll?: (key: OSESave, event: ActivateEvent) => void;
}) {
  return (
    <div className="fvtt-explore">
      {saves.map((s) => (
        <RollRow
          key={s.key}
          icon={s.icon}
          label={s.label}
          value={s.target}
          die="d20"
          rollLabel={`Roll ${s.label} save (≥ ${s.target})`}
          onRoll={onRoll && ((e) => onRoll(s.key, e))}
          testId={`save-${s.key}`}
        />
      ))}
    </div>
  );
}

export function ExplorationGrid({
  exploration,
  onRoll,
}: {
  exploration: ExplorationVM[];
  onRoll?: (key: string, event: ActivateEvent) => void;
}) {
  return (
    <div className="fvtt-explore osc-ruled-grid">
      {exploration.map((e) => (
        <RollRow
          key={e.key}
          icon={e.icon}
          label={e.label}
          value={`${e.inSix}-in-6`}
          die="d6"
          rollLabel={`Roll ${e.label} (${e.inSix}-in-6)`}
          onRoll={onRoll && ((ev) => onRoll(e.key, ev))}
        />
      ))}
    </div>
  );
}

/**
 * Saving throws (roll-above) + exploration (1-in-6). Rows roll when handlers
 * are supplied. `tabbed` shows them in a two-tab nav (used in the left rail so
 * the column stays above the fold); otherwise they stack with section titles.
 */
export function SavesExploration({
  saves,
  exploration,
  tabbed = false,
  onRollSave,
  onRollExploration,
  abilities,
}: Props) {
  const [tab, setTab] = useState<"saves" | "exploration">("saves");
  const wisdomAbility = (abilities || [])[2];

  if (!tabbed) {
    return (
      <section className="osc-section">
        <SectionTitle hint="roll-above d20">Saving Throws</SectionTitle>
        <SavesList saves={saves} onRoll={onRollSave} />
        <SectionTitle hint="1-in-6">Exploration</SectionTitle>
        <ExplorationGrid exploration={exploration} onRoll={onRollExploration} />
      </section>
    );
  }

  return (
    <section className="osc-section">
      <div
        className="osc-se-nav"
        role="tablist"
        aria-label="Saves & Exploration"
      >
        <button
          type="button"
          role="tab"
          aria-selected={tab === "saves"}
          className={cx("osc-se-tab", tab === "saves" && "active")}
          onClick={() => setTab("saves")}
        >
          <i className="fas fa-skull-crossbones" aria-hidden="true" />
          Saves
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "exploration"}
          className={cx("osc-se-tab", tab === "exploration" && "active")}
          onClick={() => setTab("exploration")}
        >
          <i className="fas fa-door-open" aria-hidden="true" />
          Exploration
        </button>
      </div>
      {tab === "saves" ? (
        <div className="tw:space-y-1">
          <SavesList saves={saves} onRoll={onRollSave} />
          <SavesModTag wisdomAbility={wisdomAbility} />
        </div>
      ) : (
        <ExplorationGrid exploration={exploration} onRoll={onRollExploration} />
      )}
    </section>
  );
}
