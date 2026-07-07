import { describe, it, expect } from "vitest";
import { applySend } from "./sendItemSocket";
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
