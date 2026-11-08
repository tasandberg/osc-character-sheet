import type { OSEActor, OseClassItem } from "@domain/types";

export const effectsLabel = (key: string, data?: Record<string, string>) => {
  const resolved = game.i18n.has(key) ? key : key.replace(/^OSE\./, "OSC.");
  return data ? game.i18n.format(resolved, data) : game.i18n.localize(resolved);
};

export interface EffectRow {
  uuid: string;
  name: string;
  img: string;
  disabled: boolean;
  temporary: boolean;
  source: string | null;
  duration: string;
  fixed?: boolean;
}

export type EffectGroupKey = "temporary" | "passive" | "inactive";

export interface EffectGroup {
  key: EffectGroupKey;
  label: string;
  effects: EffectRow[];
}

export const groupEffects = (rows: EffectRow[]) => {
  const byName = (a: EffectRow, b: EffectRow) => a.name.localeCompare(b.name);
  const pick = (test: (r: EffectRow) => boolean) =>
    rows.filter(test).sort(byName);
  return [
    {
      key: "temporary" as const,
      effects: pick((r) => !r.disabled && r.temporary),
    },
    {
      key: "passive" as const,
      effects: pick((r) => !r.disabled && !r.temporary),
    },
    { key: "inactive" as const, effects: pick((r) => r.disabled) },
  ];
};

interface Duration {
  value?: number | null;
  units?: string;
  rounds?: number | null;
  turns?: number | null;
  remaining?: number | null;
  label?: string;
}

const UNIT_KEYS: Record<string, string> = {
  rounds: "COMBAT.Rounds",
  turns: "COMBAT.Turns",
};
const amount = (n: number | null | undefined): n is number =>
  Number.isFinite(n) && Number(n) > 0;

export const durationText = (
  d: Duration,
  localize: (key: string) => string,
) => {
  if (Number.isFinite(d.remaining) && d.label) return d.label;
  const unit = (n: number, units: string) =>
    `${n} ${localize(UNIT_KEYS[units] ?? `EFFECT.DURATION.UNITS.${units}`)}`;
  if (amount(d.value) && d.units && d.units !== "none")
    return unit(d.value, d.units);
  if (amount(d.rounds)) return unit(d.rounds, "rounds");
  if (amount(d.turns)) return unit(d.turns, "turns");
  return d.label && d.label !== localize("COMMON.None") ? d.label : "";
};

type ApplicableEffect = {
  uuid: string;
  name: string;
  img: string;
  disabled: boolean;
  isTemporary: boolean;
  parent: { name?: string } | null;
  duration?: Duration;
};

export function selectEffectGroups(actor: OSEActor): EffectGroup[] {
  const localize = (key: string) => game.i18n.localize(key);
  const rows: EffectRow[] = [
    ...((actor.allApplicableEffects?.() ?? []) as Iterable<ApplicableEffect>),
  ].map((e) => ({
    uuid: e.uuid,
    name: e.name,
    img: e.img,
    disabled: e.disabled,
    temporary: e.isTemporary,
    source: e.parent === actor ? null : (e.parent?.name ?? null),
    duration: durationText(e.duration ?? {}, localize),
  }));
  for (const classItem of (actor.system.classes ?? []) as OseClassItem[]) {
    const bonus = actor.system.classXpBonus?.(classItem) ?? 0;
    if (!bonus) continue;
    rows.push({
      uuid: classItem.uuid,
      name: effectsLabel("OSE.effects.ClassXp", {
        bonus: bonus > 0 ? `+${bonus}` : `${bonus}`,
      }),
      img: classItem.img,
      disabled: false,
      temporary: false,
      source: classItem.name,
      duration: "",
      fixed: true,
    });
  }
  return groupEffects(rows).map((g) => ({
    ...g,
    label: `OSE.effects.${g.key}`,
  }));
}

export const countActiveTemporaryEffects = (actor: OSEActor) =>
  selectEffectGroups(actor).find((group) => group.key === "temporary")?.effects
    .length ?? 0;

type EffectDocument = {
  name: string;
  disabled: boolean;
  parent: unknown;
  sheet?: { render: (force: boolean) => unknown };
  update: (data: Record<string, unknown>) => Promise<unknown>;
  delete: () => Promise<unknown>;
};

const resolve = (uuid: string) =>
  fromUuidSync(uuid) as unknown as EffectDocument | null;

export async function createEffect(actor: OSEActor) {
  const data = {
    name: effectsLabel("OSE.effects.New"),
    img: "icons/svg/aura.svg",
  };
  const [effect] = (await actor.createEmbeddedDocuments("ActiveEffect", [
    data as never,
  ])) as unknown as EffectDocument[];
  effect?.sheet?.render(true);
}

export function editEffect(uuid: string) {
  resolve(uuid)?.sheet?.render(true);
}

export function toggleEffect(uuid: string) {
  const effect = resolve(uuid);
  if (effect) return effect.update({ disabled: !effect.disabled });
}

export async function deleteEffect(actor: OSEActor, uuid: string) {
  const effect = resolve(uuid);
  if (effect?.parent !== actor) return;
  const ok = await foundry.applications.api.DialogV2.confirm({
    window: { title: effectsLabel("OSE.effects.Delete") },
    content: `<p>${effectsLabel("OSE.effects.DeleteConfirm", { name: foundry.utils.escapeHTML(effect.name) })}</p>`,
    rejectClose: false,
  });
  if (ok) return effect.delete();
}
