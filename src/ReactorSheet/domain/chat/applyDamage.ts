// GM "apply damage" wiring for reactor-sheet damage cards.
//
// Registered on `renderChatMessageHTML` (Foundry v13/v14 — passes a native
// HTMLElement, not jQuery; this is the hook OSE itself uses). For each rendered
// message that carries our damage flag we:
//   - hide the Apply button from non-GMs,
//   - if already applied, show a spent state and disable it,
//   - otherwise wire the click to reduce the target actor's HP once.
//
// Apply-once is enforced by the `flags.osc-character-sheet.damageApplied` message flag:
// the click sets it true (a GM-only update), which both blocks re-application and,
// once it propagates, re-renders every client's card into the spent state.

import type { OSEActor } from "@domain/types";
import { MODULE_ID } from "@domain/flags";
import logger from "@src/util/logger";

interface DamageFlag {
  amount: number;
  targetUuid: string;
  targetName: string;
}

/** Message flag accessors — fvtt-types narrows getFlag/setFlag scope to known module
 *  ids, so we read/write our reactor-sheet flags through a loose surface. */
interface FlagMsg {
  getFlag(scope: string, key: string): unknown;
  setFlag(scope: string, key: string, value: unknown): Promise<unknown>;
}
const flags = (m: ChatMessage): FlagMsg => m as unknown as FlagMsg;

/** Apply `amount` to the actor's HP, clamped ≥ 0. */
async function applyToActor(actor: OSEActor, amount: number): Promise<void> {
  const hp = actor.system.hp;
  const next = Math.max(0, (hp?.value ?? 0) - amount);
  await actor.update({ "system.hp.value": next });
}

/** Render-time handler for our chat cards. Marks OUR messages so chat.scss can take
 *  over the whole message box, then (for damage cards) wires the GM apply button. */
export function onRenderChatMessage(message: ChatMessage, html: HTMLElement): void {
  // Only touch our own cards — gate on the reactor-sheet flag / the card marker.
  const isOurs =
    Boolean(flags(message).getFlag(MODULE_ID, "damage")) ||
    Boolean(html.querySelector(".reactor-card"));
  if (!isOurs) return;
  // Take over the message chrome (padding/border/flavor handled in chat.scss).
  html.classList.add("reactor-message");

  const btn = html.querySelector<HTMLButtonElement>('[data-action="reactor-apply-damage"]');
  if (!btn) return;

  const dmg = flags(message).getFlag(MODULE_ID, "damage") as DamageFlag | undefined;
  const applied = Boolean(flags(message).getFlag(MODULE_ID, "damageApplied"));
  if (!dmg) return;

  // Non-GMs never see the button.
  if (!game.user?.isGM) {
    btn.remove();
    return;
  }

  if (applied) {
    btn.disabled = true;
    btn.classList.add("is-spent");
    btn.innerHTML = `<i class="fa-solid fa-check" aria-hidden="true"></i> Applied`;
    return;
  }

  btn.addEventListener("click", async (ev) => {
    ev.preventDefault();
    // Re-check the flag at click time (guards a double-click before re-render).
    if (flags(message).getFlag(MODULE_ID, "damageApplied")) return;
    btn.disabled = true;

    const target = (await fromUuid(dmg.targetUuid)) as { actor?: OSEActor } | OSEActor | null;
    const actor = (target as { actor?: OSEActor })?.actor ?? (target as OSEActor | null);
    if (!actor) {
      btn.disabled = false;
      ui.notifications?.warn(`Couldn't resolve target "${dmg.targetName}".`);
      return;
    }

    try {
      await applyToActor(actor, dmg.amount);
      // Mark applied — propagates and re-renders the card into the spent state.
      await flags(message).setFlag(MODULE_ID, "damageApplied", true);
    } catch (err) {
      btn.disabled = false;
      logger(`apply-damage failed: ${String(err)}`);
      ui.notifications?.error("Failed to apply damage.");
    }
  });
}
