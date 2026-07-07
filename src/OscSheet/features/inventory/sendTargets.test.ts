import { describe, it, expect, afterEach } from "vitest";
import { selectSendTargets } from "./sendTargets";

interface MockActor {
  id: string;
  uuid: string;
  name: string;
  img: string;
  type: string;
  isOwner: boolean;
  hasPlayerOwner: boolean;
}

const actor = (id: string, over: Partial<MockActor> = {}): MockActor => ({
  id,
  uuid: `Actor.${id}`,
  name: id,
  img: "",
  type: "character",
  isOwner: false,
  hasPlayerOwner: true,
  ...over,
});

function setGame(actors: MockActor[], activeGM: unknown) {
  (globalThis as unknown as { game: unknown }).game = {
    actors,
    users: { activeGM },
  };
}

afterEach(() => {
  delete (globalThis as unknown as { game?: unknown }).game;
});

const me = actor("me", { isOwner: true });

describe("selectSendTargets", () => {
  it("excludes self and unowned actors, keeps the rest", () => {
    const owned = actor("ally", { isOwner: true });
    const cross = actor("bob", { isOwner: false });
    const unowned = actor("monster", { type: "npc", hasPlayerOwner: false });
    setGame([me, owned, cross, unowned], {});
    const { targets } = selectSendTargets(me);
    expect(targets.map((t) => t.id)).toEqual(["ally", "bob"]);
  });

  it("excludes non-character/npc types", () => {
    const vehicle = actor("cart", { type: "vehicle", isOwner: true });
    const npc = actor("hench", { type: "npc", isOwner: true });
    setGame([me, vehicle, npc], {});
    expect(selectSendTargets(me).targets.map((t) => t.id)).toEqual(["hench"]);
  });

  it("classifies owned-by-me vs cross-owner and carries display fields", () => {
    const owned = actor("ally", { isOwner: true, name: "Ally", img: "a.png" });
    const cross = actor("bob", { isOwner: false, name: "Bob" });
    setGame([me, owned, cross], {});
    const { targets } = selectSendTargets(me);
    const a = targets.find((t) => t.id === "ally")!;
    const b = targets.find((t) => t.id === "bob")!;
    expect(a).toMatchObject({ ownedByMe: true, crossOwner: false, name: "Ally", img: "a.png", uuid: "Actor.ally" });
    expect(b).toMatchObject({ ownedByMe: false, crossOwner: true, name: "Bob" });
  });

  it("reports gmOnline from game.users.activeGM", () => {
    setGame([me, actor("ally", { isOwner: true })], {});
    expect(selectSendTargets(me).gmOnline).toBe(true);
    setGame([me, actor("ally", { isOwner: true })], null);
    expect(selectSendTargets(me).gmOnline).toBe(false);
  });
});
