import { useState } from "react";
import { useOscSheetContext } from "@app/context";
import type { OSEActor, OseItem } from "@domain/types";
import { InventoryView } from "@features/inventory";
import {
  selectEncumbrance,
  selectInventory,
  selectWealth,
} from "@features/inventory/inventory";
import { useInventoryActions } from "@features/inventory/useInventoryActions";
import EditableContent from "@features/notes/EditableContent";
import Spells from "@features/spells/SpellsView";
import { Tabs } from "@ui/Tabs";
import { AbilitiesSection } from "./AbilitiesSection";
import { AttacksSection } from "./AttacksSection";
import { rollHitPoints } from "./actions";
import { makeCommit } from "./commit";
import { MonsterHeader } from "./MonsterHeader";
import { StatFrame } from "./StatFrame";
import { openSaveGenerator } from "./systemSheet";
import { readMonsterSettings } from "./systemSettings";
import { useMonsterSheet } from "./useMonsterSheet";
import { selectMonster } from "./viewModel";

type TabId = "stats" | "inventory" | "spells" | "notes";

const TAB_LABELS: Record<TabId, string> = {
  stats: "Stats",
  inventory: "Inventory",
  spells: "Spells",
  notes: "Notes",
};

function MonsterInventory() {
  const { actor, items } = useOscSheetContext();
  const actions = useInventoryActions();
  const owned = items as OseItem[];
  return (
    <InventoryView
      inventory={selectInventory(owned)}
      encumbrance={selectEncumbrance(actor as OSEActor, owned)}
      wealth={selectWealth(owned)}
      {...actions}
    />
  );
}

export function MonsterSheet() {
  const { actor, updateActor, canEdit } = useMonsterSheet();
  const [selectedTab, setTab] = useState<TabId>("stats");
  const tabIds: TabId[] = [
    "stats",
    ...(actor.system.config?.enableInventory ? ["inventory" as const] : []),
    ...(actor.system.spells?.enabled ? ["spells" as const] : []),
    "notes",
  ];
  const tab = tabIds.includes(selectedTab) ? selectedTab : "stats";
  const view = selectMonster(actor, readMonsterSettings());
  const commit = canEdit ? makeCommit(updateActor) : undefined;

  return (
    <div className="osc-monster-layout">
      <div className="osc-monster-fixed u-stack u-gap-4 u-px-5 u-pt-4">
        <MonsterHeader
          name={view.name}
          img={view.img}
          view={view}
          commit={commit}
          onRollHp={
            canEdit ? (event) => void rollHitPoints(actor, event) : undefined
          }
          onPickImage={
            canEdit ? (path) => void updateActor({ img: path }) : undefined
          }
        />
        {tab === "stats" && (
          <StatFrame
            actor={actor}
            view={view}
            commit={commit}
            onGenerateSaves={
              canEdit ? () => openSaveGenerator(actor) : undefined
            }
          />
        )}
      </div>
      <div
        className="osc-monster-scroll u-stack u-gap-4 u-px-5 u-py-4"
        role="tabpanel"
        aria-label={TAB_LABELS[tab]}
      >
        {tab === "inventory" ? (
          <MonsterInventory />
        ) : tab === "spells" ? (
          <Spells />
        ) : tab === "stats" ? (
          <>
            <AttacksSection
              actor={actor}
              groups={view.attackGroups}
              canEdit={canEdit}
            />
            <AbilitiesSection
              actor={actor}
              abilities={view.abilities}
              canEdit={canEdit}
            />
          </>
        ) : (
          <EditableContent
            title="Notes"
            name="system.details.biography"
            value={actor.system.details.biography ?? ""}
          />
        )}
      </div>
      <Tabs<TabId>
        variant="folder"
        tabs={tabIds.map((id) => ({ id, label: TAB_LABELS[id] }))}
        active={tab}
        onSelect={setTab}
      />
    </div>
  );
}

export function LimitedMonsterSheet() {
  const { actor } = useMonsterSheet();
  return (
    <div className="osc-monster-layout">
      <div className="osc-monster-scroll u-stack u-gap-4 u-px-5 u-py-4">
        <MonsterHeader name={actor.name} img={actor.img} />
        <EditableContent
          title="Notes"
          name="system.details.biography"
          value={actor.system.details.biography ?? ""}
        />
      </div>
    </div>
  );
}
