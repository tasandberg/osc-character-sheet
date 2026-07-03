import type { OSEActor } from "@domain/types";
import type { AttackVM, AttackMode, RollSpec } from "@domain/vm-types";

/** Term to append to a formula for a mod, e.g. +1 / -2 / "" for 0. */
const term = (mod: number) => (mod === 0 ? "" : mod > 0 ? `+${mod}` : `${mod}`);
/** Suffix shown on the pill, e.g. " +1(str)" / "" for 0. */
const suffix = (mod: number, abil: string) => (mod === 0 ? "" : ` ${mod > 0 ? `+${mod}` : `${mod}`}(${abil})`);
/** Always-signed term for the button display, e.g. "+0" / "+2" / "-1". */
const signed = (mod: number) => (mod >= 0 ? `+${mod}` : `${mod}`);
/** Full-formula popover line, e.g. "1d20 + 1 (dex)" / "1d6" for 0. */
const tip = (base: string, mod: number, abil: string) =>
  mod === 0 ? base : `${base} ${mod > 0 ? "+" : "−"} ${Math.abs(mod)} (${abil})`;

/** Equipped weapons → one row each. A melee+missile weapon carries both modes
 *  (melee first) so the row can toggle between them. */
export function selectAttacks(actor: OSEActor): AttackVM[] {
  const { weapons, scores } = actor.system;
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
    const die = w.system.damage;
    const make = (kind: "melee" | "missile"): AttackMode => {
      const ranged = kind === "missile";
      // to-hit: str for melee, dex for missile. damage: str for melee, none for missile.
      const hitMod = ranged ? scores.dex.mod : scores.str.mod;
      const hitAbil = ranged ? "dex" : "str";
      const dmgMod = ranged ? 0 : scores.str.mod;
      const tail = ranged ? " (ranged)" : "";
      const hit: RollSpec = {
        label: `1d20${suffix(hitMod, hitAbil)}`,
        formula: `1d20${term(hitMod)}`,
        flavor: `${actor.name} attacks with ${w.name}${tail}`,
        kind: "hit",
        weapon: w.name as string,
      };
      const dmg: RollSpec = {
        label: `${die}${suffix(dmgMod, "str")}`,
        formula: `${die}${term(dmgMod)}`,
        flavor: `${actor.name} deals damage with ${w.name}${tail}`,
        kind: "damage",
        weapon: w.name as string,
      };
      return {
        kind,
        kindLabel: kind === "melee" ? "Melee" : "Missile",
        hit,
        // Hit shows just the always-signed modifier (the d20 is implied by the icon).
        hitDisplay: signed(hitMod),
        hitTip: tip("1d20", hitMod, hitAbil),
        dmg,
        dmgDisplay: `${die}${signed(dmgMod)}`,
        dmgTip: tip(die, dmgMod, "str"),
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
