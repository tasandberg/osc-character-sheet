import { describe, expect, it } from "vitest";
// @ts-expect-error — plain .mjs tool, no types
import { classify, classesIn, cssClasses } from "./verify-classes.mjs";

type El = { classes: string[]; dynamic: boolean; tag: string; file: string; line: number };

const el = (classes: string, dynamic = false): El => ({
  classes: classes.split(/\s+/).filter(Boolean),
  dynamic,
  tag: "div",
  file: "t.tsx",
  line: 1,
});

const run = (els: El[], styled: string[] = [], hooks: string[] = []) =>
  classify(els, new Set(styled), new Set(hooks));

describe("cssClasses", () => {
  it("collects class names from selectors", () => {
    const set = cssClasses(".osc-atk { color: red } .a .b, .c > .d { gap: 1px }");
    expect([...set].sort()).toEqual(["a", "b", "c", "d", "osc-atk"]);
  });

  it("ignores dotted numbers, comments and string values", () => {
    const set = cssClasses(
      "/* .commented */ .real { margin: 1.5rem; content: '.quoted'; background: url(a/.hidden.png) }",
    );
    expect([...set]).toEqual(["real"]);
  });

  it("stops at Tailwind's escaped separator rather than inventing a class", () => {
    expect([...cssClasses(".tw\\:flex { display: flex }")]).toEqual(["tw"]);
  });
});

describe("classesIn", () => {
  it("reads a literal className", () => {
    expect(classesIn(`const A = () => <div className="a b" />;`)[0].classes).toEqual(["a", "b"]);
  });

  it("reads the literal arms of a cx() call without marking it dynamic", () => {
    const [e] = classesIn(`const A = ({ on }) => <div className={cx("a", on && "b")} />;`);
    expect(e.classes).toEqual(["a", "b"]);
    expect(e.dynamic).toBe(false);
  });

  it("resolves a module-level string constant", () => {
    expect(classesIn(`const F = "flavour"; const A = () => <p className={F} />;`)[0].classes).toEqual(
      ["flavour"],
    );
  });

  it("marks an unresolvable className dynamic so the rule stays conservative", () => {
    const [e] = classesIn(`const A = ({ className }) => <div className={className} />;`);
    expect(e).toBeUndefined();
    const [f] = classesIn(`const A = ({ className }) => <div className={cx("a", className)} />;`);
    expect(f.dynamic).toBe(true);
  });
});

describe("classify", () => {
  // The regression this whole gate exists for: styling deleted, no utilities
  // added in its place, class still rendered.
  it("reports a class with no CSS rule and no utility on its element", () => {
    const { defects } = run([el("fvtt-explore")]);
    expect(defects.map((d: { cls: string }) => d.cls)).toEqual(["fvtt-explore"]);
  });

  it("passes a class a live rule matches", () => {
    expect(run([el("fvtt-explore")], ["fvtt-explore"]).defects).toEqual([]);
  });

  it("passes an unstyled class accompanied by a utility on the same element", () => {
    expect(run([el("spinfo tw:min-w-0")]).defects).toEqual([]);
    expect(run([el("load u-text-faint")]).defects).toEqual([]);
  });

  it("passes a declared hook and records that it is still rendered", () => {
    const { defects, usedHooks } = run([el("osc-atk")], [], ["osc-atk"]);
    expect(defects).toEqual([]);
    expect([...usedHooks]).toEqual(["osc-atk"]);
  });

  it("leaves a declared hook out of usedHooks once nothing renders it", () => {
    expect([...run([el("other tw:flex")], [], ["osc-atk"]).usedHooks]).toEqual([]);
  });

  it("skips an element whose className cannot be fully resolved", () => {
    expect(run([el("mystery", true)]).defects).toEqual([]);
  });

  it("ignores utilities and host-provided classes as subjects", () => {
    const { defects, semanticSeen } = run([el("tw:flex u-p-4 fa-solid fa-star flexrow")]);
    expect(defects).toEqual([]);
    expect(semanticSeen).toBe(0);
  });

  // A styled sibling is deliberately NOT an excuse: the original defect landed on
  // elements that kept a styled `osc-section` while their own class went dead.
  it("still reports an unstyled class sitting next to a styled one", () => {
    const { defects } = run([el("osc-section osc-spells")], ["osc-section"]);
    expect(defects.map((d: { cls: string }) => d.cls)).toEqual(["osc-spells"]);
  });
});
