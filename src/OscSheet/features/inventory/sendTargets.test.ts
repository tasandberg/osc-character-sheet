import { describe, it, expect, afterEach } from "vitest";
import { selectSendTargets } from "./sendTargets";

interface MockActor {
  id: string;
  uuid: string;
  name: string;
  img: string;
  isOwner: boolean;
}
interface MockToken {
  visible: boolean;
  actor: MockActor | null;
  document: { disposition: number };
}

// Dispositions: SECRET -2, HOSTILE -1, NEUTRAL 0, FRIENDLY 1.
const token = (
  id: string,
  over: Partial<MockActor> & { visible?: boolean; disposition?: number } = {},
): MockToken => {
  const { visible = true, disposition = 1, ...actorOver } = over;
  return {
    visible,
    document: { disposition },
    actor: { id, uuid: `Actor.${id}`, name: id, img: "", isOwner: false, ...actorOver },
  };
};

function setScene(tokens: MockToken[], activeGM: unknown) {
  (globalThis as unknown as { canvas: unknown }).canvas = {
    tokens: { placeables: tokens },
  };
  (globalThis as unknown as { game: unknown }).game = {
    users: { activeGM },
  };
}

afterEach(() => {
  delete (globalThis as unknown as { canvas?: unknown }).canvas;
  delete (globalThis as unknown as { game?: unknown }).game;
});

const me = { id: "me", uuid: "Actor.me" };

describe("selectSendTargets", () => {
  it("keeps visible non-hostile tokens, excludes self", () => {
    const mine = token("me", { isOwner: true }); // self
    const owned = token("ally", { isOwner: true });
    const cross = token("bob", { isOwner: false });
    setScene([mine, owned, cross], {});
    const { targets } = selectSendTargets(me);
    expect(targets.map((t) => t.id)).toEqual(["ally", "bob"]);
  });

  it("excludes hostile and secret tokens", () => {
    const friendly = token("ally", { isOwner: true, disposition: 1 });
    const neutral = token("merchant", { isOwner: true, disposition: 0 });
    const hostile = token("orc", { isOwner: true, disposition: -1 });
    const secret = token("spy", { isOwner: true, disposition: -2 });
    setScene([friendly, neutral, hostile, secret], {});
    expect(selectSendTargets(me).targets.map((t) => t.id)).toEqual([
      "ally",
      "merchant",
    ]);
  });

  it("excludes tokens hidden from this user and tokens without an actor", () => {
    const hidden = token("ghost", { isOwner: true, visible: false });
    const empty: MockToken = {
      visible: true,
      actor: null,
      document: { disposition: 1 },
    };
    const shown = token("ally", { isOwner: true });
    setScene([hidden, empty, shown], {});
    expect(selectSendTargets(me).targets.map((t) => t.id)).toEqual(["ally"]);
  });

  it("dedupes multiple tokens sharing one actor", () => {
    const a = token("ally", { isOwner: true });
    const b = token("ally", { isOwner: true }); // second token, same actor uuid
    setScene([a, b], {});
    expect(selectSendTargets(me).targets.map((t) => t.id)).toEqual(["ally"]);
  });

  it("classifies owned-by-me vs cross-owner and carries display fields", () => {
    const owned = token("ally", { isOwner: true, name: "Ally", img: "a.png" });
    const cross = token("bob", { isOwner: false, name: "Bob" });
    setScene([owned, cross], {});
    const { targets } = selectSendTargets(me);
    const a = targets.find((t) => t.id === "ally")!;
    const b = targets.find((t) => t.id === "bob")!;
    expect(a).toMatchObject({
      ownedByMe: true,
      crossOwner: false,
      name: "Ally",
      img: "a.png",
      uuid: "Actor.ally",
    });
    expect(b).toMatchObject({ ownedByMe: false, crossOwner: true, name: "Bob" });
  });

  it("reports gmOnline from game.users.activeGM", () => {
    setScene([token("ally", { isOwner: true })], {});
    expect(selectSendTargets(me).gmOnline).toBe(true);
    setScene([token("ally", { isOwner: true })], null);
    expect(selectSendTargets(me).gmOnline).toBe(false);
  });

  it("returns empty when there is no active scene", () => {
    (globalThis as unknown as { game: unknown }).game = { users: { activeGM: {} } };
    expect(selectSendTargets(me).targets).toEqual([]);
  });
});
