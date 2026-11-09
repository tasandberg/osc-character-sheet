import { describe, it, expect } from "vitest";
import { evaluateHit } from "@domain/chat/attackCard";

const t = { aac: 15, ac: 5 };

describe("evaluateHit", () => {
  it("nat 1 always misses, nat 20 always hits (both AC modes)", () => {
    for (const ascending of [true, false]) {
      const base = { total: 99, ascending, thac0: 19, target: t };
      expect(evaluateHit({ ...base, nat: 1 })).toBe(false);
      expect(evaluateHit({ ...base, total: -99, nat: 20 })).toBe(true);
    }
  });

  describe("ascending AC (total ≥ AAC)", () => {
    const base = { nat: 12, ascending: true, thac0: 19, target: t };
    it("hits when the rolled total meets AAC", () => {
      expect(evaluateHit({ ...base, total: 15 })).toBe(true);
    });
    it("misses when the rolled total is below AAC", () => {
      expect(evaluateHit({ ...base, total: 14 })).toBe(false);
    });
  });

  describe("descending AC (THAC0 − total ≤ AC)", () => {
    const base = { nat: 12, ascending: false, target: t };
    it("hits when THAC0 − total ≤ AC", () => {
      expect(evaluateHit({ ...base, total: 14, thac0: 19 })).toBe(true); // 5 ≤ 5
      expect(evaluateHit({ ...base, total: 18, thac0: 19 })).toBe(true);
    });
    it("misses when THAC0 − total > AC", () => {
      expect(evaluateHit({ ...base, total: 13, thac0: 19 })).toBe(false); // 6 > 5
    });
  });
});
