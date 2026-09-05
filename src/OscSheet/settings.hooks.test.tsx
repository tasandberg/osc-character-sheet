// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import {
  notifySettingChanged,
  useOscSettings,
  useSetting,
} from "@src/OscSheet/settings";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const NS = "osc-character-sheet";

const store = new Map<string, unknown>();

const mockSettings = (seed: Record<string, unknown>) => {
  store.clear();
  for (const [key, value] of Object.entries(seed)) store.set(key, value);
  (globalThis as { game?: unknown }).game = {
    settings: {
      get: (ns: string, key: string) => store.get(`${ns}.${key}`),
      set: (ns: string, key: string, value: unknown) => {
        store.set(`${ns}.${key}`, value);
        return Promise.resolve(value);
      },
    },
  };
};

let host: HTMLDivElement;
let root: Root;

beforeEach(() => {
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
});

afterEach(() => {
  act(() => root.unmount());
  host.remove();
  store.clear();
  delete (globalThis as { game?: unknown }).game;
});

const renders = { spellImages: 0, all: 0 };

function SpellImages() {
  const shown = useSetting("showSpellImages");
  renders.spellImages += 1;
  return <span data-testid="images">{String(shown)}</span>;
}

function AllSettings() {
  const settings = useOscSettings();
  renders.all += 1;
  return (
    <span data-testid="all">{`${settings.theme}/${settings.fontScale}`}</span>
  );
}

const text = (id: string) =>
  host.querySelector(`[data-testid="${id}"]`)?.textContent;

beforeEach(() => {
  renders.spellImages = 0;
  renders.all = 0;
});

describe("useSetting", () => {
  it("falls back to the registry default with no game global", () => {
    act(() => root.render(<SpellImages />));
    expect(text("images")).toBe("true");
  });

  it("reads the stored value and re-renders when its key is notified", () => {
    mockSettings({ [`${NS}.showSpellImages`]: true });
    act(() => root.render(<SpellImages />));
    expect(text("images")).toBe("true");

    store.set(`${NS}.showSpellImages`, false);
    act(() => notifySettingChanged("showSpellImages"));
    expect(text("images")).toBe("false");
  });

  it("does not re-render when an unrelated key changes", () => {
    mockSettings({ [`${NS}.showSpellImages`]: true, [`${NS}.theme`]: "dark" });
    act(() => root.render(<SpellImages />));
    const before = renders.spellImages;

    store.set(`${NS}.theme`, "cream");
    act(() => notifySettingChanged("theme"));
    expect(renders.spellImages).toBe(before);
    expect(text("images")).toBe("true");
  });

  it("stops listening once unmounted", () => {
    mockSettings({ [`${NS}.showSpellImages`]: true });
    act(() => root.render(<SpellImages />));
    act(() => root.unmount());
    const before = renders.spellImages;

    store.set(`${NS}.showSpellImages`, false);
    act(() => notifySettingChanged("showSpellImages"));
    expect(renders.spellImages).toBe(before);

    root = createRoot(host);
  });
});

describe("useOscSettings", () => {
  it("renders once from a stable snapshot — no getSnapshot loop", () => {
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    mockSettings({ [`${NS}.theme`]: "cream", [`${NS}.fontScale`]: "large" });
    act(() => root.render(<AllSettings />));
    expect(text("all")).toBe("cream/large");
    expect(renders.all).toBe(1);
    expect(errors).not.toHaveBeenCalled();
    errors.mockRestore();
  });

  it("re-renders on any key's change", () => {
    mockSettings({ [`${NS}.theme`]: "dark", [`${NS}.fontScale`]: "medium" });
    act(() => root.render(<AllSettings />));

    store.set(`${NS}.fontScale`, "compact");
    act(() => notifySettingChanged("fontScale"));
    expect(text("all")).toBe("dark/compact");

    store.set(`${NS}.theme`, "cream");
    act(() => notifySettingChanged("theme"));
    expect(text("all")).toBe("cream/compact");
  });

  it("stays on the same snapshot when a notify changes nothing", () => {
    mockSettings({ [`${NS}.theme`]: "dark" });
    act(() => root.render(<AllSettings />));
    const before = renders.all;
    act(() => notifySettingChanged("theme"));
    expect(renders.all).toBe(before);
  });
});
