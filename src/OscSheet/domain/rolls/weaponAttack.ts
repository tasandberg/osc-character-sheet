import type { AttackKind, AttackType, OSEActor, OseWeapon } from "@domain/types";

export type WeaponAttack = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rollData: { item: any; actor: OSEActor; roll: { save?: string; target: null } };
  type: AttackType;
};

/** Mirrors OseItem#rollWeapon's rollData, minus its melee/missile dialog — the
 *  sheet's mode switch has already chosen the range. Non-characters roll "attack". */
export function buildWeaponAttack(
  actor: OSEActor,
  weapon: OseWeapon,
  kind: AttackKind,
): WeaponAttack {
  return {
    rollData: {
      item: weapon._source,
      actor,
      roll: { save: weapon.system.save, target: null },
    },
    type: (actor as { type?: string }).type === "character" ? kind : "attack",
  };
}
