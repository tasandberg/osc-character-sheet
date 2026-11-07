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
