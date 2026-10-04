import { describe, it, expect } from "vitest";
import type { FlagDocument } from "@domain/flags";
import { userFlagDraftStore } from "./draftStore";

function fakeUser(): FlagDocument {
  const flags = new Map<string, unknown>();
  return {
    getFlag: (scope, key) => flags.get(`${scope}.${key}`),
    setFlag: async (scope, key, value) => flags.set(`${scope}.${key}`, value),
    unsetFlag: async (scope, key) => flags.delete(`${scope}.${key}`),
  };
}

describe("userFlagDraftStore", () => {
  it("keeps one draft per wizard on the user, until cleared", () => {
    const user = fakeUser();
    const newCharacter = userFlagDraftStore(user, "new");
    newCharacter.save({ step: "class", draft: { done: ["scores"] } });

    expect(userFlagDraftStore(user, "new").load()).toEqual({
      step: "class",
      draft: { done: ["scores"] },
    });
    expect(userFlagDraftStore(user, "actor-1").load()).toBeUndefined();

    newCharacter.clear();
    expect(userFlagDraftStore(user, "new").load()).toBeUndefined();
  });

  it("ignores a saved value it can't read", () => {
    const user = fakeUser();
    void user.setFlag("osc-character-sheet", "creationDrafts.new", "{oops");
    expect(userFlagDraftStore(user, "new").load()).toBeUndefined();
  });
});
