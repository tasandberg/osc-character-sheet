import type { MouseEvent } from "react";
import { cx } from "@ui/cx";
import { openImagePicker } from "@ui/imagePicker";
import { InlineEditValue } from "@ui/InlineEditValue";
import type { Commit } from "./commit";
import { MonsterSettingsButton } from "./parts/MonsterSettingsButton";
import type { MonsterView } from "./viewModel";

const LONG_NAME = 22;

type Props = {
  name: string;
  img: string;
  view?: MonsterView;
  commit?: Commit;
  onRollHp?: (event: MouseEvent) => void;
  onPickImage?: (path: string) => void;
};

export function MonsterPortrait({
  img,
  onPickImage,
}: {
  img: string;
  onPickImage?: (path: string) => void;
}) {
  const image = img ? (
    <img src={img} alt="" />
  ) : (
    <i className="fa-solid fa-dragon" aria-hidden="true" />
  );
  if (!onPickImage)
    return <span className="osc-monster-portrait u-flex-none">{image}</span>;
  return (
    <button
      type="button"
      className="osc-monster-portrait u-flex-none"
      aria-label="Change portrait"
      title="Change portrait"
      onClick={() => openImagePicker({ current: img, onPick: onPickImage })}
    >
      {image}
    </button>
  );
}

export function MonsterHeader({
  name,
  img,
  view,
  commit,
  onRollHp,
  onPickImage,
}: Props) {
  return (
    <header className="u-flex u-items-center u-gap-4">
      <MonsterPortrait img={img} onPickImage={onPickImage} />
      <div className="u-flex-1">
        <div
          className={cx(
            "osc-monster-name",
            name.length > LONG_NAME ? "u-fs-2xl" : "u-fs-4xl",
          )}
        >
          <InlineEditValue
            label="Name"
            value={name}
            onCommit={commit?.text("name")}
          />
        </div>
        {view && (
          <div className="u-row u-items-baseline u-mt-2 u-text-dim u-wrap">
            <InlineEditValue
              label="Alignment"
              className="osc-monster-value"
              value={view.alignment}
              placeholder="Alignment"
              onCommit={commit?.text("system.details.alignment")}
            />
            <span aria-hidden="true">·</span>
            <span className="u-row u-gap-1 u-items-baseline">
              <InlineEditValue
                label="XP"
                className="osc-monster-value"
                value={view.xp}
                placeholder="0"
                onCommit={commit?.loose("system.details.xp")}
              />
              <span className="osc-monster-label">XP</span>
            </span>
          </div>
        )}
      </div>
      {view && (
        <div className="osc-monster-hit-points u-flex-none">
          <span className="osc-monster-label u-flex u-items-center u-justify-end">
            Hit Points
            {onRollHp && view.hp.rollable && (
              <button
                type="button"
                className="osc-monster-roll-die"
                aria-label="Roll hit points"
                title="Roll hit points from Hit Dice"
                onClick={onRollHp}
              >
                <i
                  className="fa-solid fa-dice-d20 roll-label-die"
                  aria-hidden="true"
                />
              </button>
            )}
          </span>
          <div className="u-mt-1">
            <span>
              <InlineEditValue
                label="Current hit points"
                className="osc-monster-hit-points-current u-fs-5xl"
                value={view.hp.value}
                placeholder="0"
                onCommit={commit?.number("system.hp.value")}
              />
              <span className="osc-monster-value u-text-dim">
                {" / "}
                <InlineEditValue
                  label="Maximum hit points"
                  value={view.hp.max}
                  placeholder="0"
                  onCommit={commit?.number("system.hp.max")}
                />
              </span>
            </span>
          </div>
        </div>
      )}
      {!view && <MonsterSettingsButton />}
    </header>
  );
}
