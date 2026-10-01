import { openImagePicker } from "@ui/imagePicker";
import { InlineEdit } from "./parts/InlineEdit";
import { RollLabel } from "./parts/RollLabel";
import type { Commit } from "./commit";
import type { MonsterView } from "./viewModel";

type Props = {
  name: string;
  img: string;
  view?: MonsterView;
  commit?: Commit;
  onRollHp?: () => void;
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
        <h1 className="osc-monster-name u-m-0 u-fs-3xl">
          <InlineEdit
            label="Name"
            value={name}
            onCommit={commit?.text("name")}
          />
        </h1>
        {view && (
          <div className="u-row u-items-baseline u-mt-2 u-text-dim u-wrap">
            <InlineEdit
              label="Alignment"
              className="osc-monster-value u-fs-xs"
              value={view.alignment}
              placeholder="Alignment"
              onCommit={commit?.text("system.details.alignment")}
            />
            <span aria-hidden="true">·</span>
            <span className="u-row u-gap-1 u-items-baseline">
              <InlineEdit
                label="XP"
                className="osc-monster-value u-fs-xs"
                value={view.xp.value}
                placeholder="0"
                onCommit={commit?.loose("system.details.xp")}
              >
                {view.xp.display || undefined}
              </InlineEdit>
              <span className="osc-monster-label">XP</span>
            </span>
          </div>
        )}
      </div>
      {view && (
        <div className="osc-monster-hit-points u-flex-none">
          <RollLabel
            onRoll={view.hp.rollable ? onRollHp : undefined}
            title="Roll hit points from Hit Dice"
          >
            Hit Points
          </RollLabel>
          <div className="u-mt-1">
            <InlineEdit
              label="Current hit points"
              className="osc-monster-hit-points-current u-fs-3xl"
              value={view.hp.value}
              placeholder="0"
              onCommit={commit?.number("system.hp.value")}
            />
            <span className="osc-monster-value u-fs-xs u-text-dim">
              {" / "}
              <InlineEdit
                label="Maximum hit points"
                value={view.hp.max}
                placeholder="0"
                onCommit={commit?.number("system.hp.max")}
              />
            </span>
          </div>
        </div>
      )}
    </header>
  );
}
