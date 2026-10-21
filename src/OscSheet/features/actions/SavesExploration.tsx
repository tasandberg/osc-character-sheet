import { useState } from "react";
import type { SaveVM, ExplorationVM, AbilityVM } from "@domain/vm-types";
import type { OSESave } from "@domain/types";
import { SectionTitle } from "@ui/SectionTitle";
import { cx } from "@ui/cx";
import { rollable, type ActivateEvent } from "@ui/rollable";
import SavesModTag from "@src/OscSheet/components/ui/SavesModTag";

type Props = {
  abilities?: AbilityVM[];
  saves: SaveVM[];
  exploration: ExplorationVM[];
  tabbed?: boolean;
  onRollSave?: (key: OSESave, event: ActivateEvent) => void;
  onRollExploration?: (key: string, event: ActivateEvent) => void;
};

export function SavesBand({
  saves,
  onRoll,
}: {
  saves: SaveVM[];
  onRoll?: (key: OSESave, event: ActivateEvent) => void;
}) {
  return (
    <div className="osc-saves-band">
      {saves.map((s) => (
        <div
          key={s.key}
          className={cx("osc-saves-band-cell", onRoll && "rollable")}
          title={onRoll ? `Roll ${s.label} save (≥ ${s.target})` : undefined}
          data-testid={`save-${s.key}`}
          {...rollable(onRoll && ((e) => onRoll(s.key, e)))}
        >
          <span className="osc-saves-band-label">{s.label}</span>
          <span className="osc-saves-band-value">{s.target}</span>
        </div>
      ))}
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
        <div
          key={s.key}
          className={cx("fvtt-skill", onRoll && "rollable")}
          title={onRoll ? `Roll ${s.label} save (≥ ${s.target})` : undefined}
          data-testid={`save-${s.key}`}
          {...rollable(onRoll && ((e) => onRoll(s.key, e)))}
        >
          <i className={cx("skic", s.icon)} aria-hidden="true" />
          <span className="skn">{s.label}</span>
          <span className="skv">
            {s.target}
            <span className="osc-roll-die" aria-hidden="true">
              <i className="fa-solid fa-dice-d20 roll-label-die" />
            </span>
          </span>
        </div>
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
        <div
          key={e.key}
          className={cx("fvtt-skill", onRoll && "rollable")}
          title={onRoll ? `Roll ${e.label} (${e.inSix}-in-6)` : undefined}
          {...rollable(onRoll && ((ev) => onRoll(e.key, ev)))}
        >
          <i className={cx("skic", e.icon)} aria-hidden="true" />
          <span className="skn">{e.label}</span>
          <span className="skv">
            {e.inSix}-in-6
            <span className="osc-roll-die" aria-hidden="true">
              <i className="fa-solid fa-dice-d6 roll-label-die" />
            </span>
          </span>
        </div>
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
        <SavesBand saves={saves} onRoll={onRollSave} />
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
