import { MODULE_ID } from "@domain/flags";
import type { OSEActor, OseClassItem, OseItem } from "@domain/types";

export type WarningVM = { key: string; itemId: string; text: string };

export function selectWarnings(actor: OSEActor): WarningVM[] {
  return (actor.system.warnings ?? []).map(({ key, itemId, message, data }) => ({
    key,
    itemId,
    text: game.i18n.format(
      message,
      Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, String(v)]),
      ),
    ),
  }));
}

export function dismissWarning(
  actor: OSEActor,
  items: OseItem[],
  warning: WarningVM,
) {
  const item = items.find((i) => i.id === warning.itemId);
  return item?.dismissWarning?.(warning.key, actor.system.warningContext ?? "");
}

type MigrationEffect = {
  flags?: Record<string, Record<string, unknown> | undefined>;
  sheet?: { render: (force: boolean) => unknown } | null;
  setFlag?: (scope: string, key: string, value: unknown) => Promise<unknown>;
  deleteDialog?: () => Promise<unknown>;
};

export type MigrationWarningVM = {
  text: string;
  doubled: boolean;
  open: () => void;
  keep: () => void;
  remove: () => void;
};

const MIGRATION_KEPT_FLAG = "migrationKept";
const MIGRATION_DOUBLED_TEXT =
  "is active but this character has no class item, so its stored values already include these differences and they now apply twice. Review or delete it.";

const migrationText = (classes: OseClassItem[]) =>
  `was added to preserve this character's non-standard values. Remove it to use the standard values for a ${classes
    .map((c) => `level ${c.system.level} ${c.name}`)
    .join(" / ")}.`;

export function selectMigrationWarning(
  actor: OSEActor,
): MigrationWarningVM | null {
  const effects = (actor.effects ?? []) as unknown as Iterable<MigrationEffect>;
  const effect = [...effects].find(
    (e) =>
      e.flags?.[game.system.id]?.migration === true &&
      e.flags?.[MODULE_ID]?.[MIGRATION_KEPT_FLAG] !== true,
  );
  if (!effect) return null;
  const classes = actor.system.classes ?? [];
  return {
    text: classes.length ? migrationText(classes) : MIGRATION_DOUBLED_TEXT,
    doubled: !classes.length,
    open: () => void effect.sheet?.render(true),
    keep: () => void effect.setFlag?.(MODULE_ID, MIGRATION_KEPT_FLAG, true),
    remove: () => void effect.deleteDialog?.(),
  };
}
