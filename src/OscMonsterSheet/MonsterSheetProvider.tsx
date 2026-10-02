import type { ReactNode } from "react";
import type { ContextConnector } from "foundry-vtt-react";
import OscSheetProvider from "@app/OscSheetProvider";
import type { OSEActor, OscContext } from "@domain/types";
import type { MonsterActor } from "./types";

export function MonsterSheetProvider({
  actor,
  contextConnector,
  canEdit,
  canViewFullSheet,
  children,
}: {
  actor: MonsterActor;
  contextConnector: ContextConnector<OscContext>;
  canEdit: boolean;
  canViewFullSheet: boolean;
  children: ReactNode;
}) {
  const document = actor as unknown as OSEActor;
  return (
    <OscSheetProvider
      initialActor={document}
      source={document}
      contextConnector={contextConnector}
      canEdit={canEdit}
      canViewFullSheet={canViewFullSheet}
    >
      {children}
    </OscSheetProvider>
  );
}
