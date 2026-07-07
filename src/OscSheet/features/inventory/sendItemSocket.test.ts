import { describe, it, expect, afterEach } from "vitest";
import { applySend, onRequest, type SendItemRequest } from "./sendItemSocket";
import type { SendNode } from "./sendItem";

// A mock actor whose createEmbeddedDocuments assigns fresh ids AND — like real
// Foundry — does NOT guarantee the returned docs match input order (it reverses
// any multi-doc batch). This is exactly the condition that broke container
// transfers: an index-based old→new id map scrambles the nesting.
function mockActor() {
  let n = 0;
  const created: Record<string, unknown>[] = [];
  const updates: Record<string, unknown>[] = [];
  const deleted: string[] = [];
  return {
    created,
    updates,
    deleted,
    async createEmbeddedDocuments(_t: "Item", data: Record<string, unknown>[]) {
      const docs = data.map((d) => {
        const doc = { ...d, _id: `new-${n++}` };
        created.push(doc);
        return { id: doc._id as string };
      });
      return data.length > 1 ? docs.reverse() : docs;
    },
    async updateEmbeddedDocuments(_t: "Item", u: Record<string, unknown>[]) {
      updates.push(...u);
    },
    async deleteEmbeddedDocuments(_t: "Item", ids: string[]) {
      deleted.push(...ids);
    },
  };
}

const node = (
  key: string,
  parentKey: string | null,
  containerId: string,
  type = "item",
): SendNode => ({
  _key: key,
  _parentKey: parentKey,
  type,
  system: { containerId },
});

describe("applySend — container nesting", () => {
  it("re-nests children under the container's new id regardless of create order", async () => {
    const to = mockActor();
    const from = mockActor();
    // A container (root, containerId "") holding one child (containerId → root key).
    const create = [
      node("R", null, "", "container"),
      node("C", "R", "R"),
    ];
    await applySend({
      fromActor: from,
      toActor: to,
      create,
      deleteIds: ["R", "C"],
      decrement: null,
    });

    // Identify the freshly-created docs by their (old) containerId value.
    const rootNewId = to.created.find(
      (d) => (d.system as { containerId: string }).containerId === "",
    )!._id;
    const childNewId = to.created.find(
      (d) => (d.system as { containerId: string }).containerId === "R",
    )!._id;

    // The child's nesting update must point at the ROOT's new id, not a scrambled one.
    expect(to.updates).toEqual([
      { _id: childNewId, "system.containerId": rootNewId },
    ]);
    // Source items removed after the copies exist.
    expect(from.deleted).toEqual(["R", "C"]);
  });
});

// A user the source actor may or may not own.
const user = (id: string) => ({ id });

/** Source actor that grants OWNER only to `owner`. */
function relaySource(owner: unknown) {
  const a = mockActor();
  return {
    ...a,
    testUserPermission: (u: unknown, p: string) => p === "OWNER" && u === owner,
  };
}

function setGame(
  gm: unknown,
  requester: { id: string },
  src: unknown,
  tgt: unknown,
) {
  (globalThis as unknown as { game: unknown }).game = {
    user: gm,
    users: {
      activeGM: gm, // this client is the acting GM
      get: (id: string) => (id === requester.id ? requester : undefined),
    },
  };
  (globalThis as unknown as { foundry: unknown }).foundry = {
    utils: {
      fromUuid: async (u: string) =>
        u === "Actor.src" ? src : u === "Actor.tgt" ? tgt : null,
    },
  };
}

afterEach(() => {
  delete (globalThis as unknown as { game?: unknown }).game;
  delete (globalThis as unknown as { foundry?: unknown }).foundry;
});

const request = (requesterId: string): SendItemRequest => ({
  type: "sendItem",
  requestId: "req-1",
  sourceUuid: "Actor.src",
  targetUuid: "Actor.tgt",
  create: [node("I", null, "")],
  deleteIds: ["I"],
  decrement: null,
  requesterUserId: requesterId,
});

describe("onRequest — relay authorization", () => {
  it("rejects a relay whose requester does not own the source actor", async () => {
    const gm = user("gm");
    const owner = user("owner"); // owns the source
    const attacker = user("attacker"); // does NOT own it
    const src = relaySource(owner);
    const tgt = mockActor();
    setGame(gm, attacker, src, tgt);

    await onRequest(request(attacker.id));

    // No copy created, no source item deleted — the relay was refused.
    expect(tgt.created).toEqual([]);
    expect(src.deleted).toEqual([]);
  });

  it("applies a relay whose requester owns the source actor", async () => {
    const gm = user("gm");
    const owner = user("owner");
    const src = relaySource(owner);
    const tgt = mockActor();
    setGame(gm, owner, src, tgt);

    await onRequest(request(owner.id));

    expect(tgt.created).toHaveLength(1);
    expect(src.deleted).toEqual(["I"]);
  });
});
