import { useState } from "react";
import EditableContent from "@features/notes/EditableContent";
import { Tabs } from "@ui/Tabs";
import { AbilitiesSection } from "./AbilitiesSection";
import { AttacksSection } from "./AttacksSection";
import { makeCommit } from "./commit";
import { MonsterHeader } from "./MonsterHeader";
import { SpellsSection } from "./SpellsSection";
import { StatFrame } from "./StatFrame";
import { openSaveGenerator } from "./systemSheet";
import { readMonsterSettings } from "./systemSettings";
import { useMonsterSheet } from "./useMonsterSheet";
import { selectMonster } from "./viewModel";

type TabId = "stats" | "notes";

const TABS: { id: TabId; label: string }[] = [
  { id: "stats", label: "Stats" },
  { id: "notes", label: "Notes" },
];

export function MonsterSheet() {
  const { actor, updateActor, canEdit } = useMonsterSheet();
  const [tab, setTab] = useState<TabId>("stats");
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
          onRollHp={canEdit ? () => void actor.rollHP() : undefined}
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
        aria-label={tab === "stats" ? "Stats" : "Notes"}
      >
        {tab === "stats" ? (
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
            <SpellsSection
              actor={actor}
              levels={view.spellLevels}
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
        tabs={TABS}
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
