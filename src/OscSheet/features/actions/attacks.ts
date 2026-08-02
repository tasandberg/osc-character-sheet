import { computeAttack, type AttackSettings } from "@domain/attackMath";
import type { OSEActor } from "@domain/types";
import type { AttackVM, AttackMode, RollSpec } from "@domain/vm-types";

/** OSE's world settings for attack maths. Safe in non-Foundry tests (both default off). */
export function readAttackSettings(): AttackSettings {
  const read = (key: string) => {
    try {
      const settings = game.settings as { get(ns: string, key: string): unknown };
      return !!settings.get(game.system.id, key);
    } catch {
      return false;
    }
  };
  return {
    ascendingAC: read("ascendingAC"),
    ignoreAttackBonusOnDamageRoll: read("ignoreAttackBonusOnDamageRoll"),
  };
}

/** Equipped weapons → one row each. A melee+missile weapon carries both modes
 *  (melee first) so the row can toggle between them. */
export function selectAttacks(
  actor: OSEActor,
  settings: AttackSettings = readAttackSettings(),
): AttackVM[] {
  const { weapons, scores, thac0, config } = actor.system;
  const out: AttackVM[] = [];
  for (const w of weapons) {
    if (!w.system.equipped) continue;
    // Dedupe by label, drop Melee/Missile (shown as the kind tag), keep the OSE icon.
    const seen = new Set<string>();
    const qualities: { label: string; icon: string }[] = [];
    for (const q of w.system.qualities ?? []) {
      if (q.label === "Melee" || q.label === "Missile" || seen.has(q.label)) continue;
      seen.add(q.label);
      qualities.push({ label: q.label, icon: q.icon ?? "" });
    }
    const make = (kind: "melee" | "missile"): AttackMode => {
      const math = computeAttack(
        {
          kind,
          die: w.system.damage,
          weaponBonus: w.system.bonus ?? 0,
          strMod: scores.str.mod,
          dexMod: scores.dex.mod,
          thac0,
          ignoreBonusDamage: !!config?.ignoreBonusDamage,
        },
        settings,
      );
      const tail = kind === "missile" ? " (ranged)" : "";
      const hit: RollSpec = {
        label: math.hit.label,
        formula: math.hit.formula,
        flavor: `${actor.name} attacks with ${w.name}${tail}`,
        kind: "hit",
        weapon: w.name as string,
      };
      const dmg: RollSpec = {
        label: math.dmg.label,
        formula: math.dmg.formula,
        flavor: `${actor.name} deals damage with ${w.name}${tail}`,
        kind: "damage",
        weapon: w.name as string,
      };
      return {
        kind,
        kindLabel: kind === "melee" ? "Melee" : "Missile",
        hit,
        // Hit shows just the always-signed modifier (the d20 is implied by the icon).
        hitDisplay: math.hit.display,
        hitTip: math.hit.tip,
        dmg,
        dmgDisplay: math.dmg.display,
        dmgTip: math.dmg.tip,
      };
    };
    const modes: AttackMode[] = [];
    if (w.system.melee) modes.push(make("melee"));
    if (w.system.missile) modes.push(make("missile"));
    if (modes.length === 0) continue;
    out.push({
      id: w._id as string,
      itemId: w._id as string,
      name: w.name as string,
      img: w.img,
      modes,
      qualities,
    });
  }
  return out;
}
