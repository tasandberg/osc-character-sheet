import { useState } from "react";
import type { SaveVM, ExplorationVM } from "@domain/vm-types";
import type { OSESave } from "@domain/types";
import { SectionTitle } from "@ui/SectionTitle";
import { StatPlaque } from "@ui/StatPlaque";
import { cx } from "@ui/cx";
import { rollable } from "@ui/rollable";

type Props = {
  saves: SaveVM[];
  exploration: ExplorationVM[];
  tabbed?: boolean;
  onRollSave?: (key: OSESave) => void;
  onRollExploration?: (key: string) => void;
};

/** 1–2 char ink-stamp from the save label (Death → D, Paralysis → P). */
function saveStamp(label: string): string {
  return label.charAt(0).toUpperCase();
}

export function SavesGrid({ saves, onRoll }: { saves: SaveVM[]; onRoll?: (key: OSESave) => void }) {
  return (
    <div className="fvtt-saves">
      {saves.map((s) => (
        <StatPlaque
          key={s.key}
          className="fvtt-save"
          stampClassName="sk"
          stampKey={saveStamp(s.label)}
          value={s.target}
          caption={s.label}
          valueClassName="sv"
          captionClassName="sn"
          onActivate={onRoll && (() => onRoll(s.key))}
          title={onRoll ? `Roll ${s.label} save (≥ ${s.target})` : undefined}
          data-testid={`save-${s.key}`}
        />
      ))}
    </div>
  );
}

export function ExplorationGrid({ exploration, onRoll }: { exploration: ExplorationVM[]; onRoll?: (key: string) => void }) {
  return (
    <div className="fvtt-explore">
      {exploration.map((e) => (
        <div
          key={e.key}
          className={cx("fvtt-skill", onRoll && "rollable")}
          title={onRoll ? `Roll ${e.label} (${e.inSix}-in-6)` : undefined}
          {...rollable(onRoll && (() => onRoll(e.key)))}
        >
          <i className={cx("skic", e.icon)} aria-hidden="true" />
          <span className="skn">{e.label}</span>
          <span className="skv">
            {e.inSix}-in-6
            <i className="fa-solid fa-dice-d6" aria-hidden="true" />
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
export function SavesExploration({ saves, exploration, tabbed = false, onRollSave, onRollExploration }: Props) {
  const [tab, setTab] = useState<"saves" | "exploration">("saves");

  if (!tabbed) {
    return (
      <section className="rs-section">
        <SectionTitle hint="roll-above d20">Saving Throws</SectionTitle>
        <SavesGrid saves={saves} onRoll={onRollSave} />
        <SectionTitle hint="1-in-6">Exploration</SectionTitle>
        <ExplorationGrid exploration={exploration} onRoll={onRollExploration} />
      </section>
    );
  }

  return (
    <section className="rs-section">
      <div className="rs-se-nav" role="tablist" aria-label="Saves & Exploration">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "saves"}
          className={cx("rs-se-tab", tab === "saves" && "active")}
          onClick={() => setTab("saves")}
        >
          <i className="fas fa-skull-crossbones" aria-hidden="true" />
          Saves
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "exploration"}
          className={cx("rs-se-tab", tab === "exploration" && "active")}
          onClick={() => setTab("exploration")}
        >
          <i className="fas fa-door-open" aria-hidden="true" />
          Exploration
        </button>
      </div>
      {tab === "saves" ? (
        <SavesGrid saves={saves} onRoll={onRollSave} />
      ) : (
        <ExplorationGrid exploration={exploration} onRoll={onRollExploration} />
      )}
    </section>
  );
}
