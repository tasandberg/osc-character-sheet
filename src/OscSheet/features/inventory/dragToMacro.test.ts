import { describe, it, expect } from "vitest";
import { buildItemMacroDragData } from "./dragToMacro";
import type { OSEActor, OseItem } from "@domain/types";

const actor = (over: Partial<OSEActor> = {}) =>
  ({ id: "act1", isToken: false, token: null, pack: null, ...over }) as unknown as OSEActor;

const item = (over: Record<string, unknown> = {}) =>
  ({
    name: "Sword",
    img: "sword.png",
    uuid: "Actor.act1.Item.itm1",
    toDragData: () => ({ type: "Item", uuid: "Actor.act1.Item.itm1" }),
    ...over,
  }) as unknown as OseItem;

describe("buildItemMacroDragData", () => {
  it("produces an OSE-compatible Item payload (createOseMacro reads uuid + item)", () => {
    const data = JSON.parse(buildItemMacroDragData(actor(), item()));
    expect(data.type).toBe("Item");
    expect(data.uuid).toContain("Item."); // createOseMacro rejects non-owned items
    expect(data.actorId).toBe("act1");
    expect(data.item.name).toBe("Sword"); // macro name + img come from here
    expect(data.item.img).toBe("sword.png");
  });

  it("omits scene/token ids for a world actor", () => {
    const data = JSON.parse(buildItemMacroDragData(actor(), item()));
    expect(data.sceneId).toBeNull();
    expect(data.tokenId).toBeNull();
  });

  it("carries scene/token ids for a token actor", () => {
    const data = JSON.parse(
      buildItemMacroDragData(
        actor({ isToken: true, token: { id: "tok1", parent: { id: "scn1" } } } as Partial<OSEActor>),
        item(),
      ),
    );
    expect(data.tokenId).toBe("tok1");
    expect(data.sceneId).toBe("scn1");
  });
});
