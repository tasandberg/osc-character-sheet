import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { extractAdvancedClasses } from "@src/util/fetchTomeClassData";
import { installAdvancedClasses } from "@src/util/adaptAdvancedClasses";

// Mirrors the real tome wrapper: gated on an 'OSRCB initialized' hook + an
// OSRCB-active check, merging class defs into OSE.data.classes.advanced. It also
// references OSRCB (moduleName interpolation + spells.mergedList write) as the
// real script does — so the sandbox must stub OSRCB or extraction throws.
const tomeScript = `
Hooks.once('OSRCB initialized', () => {
  if (game.modules.get('osr-character-builder')?.active) {
    OSE.data.classes = foundry.utils.mergeObject(OSE.data.classes || {}, {
      classic: {},
      advanced: {
        acrobat: {
          name: 'acrobat', menu: 'Acrobat', pack: 'ose-advancedfantasytome.abilities',
          spellPackName: \`\${OSRCB.moduleName}.osr-srd-spells\`,
          hdArr: ['1d4'], saves: { '1': [13,14,13,16,15] }, thac0: { '1': [19,0] },
          xp: [], req: 'None', spellCaster: false, maxLvl: 1,
        },
        bard: {
          name: 'bard', menu: 'Bard', pack: 'ose-advancedfantasytome.abilities',
          hdArr: ['1d6'], saves: { '1': [13,14,13,16,15] }, thac0: { '1': [19,0] },
          xp: [], req: 'Minimum DEX 9', spellCaster: false, maxLvl: 1,
        },
      },
    });
    OSRCB.spells.mergedList = foundry.utils.mergeObject(OSRCB.spells.mergedList, OSE.spellList || {});
  }
});
`;

describe("extractAdvancedClasses", () => {
  it("returns the advanced class map from a tome-shaped script", () => {
    const advanced = extractAdvancedClasses(tomeScript);
    expect(advanced).not.toBeNull();
    expect(Object.keys(advanced!).sort()).toEqual(["acrobat", "bard"]);
    expect(advanced!.acrobat.menu).toBe("Acrobat");
    expect(advanced!.bard.req).toBe("Minimum DEX 9");
  });

  it("returns null for malformed script text without throwing", () => {
    expect(extractAdvancedClasses("this is ( not valid javascript {{{")).toBeNull();
  });

  it("returns null when the script references an unstubbed global (isolation)", () => {
    const advanced = extractAdvancedClasses(
      "window.location.href = 'x'; document.title = 'y';",
    );
    expect(advanced).toBeNull();
  });

  it("returns null when the script sets no advanced classes", () => {
    expect(extractAdvancedClasses("OSE.data.classes = { classic: {} };")).toBeNull();
  });
});

describe("installAdvancedClasses", () => {
  beforeEach(() => {
    (globalThis as unknown as { CONFIG: unknown }).CONFIG = {
      OSE: { classes: { advanced: {} } },
    };
  });
  afterEach(() => {
    delete (globalThis as unknown as { CONFIG?: unknown }).CONFIG;
    delete (globalThis as unknown as { OSE?: unknown }).OSE;
    vi.restoreAllMocks();
  });

  it("uses the existing global and does not fetch when it is present", async () => {
    (globalThis as unknown as { OSE: unknown }).OSE = {
      data: {
        classes: {
          advanced: {
            acrobat: {
              name: "acrobat",
              menu: "Acrobat",
              pack: "p",
              hdArr: ["1d4"],
              saves: { "1": [13, 14, 13, 16, 15] },
              thac0: { "1": [19, 0] },
              xp: [],
              req: "None",
              spellCaster: false,
              maxLvl: 1,
            },
          },
        },
      },
    };
    const fetchSpy = vi.fn();
    (globalThis as unknown as { fetch: unknown }).fetch = fetchSpy;

    const count = await installAdvancedClasses();

    expect(count).toBe(1);
    expect(fetchSpy).not.toHaveBeenCalled();
    const classes = (globalThis as unknown as {
      CONFIG: { OSE: { classes: { advanced: Record<string, { name: string }> } } };
    }).CONFIG.OSE.classes.advanced;
    expect(classes.Acrobat.name).toBe("Acrobat");
  });
});
