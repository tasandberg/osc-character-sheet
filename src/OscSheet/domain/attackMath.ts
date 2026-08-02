import type { AttackKind } from "@domain/types";

/** World settings the maths depends on — read by the caller, never by this module. */
export interface AttackSettings {
  /** `ascendingAC`: the actor's base attack bonus joins the to-hit roll. */
  ascendingAC: boolean;
  /** `ignoreAttackBonusOnDamageRoll`: the weapon bonus is dropped from damage. */
  ignoreAttackBonusOnDamageRoll: boolean;
}

/** Everything one attack mode of one weapon contributes, already resolved to numbers. */
export interface AttackInput {
  kind: AttackKind;
  /** Weapon `system.damage`; empty falls back to OSE's `1d6`. */
  die: string;
  /** Weapon `system.bonus` — magic/quality plus, applies to hit and (usually) damage. */
  weaponBonus: number;
  strMod: number;
  dexMod: number;
  /** Actor `system.thac0`: `bba` the ascending-AC base attack bonus, `mod` the Tweaks bonuses. */
  thac0?: { bba?: number; mod?: { melee?: number; missile?: number } };
  /** Per-actor Tweaks flag `system.config.ignoreBonusDamage`. */
  ignoreBonusDamage: boolean;
}

/** One contributing part of a roll. */
export interface AttackTerm {
  /** `"die"`, or the name of the modifier: `str` / `dex` / `weapon` / `tweaks` / `ab`. */
  label: string;
  /** The dice expression for the die term, a signed integer for every other. */
  value: string | number;
}

/** A composed roll: the formula rolled, the strings shown, and the arithmetic behind them. */
export interface AttackPart {
  /** Foundry roll formula, e.g. `1d20+1+1`. */
  formula: string;
  /** Pill label, e.g. `1d20 +1(dex) +1(weapon)`. */
  label: string;
  /** Button text: the signed total for hit, die + signed total for damage. */
  display: string;
  /** Arithmetic line for the popover, e.g. `1d20 + 1 (dex) + 1 (weapon)`. */
  tip: string;
  /** Every part, die first; zero modifiers are omitted. */
  terms: AttackTerm[];
  /** Sum of the numeric terms. */
  total: number;
}

export interface AttackMath {
  hit: AttackPart;
  dmg: AttackPart;
}

type Mod = { label: string; value: number };

const signed = (n: number) => (n >= 0 ? `+${n}` : `${n}`);

function compose(die: string, mods: Mod[]): Omit<AttackPart, "display"> {
  const kept = mods.filter((m) => m.value !== 0);
  return {
    formula: `${die}${kept.map((m) => signed(m.value)).join("")}`,
    label: `${die}${kept.map((m) => ` ${signed(m.value)}(${m.label})`).join("")}`,
    tip: `${die}${kept
      .map((m) => ` ${m.value > 0 ? "+" : "−"} ${Math.abs(m.value)} (${m.label})`)
      .join("")}`,
    terms: [{ label: "die", value: die }, ...kept],
    total: kept.reduce((sum, m) => sum + m.value, 0),
  };
}

/** Hit and damage for one attack mode, mirroring OseActor#rollAttack so the sheet's
 *  quick buttons and OSE's composite attack can never disagree. Pure: settings in, no globals. */
export function computeAttack(input: AttackInput, settings: AttackSettings): AttackMath {
  const ranged = input.kind === "missile";
  const bba = settings.ascendingAC ? (input.thac0?.bba ?? 0) : 0;
  const tweak = (ranged ? input.thac0?.mod?.missile : input.thac0?.mod?.melee) ?? 0;
  const ability: Mod = ranged
    ? { label: "dex", value: input.dexMod }
    : { label: "str", value: input.strMod };
  const bonus = input.weaponBonus || 0;
  const die = input.die || "1d6";

  const hit = compose("1d20", [
    { label: "ab", value: bba },
    ability,
    { label: "tweaks", value: tweak },
    { label: "weapon", value: bonus },
  ]);

  const dmgBonus =
    settings.ignoreAttackBonusOnDamageRoll || input.ignoreBonusDamage ? 0 : bonus;
  const dmg = compose(
    die,
    ranged
      ? [{ label: "weapon", value: dmgBonus }]
      : [
          { label: "weapon", value: dmgBonus },
          { label: "str", value: input.strMod },
          { label: "tweaks", value: tweak },
        ],
  );

  return {
    hit: { ...hit, display: signed(hit.total) },
    dmg: { ...dmg, display: `${die}${signed(dmg.total)}` },
  };
}
