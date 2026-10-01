import "./styles/monster.scss";
import type { ContextConnector } from "foundry-vtt-react";
import { ThemedRoot } from "@src/OscSheet";
import { SheetErrorBoundary } from "@app/ErrorBoundary";
import type { OSEActor, OscContext } from "@domain/types";
import { LimitedMonsterSheet, MonsterSheet } from "./MonsterSheet";
import { MonsterSheetProvider } from "./MonsterSheetProvider";
import { useMonsterSheet } from "./useMonsterSheet";
import type { MonsterActor } from "./types";

type Props = {
  actor?: MonsterActor;
  contextConnector: ContextConnector<OscContext>;
  isEditable?: boolean;
  canViewFullSheet?: boolean;
};

function MonsterBody() {
  const { canViewFullSheet } = useMonsterSheet();
  return canViewFullSheet ? <MonsterSheet /> : <LimitedMonsterSheet />;
}

export default function OscMonsterSheetApp({
  actor,
  contextConnector,
  isEditable,
  canViewFullSheet,
}: Props) {
  return (
    <SheetErrorBoundary actor={actor as unknown as OSEActor}>
      <MonsterSheetProvider
        actor={actor!}
        contextConnector={contextConnector}
        canEdit={isEditable ?? actor?.isOwner ?? false}
        canViewFullSheet={canViewFullSheet ?? false}
      >
        <ThemedRoot className="osc-monster">
          <MonsterBody />
        </ThemedRoot>
      </MonsterSheetProvider>
    </SheetErrorBoundary>
  );
}
