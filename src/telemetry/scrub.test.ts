import { describe, it, expect } from "vitest";
import { scrubEvent, type ScrubbableEvent } from "./scrub";

describe("scrubEvent", () => {
  it("redacts names and Foundry ids from message and exception values", () => {
    const event: ScrubbableEvent = {
      message: "Grimble Toadfoot (Actor.a1B2c3D4e5F6g7H8) exploded",
      exception: {
        values: [
          { type: "TypeError", value: "cannot read Grimble Toadfoot of a1B2c3D4e5F6g7H8" },
        ],
      },
    };
    scrubEvent(event, ["Grimble Toadfoot", "Tim"]);
    expect(event.message).toBe("[redacted] ([redacted]) exploded");
    expect(event.exception!.values![0].value).toBe(
      "cannot read [redacted] of [redacted]",
    );
  });

  it("strips breadcrumbs, user, request, and server_name", () => {
    const event: ScrubbableEvent = {
      message: "boom",
      breadcrumbs: [{ message: "clicked a thing" }],
      user: { id: "u1" },
      request: { url: "http://example" },
      server_name: "gm-laptop",
    };
    scrubEvent(event, []);
    expect(event.breadcrumbs).toBeUndefined();
    expect(event.user).toBeUndefined();
    expect(event.request).toBeUndefined();
    expect(event.server_name).toBeUndefined();
    expect(event.message).toBe("boom");
  });

  it("redacts the componentStack extra and ignores empty/short names", () => {
    const event: ScrubbableEvent = {
      extra: { componentStack: "at SheetShell for Bob the Axe" },
    };
    scrubEvent(event, ["", "B", "Bob the Axe"]);
    expect(event.extra!.componentStack).toBe("at SheetShell for [redacted]");
  });
});
