import { useOscSheetContext } from "@app/context";
import type { MonsterActor } from "./types";

export function useMonsterSheet() {
  const { actor, updateActor, canEdit, canViewFullSheet } =
    useOscSheetContext();
  return {
    actor: actor as unknown as MonsterActor,
    updateActor,
    canEdit,
    canViewFullSheet,
  };
}
