// Vellum-themed attack & damage chat cards for the sheet's own Hit/Damage cells.
//
// The chat log lives OUTSIDE the `.osc-sheet` scope, so the card markup carries
// its own `.osc-card` root class and the styles in `styles/chat.scss` are scoped
// under it.
//
// HIT card: if the user has a target, we compare the roll against the target's AC
// (ascending: d20+bonus ≥ AAC; descending: THAC0−total ≤ AC) and show HIT/MISS. Nat 1
// always misses, nat 20 always hits (matching OSE). No target → no hit/miss line.
//
// DAMAGE card: shows the rolled total and (for the target, if any) stamps the target
// name + a GM-only "Apply" button wired by the renderChatMessageHTML hook (see
// applyDamage.ts). Applied-once is guarded by a message flag.

import type { OSEActor } from "@domain/types";
import type { RollSpec } from "@domain/vm-types";
import { MODULE_ID } from "@domain/flags";
import { currentTarget, usesAscendingAC, type TargetInfo } from "@domain/chat/targeting";

/** escape user/actor strings before interpolating into card HTML. */
function esc(s: string): string {
  return foundry.utils.escapeHTML(String(s ?? ""));
}

/** Natural die face of the first d20 term, or null if the roll has no d20. */
function natD20(roll: Roll): number | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const t of roll.terms as any[]) {
    if (t?.faces === 20 && t?.results?.length) return t.results[0].result as number;
  }
  return null;
}

/** Pure hit/miss rule (B/X). `nat` = natural d20 face (1 always misses, 20 always
 *  hits); `total` is the full rolled formula, attack bonus included. Ascending:
 *  total ≥ target AAC. Descending: attacker THAC0 − total ≤ target AC. */
export function evaluateHit(opts: {
  nat: number | null;
  total: number;
  ascending: boolean;
  thac0: number;
  target: Pick<TargetInfo, "aac" | "ac">;
}): boolean {
  if (opts.nat === 1) return false;
  if (opts.nat === 20) return true;
  return opts.ascending
    ? opts.total >= opts.target.aac
    : opts.thac0 - opts.total <= opts.target.ac;
}

/** Resolve hit vs miss for an evaluated d20 roll against a target. */
function resolveHit(roll: Roll, attacker: OSEActor, target: TargetInfo): boolean {
  const sys = attacker.system as { thac0?: { value: number } };
  return evaluateHit({
    nat: natD20(roll),
    total: roll.total ?? 0,
    ascending: usesAscendingAC(),
    thac0: sys.thac0?.value ?? 19,
    target,
  });
}

function image(className: string, src: string | null | undefined): string {
  return src ? `<img class="${className}" src="${esc(src)}" alt="">` : "";
}

/** Card shell: ink title band (weapon image · title · portrait) + body, all under `.osc-card`. */
function shell(title: string, weaponImg: string | undefined, portrait: string | null, body: string): string {
  return (
    `<div class="osc-card"><div class="rc-head">${image("rc-weapon-image", weaponImg)}` +
    `<span class="rc-title">${esc(title)}</span>${image("rc-portrait", portrait)}</div>` +
    `<div class="rc-body">${body}</div></div>`
  );
}

const DIE_SIDES = new Set(["4", "6", "8", "10", "12", "20"]);

function dieIcon(formula: string): string {
  const sides = /d(\d+)/.exec(formula)?.[1];
  return sides && DIE_SIDES.has(sides) ? `fa-dice-d${sides}` : "fa-dice";
}

/** ONE clean roll readout: formula label + big total, which toggles the per-die
 *  breakdown (Foundry's tooltip markup, no duplication). */
function rollResult(roll: Roll, tooltip: string): string {
  return (
    `<details class="rc-dice"><summary class="rc-roll">` +
    `<i class="fa-solid ${dieIcon(roll.formula)} rc-die" aria-hidden="true"></i>` +
    `<span class="rc-formula">${esc(roll.formula)}</span>` +
    `<span class="rc-total">${roll.total ?? 0}</span>` +
    `</summary>${tooltip}</details>`
  );
}

/** Post a Vellum chat card for a sheet Hit/Damage roll. The only behavioural fork is
 *  the optional target line (hit verdict / apply-damage button). No `flavor` is set —
 *  the card title band carries it, so Foundry's flavor line stays empty. */
export async function postRollCard(actor: OSEActor, spec: RollSpec): Promise<void> {
  const speaker = ChatMessage.getSpeaker({ actor });
  const roll = await new Roll(spec.formula).evaluate();
  const total = roll.total ?? 0;
  const target = currentTarget();

  const tooltip = await roll.getTooltip();
  let lead = "";
  let action = "";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const flags: Record<string, any> = {};

  if (target) {
    const hit = spec.kind === "hit" ? resolveHit(roll, actor, target) : null;
    const verdict =
      hit === null
        ? ""
        : `<span class="rc-verdict ${hit ? "is-hit" : "is-miss"}">${hit ? "Hit" : "Miss"}</span>`;
    lead = `<div class="rc-target"><span class="rc-vs">vs ${esc(target.name)}</span>${verdict}</div>`;
  }
  if (spec.kind === "damage" && target) {
    // GM-only apply button; hydrated/guarded by the renderChatMessageHTML hook.
    action =
      `<button type="button" class="rc-apply" data-action="osc-apply-damage">` +
      `Apply ${total} damage <i class="fa-solid fa-droplet" aria-hidden="true"></i></button>`;
    flags.damage = { amount: total, targetUuid: target.uuid, targetName: target.name };
    flags.damageApplied = false;
  }

  const body =
    lead + rollResult(roll, tooltip) + (action ? `<div class="rc-foot">${action}</div>` : "");

  const title = spec.weapon
    ? spec.kind === "damage"
      ? `${spec.weapon} damage`
      : `Attacks with ${spec.weapon}`
    : spec.kind === "damage"
      ? "Damage"
      : "Attack";
  await ChatMessage.create({
    speaker,
    rolls: [roll],
    content: shell(title, spec.img, actor.img, body),
    flags: { [MODULE_ID]: flags },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);
}
