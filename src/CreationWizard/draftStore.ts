import { FLAGS, MODULE_ID, type FlagDocument } from "@domain/flags";
import { isCreationStep, type CreationStep } from "./steps";

export type WizardSnapshot = { step: CreationStep; draft: unknown };

export interface DraftStore {
  load(): WizardSnapshot | undefined;
  save(snapshot: WizardSnapshot): void;
  clear(): void;
}

export function userFlagDraftStore(
  user: FlagDocument,
  key: string,
): DraftStore {
  const flagKey = `${FLAGS.creationDrafts}.${key}`;
  return {
    load() {
      const raw = user.getFlag(MODULE_ID, flagKey);
      if (typeof raw !== "string") return undefined;
      try {
        const parsed = JSON.parse(raw) as Partial<WizardSnapshot>;
        return isCreationStep(parsed.step)
          ? { step: parsed.step, draft: parsed.draft }
          : undefined;
      } catch {
        return undefined;
      }
    },
    save(snapshot) {
      void user.setFlag(MODULE_ID, flagKey, JSON.stringify(snapshot));
    },
    clear() {
      void user.unsetFlag(MODULE_ID, flagKey);
    },
  };
}

export function memoryDraftStore(initial?: WizardSnapshot): DraftStore {
  let snapshot = initial;
  return {
    load: () => snapshot,
    save: (next) => {
      snapshot = next;
    },
    clear: () => {
      snapshot = undefined;
    },
  };
}
