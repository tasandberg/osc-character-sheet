// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { parseClassPage } from "./classPage";

describe("parseClassPage", () => {
  it("reads armour, weapons and the introduction from an SRD class page", () => {
    const page = parseClassPage(
      "<div><table><tbody><tr><td><strong>Prime requisite</strong></td><td>DEX</td></tr><tr><td><strong>Armour</strong></td><td>Leather, no shields</td></tr><tr><td><strong>Weapons</strong></td><td>Any</td></tr></tbody></table><p>Thieves live by stealth.</p><p>Not to be trusted.</p><h2>Back-stab</h2><p>+4 to hit.</p></div>",
    );
    expect(page).toEqual({
      description: "<p>Thieves live by stealth.</p><p>Not to be trusted.</p>",
      armour: "Leather, no shields",
      weapons: "Any",
    });
  });

  it("reads the same fields from an Advanced Fantasy tome page", () => {
    const page = parseClassPage(
      '<table border="1"><tbody><tr><td><p><strong>Requirements:</strong> None<br /><strong>Hit Dice</strong>: [[/r 1d4]]<br /><strong>Armour</strong>: Leather, shields<br /><strong>Weapons</strong>: Any</p></td></tr></tbody></table><p>Assassins kill by stealth.</p><h3>Assassin Level Progression</h3>',
    );
    expect(page).toEqual({
      description: "<p>Assassins kill by stealth.</p>",
      armour: "Leather, shields",
      weapons: "Any",
    });
  });
});
