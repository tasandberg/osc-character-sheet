import type { RawAdvancedClass } from "@src/util/adaptAdvancedClasses";
import logger from "@src/util/logger";

const TOME_SCRIPT = "modules/ose-advancedfantasytome/scripts/classData.js";

type MergeObject = (a: Record<string, unknown>, b: Record<string, unknown>) => Record<string, unknown>;

function mergeObjectFallback(): MergeObject {
  const real = (globalThis as { foundry?: { utils?: { mergeObject?: MergeObject } } })
    .foundry?.utils?.mergeObject;
  if (real) return real;
  return (a, b) => Object.assign(a ?? {}, b);
}

/**
 * Run the tome's `classData.js` in an isolated sandbox to extract its advanced
 * class map. The script gates its data behind an `'OSRCB initialized'` hook and
 * an OSRCB-active check; the stubs below satisfy both without OSRCB installed.
 * Never throws — returns `null` on any failure.
 */
export function extractAdvancedClasses(
  scriptText: string,
): Record<string, RawAdvancedClass> | null {
  try {
    const Hooks = {
      once: (name: string, cb: () => void) => {
        if (name === "OSRCB initialized") cb();
      },
      on() {},
      call() {},
      callAll() {},
    };
    const game = { modules: { get: () => ({ active: true }) } };
    const OSE: { data: { classes?: { advanced?: Record<string, RawAdvancedClass> } } } = { data: {} };
    const foundry = { utils: { mergeObject: mergeObjectFallback() } };
    // Script interpolates OSRCB.moduleName into pack refs and writes OSRCB.spells.mergedList.
    const OSRCB = { moduleName: "osr-character-builder", spells: { mergedList: {} } };

    new Function("Hooks", "game", "OSE", "foundry", "OSRCB", scriptText)(Hooks, game, OSE, foundry, OSRCB);

    return OSE.data?.classes?.advanced ?? null;
  } catch {
    return null;
  }
}

/**
 * Fetch the Advanced Fantasy tome's `classData.js` and extract its advanced
 * class map. Never throws — returns `null` on any failure.
 */
export async function fetchAdvancedClassesFromTome(): Promise<Record<string, RawAdvancedClass> | null> {
  try {
    const path = foundry.utils.getRoute(TOME_SCRIPT);
    const res = await fetch(path);
    if (!res.ok) return null;
    return extractAdvancedClasses(await res.text());
  } catch (err) {
    logger("Failed to fetch advanced tome class data", err);
    return null;
  }
}
