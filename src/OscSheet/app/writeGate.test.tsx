// @vitest-environment jsdom
// Structural read-only gate: the write layer (provider updateActor +
// OptimisticProvider optimisticUpdate) must refuse to reach Foundry when
// canEdit=false, and still write when true — independent of any per-control UI.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import OscSheetProvider from "./OscSheetProvider";
import { OptimisticProvider } from "./OptimisticProvider";
import { useOscSheetContext } from "./context";
import type { OSEActor, OscSheetContextValue } from "@domain/types";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// Minimal Foundry globals the provider touches.
(globalThis as { foundry?: unknown }).foundry = {
  utils: { debounce: (fn: unknown) => fn },
};
const connector = { onUpdate: vi.fn(), tearDown: vi.fn() } as never;

let container: HTMLDivElement;
let root: Root;
let ctx: OscSheetContextValue;

function Capture() {
  ctx = useOscSheetContext();
  return null;
}

function makeActor() {
  return {
    name: "Test",
    system: { hp: { value: 5, max: 10 } },
    items: { contents: [] },
    update: vi.fn().mockResolvedValue({ system: { hp: { value: 5, max: 10 } } }),
  } as unknown as OSEActor & { update: ReturnType<typeof vi.fn> };
}

function render(actor: OSEActor, canEdit: boolean, optimistic = false) {
  const inner = <Capture />;
  act(() =>
    root.render(
      <OscSheetProvider
        initialActor={actor}
        source={actor}
        contextConnector={connector}
        canEdit={canEdit}
      >
        {optimistic ? <OptimisticProvider>{inner}</OptimisticProvider> : inner}
      </OscSheetProvider>,
    ),
  );
}

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.restoreAllMocks();
});

describe("write layer — read-only gate", () => {
  it("updateActor refuses to write when canEdit=false", async () => {
    const actor = makeActor();
    render(actor, false);
    await act(async () => {
      await ctx.updateActor({ "system.hp.value": 7 });
    });
    expect((actor as unknown as { update: ReturnType<typeof vi.fn> }).update).not.toHaveBeenCalled();
  });

  it("updateActor writes through when canEdit=true", async () => {
    const actor = makeActor();
    render(actor, true);
    await act(async () => {
      await ctx.updateActor({ "system.hp.value": 7 });
    });
    expect((actor as unknown as { update: ReturnType<typeof vi.fn> }).update).toHaveBeenCalledWith({
      "system.hp.value": 7,
    });
  });

  it("optimisticUpdate no-ops (no commit) when canEdit=false", async () => {
    const actor = makeActor();
    render(actor, false, true);
    const commit = vi.fn().mockResolvedValue(undefined);
    await act(async () => {
      ctx.optimisticUpdate?.("actor", { "system.hp.value": 7 }, commit, 0);
      await new Promise((r) => setTimeout(r, 5));
    });
    expect(commit).not.toHaveBeenCalled();
  });

  it("optimisticUpdate commits when canEdit=true", async () => {
    const actor = makeActor();
    render(actor, true, true);
    const commit = vi.fn().mockResolvedValue(undefined);
    await act(async () => {
      ctx.optimisticUpdate?.("actor", { "system.hp.value": 7 }, commit, 0);
      await new Promise((r) => setTimeout(r, 5));
    });
    expect(commit).toHaveBeenCalledOnce();
  });
});
