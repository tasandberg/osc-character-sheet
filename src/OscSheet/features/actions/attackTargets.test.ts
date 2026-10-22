import { describe, it, expect, afterEach } from "vitest";
import { selectAttackTargets } from "./attackTargets";

const HOSTILE = -1;
const NEUTRAL = 0;
const FRIENDLY = 1;

const token = (id: string, disposition: number, visible = true) => ({
  id,
  name: id,
  visible,
  actor: { id: `actor-${id}`, uuid: `Actor.actor-${id}`, img: "" },
  document: { disposition, texture: { src: `${id}.webp` } },
  setTarget: () => {},
});

afterEach(() => {
  delete (globalThis as { canvas?: unknown }).canvas;
});

describe("selectAttackTargets", () => {
  it("lists visible tokens other than the attacker, hostile first", () => {
    (globalThis as { canvas?: unknown }).canvas = {
      tokens: {
        placeables: [
          token("ally", FRIENDLY),
          token("goblin", HOSTILE),
          token("me", FRIENDLY),
          token("hidden-orc", HOSTILE, false),
          token("merchant", NEUTRAL),
          token("ogre", HOSTILE),
        ],
      },
    };

    const names = selectAttackTargets({ id: "actor-me" }).map((t) => t.name);

    expect(names).toEqual(["goblin", "ogre", "ally", "merchant"]);
  });
});
