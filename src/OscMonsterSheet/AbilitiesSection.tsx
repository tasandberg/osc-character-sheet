import { useLayoutEffect, useRef, useState } from "react";
import { createOwnedItem } from "@domain/createOwnedItem";
import type { OSEActor } from "@domain/types";
import { ContextMenu, type ContextMenuState } from "@ui/ContextMenu";
import { IconButton } from "@ui/IconButton";
import { SectionTitle } from "@ui/SectionTitle";
import { Tag } from "@ui/Tag";
import { cx } from "@ui/cx";
import { rollable } from "@ui/rollable";
import { useSetting } from "@src/OscSheet/settings";
import { rollMonsterItem } from "./actions";
import { itemMenu } from "./parts/itemMenu";
import { RollLabel } from "./parts/RollLabel";
import { useEnrichedHtml } from "./parts/useEnrichedHtml";
import type { MonsterActor, MonsterItem } from "./types";
import type { AbilityEntry } from "./viewModel";

type AbilityProps = {
  actor: MonsterActor;
  ability: AbilityEntry;
  item?: MonsterItem;
  onMenu?: (menu: ContextMenuState) => void;
  canEdit: boolean;
};

function Ability({ actor, ability, item, onMenu, canEdit }: AbilityProps) {
  const html = useEnrichedHtml(ability.description, actor);
  const theme = useSetting("theme");
  const body = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);

  useLayoutEffect(() => {
    const element = body.current;
    if (!element || expanded) return;
    setOverflows(element.scrollHeight > element.clientHeight + 1);
  }, [html, expanded]);

  return (
    <li
      className="osc-monster-ability"
      onContextMenu={
        item &&
        onMenu &&
        ((event) => {
          event.preventDefault();
          onMenu(itemMenu(item, canEdit, event));
        })
      }
    >
      <div
        ref={body}
        className={cx("osc-monster-ability-body", !expanded && "is-clamped")}
      >
        <span aria-hidden="true" className="osc-monster-ability-bullet">
          ▶
        </span>
        <RollLabel
          className="osc-monster-ability-name"
          glyph={false}
          onRoll={item?.sheet ? () => item.sheet?.render(true) : undefined}
          title={canEdit ? "Edit ability" : "View ability"}
        >
          {ability.name}.
        </RollLabel>{" "}
        {ability.rollTag && (
          <Tag
            size="xs"
            className="osc-monster-ability-tag osc-monster-roll-tag"
            title={`Roll ${ability.rollTag}`}
            {...rollable(
              item ? (event) => void rollMonsterItem(item, event) : undefined,
            )}
          >
            roll {ability.rollTag}
          </Tag>
        )}
        {ability.save && (
          <Tag size="xs" className="osc-monster-ability-tag">
            {ability.save}
          </Tag>
        )}
        <span
          className={cx(
            "osc-monster-ability-text themed",
            theme === "cream" ? "theme-light" : "theme-dark",
          )}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
      {(overflows || expanded) && (
        <button
          type="button"
          className="osc-monster-label osc-monster-roll osc-monster-ability-toggle"
          aria-expanded={expanded}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? "Less" : "More"}
        </button>
      )}
    </li>
  );
}

export function AbilitiesSection({
  actor,
  abilities,
  canEdit,
}: {
  actor: MonsterActor;
  abilities: AbilityEntry[];
  canEdit: boolean;
}) {
  const [menu, setMenu] = useState<ContextMenuState | null>(null);
  if (!abilities.length && !canEdit) return null;

  return (
    <section aria-label="Abilities">
      <SectionTitle variant="hairline">
        <span className="u-flex-1">Abilities</span>
        {canEdit && (
          <IconButton
            size="sm"
            aria-label="Add ability"
            title="Add ability"
            onClick={() =>
              void createOwnedItem(actor as unknown as OSEActor, "ability")
            }
          >
            <i className="fa-solid fa-plus" aria-hidden="true" />
          </IconButton>
        )}
      </SectionTitle>
      {abilities.length === 0 ? (
        <p className="u-m-0 u-fs-sm u-text-dim">No special abilities.</p>
      ) : (
        <ul className="osc-monster-abilities u-m-0 u-p-0">
          {abilities.map((ability) => (
            <Ability
              key={ability.id}
              actor={actor}
              ability={ability}
              item={actor.items.get(ability.id)}
              onMenu={setMenu}
              canEdit={canEdit}
            />
          ))}
        </ul>
      )}
      {menu && <ContextMenu {...menu} onClose={() => setMenu(null)} />}
    </section>
  );
}
