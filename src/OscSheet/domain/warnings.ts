import type { OSEActor, OseItem } from "@domain/types";

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
};

export type MigrationWarningVM = { text: string; open: () => void };

const MIGRATION_TEXT =
  "Migration Adjustments bakes this character's old stored saves, THAC0, spell slots and Hit Dice into permanent changes. Review it.";
const MIGRATION_DOUBLED_TEXT =
  "Migration Adjustments is active but this character has no class item, so its stored values already include these differences and they now apply twice. Review or delete it.";

export function selectMigrationWarning(
  actor: OSEActor,
): MigrationWarningVM | null {
  const effects = (actor.effects ?? []) as unknown as Iterable<MigrationEffect>;
  const effect = [...effects].find(
    (e) => e.flags?.[game.system.id]?.migration === true,
  );
  if (!effect) return null;
  return {
    text: actor.system.classes?.length ? MIGRATION_TEXT : MIGRATION_DOUBLED_TEXT,
    open: () => void effect.sheet?.render(true),
  };
}
