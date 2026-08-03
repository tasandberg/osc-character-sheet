#!/usr/bin/env node
// Static gate: every semantic class the sheet renders must actually carry
// styling. A class that is neither a declared hook, nor matched by a rule in the
// compiled CSS, nor accompanied by a utility on its own element, is a defect —
// that is the signature of styling deleted and never converted.
//
// Reads dist/main.css, so run it after `pnpm build`.

import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(root, "src/OscSheet");
const CSS = process.env.VERIFY_CLASSES_CSS
  ? path.resolve(root, process.env.VERIFY_CLASSES_CSS)
  : path.join(root, "dist/main.css");
const HOOKS_FILE = path.join(root, "tools/class-hooks.json");

const UTILITY = /^(tw:|u-)/;
const EXTERNAL = /^(fa|fas|far|fab|fa-[\w-]+|flexrow|flexcol|window-[\w-]+|prosemirror)$/;

function walk(dir, test) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (name === "node_modules") continue;
    if (statSync(full).isDirectory()) out.push(...walk(full, test));
    else if (test(full)) out.push(full);
  }
  return out;
}

// ── compiled CSS → the set of class names some rule selects ───────────────
function cssClasses(css) {
  const stripped = css
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/"(?:[^"\\]|\\.)*"/g, '""')
    .replace(/'(?:[^'\\]|\\.)*'/g, "''")
    .replace(/url\([^)]*\)/g, "url()");
  const out = new Set();
  // Tailwind escapes its own separators (`.tw\:flex`), so stop at the first
  // backslash — the escaped tail is never a semantic class name.
  for (const m of stripped.matchAll(/\.(-?[A-Za-z_][A-Za-z0-9_-]*)/g)) out.add(m[1]);
  return out;
}

// ── source → module-level `const NAME = "..."` values, for className={NAME} ─
function constStrings(sf, into) {
  for (const stmt of sf.statements) {
    if (!ts.isVariableStatement(stmt)) continue;
    for (const d of stmt.declarationList.declarations) {
      if (!ts.isIdentifier(d.name) || !d.initializer) continue;
      if (ts.isStringLiteral(d.initializer) || ts.isNoSubstitutionTemplateLiteral(d.initializer))
        into.set(d.name.text, d.initializer.text);
    }
  }
}

// ── source → one record per JSX element that has a className ──────────────
function elements(sf, file, consts) {
  const found = [];

  // Walks only the positions that can hold a class name. Conditions and callees
  // are not class sources — treating them as such marks every `cx(...)` element
  // dynamic, and a dynamic element is exempt, which would gut the check.
  const collect = (node, acc) => {
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      acc.literals.push(node.text);
      return;
    }
    if (ts.isIdentifier(node)) {
      const v = consts.get(node.text);
      if (v !== undefined) acc.literals.push(v);
      else acc.dynamic = true;
      return;
    }
    if (ts.isJsxExpression(node) || ts.isParenthesizedExpression(node)) {
      if (node.expression) collect(node.expression, acc);
      else acc.dynamic = true;
      return;
    }
    if (ts.isCallExpression(node)) {
      for (const a of node.arguments) collect(a, acc);
      return;
    }
    if (ts.isBinaryExpression(node)) {
      const op = node.operatorToken.kind;
      if (op === ts.SyntaxKind.AmpersandAmpersandToken) collect(node.right, acc);
      else if (
        op === ts.SyntaxKind.BarBarToken ||
        op === ts.SyntaxKind.QuestionQuestionToken ||
        op === ts.SyntaxKind.PlusToken
      ) {
        collect(node.left, acc);
        collect(node.right, acc);
      } else acc.dynamic = true;
      return;
    }
    if (ts.isConditionalExpression(node)) {
      collect(node.whenTrue, acc);
      collect(node.whenFalse, acc);
      return;
    }
    if (ts.isArrayLiteralExpression(node)) {
      for (const e of node.elements) collect(e, acc);
      return;
    }
    if (ts.isObjectLiteralExpression(node)) {
      // clsx object form: the KEY is the class, the value is the condition.
      for (const p of node.properties) {
        if (ts.isPropertyAssignment(p) && (ts.isStringLiteral(p.name) || ts.isIdentifier(p.name)))
          acc.literals.push(p.name.text);
        else acc.dynamic = true;
      }
      return;
    }
    if (ts.isPrefixUnaryExpression(node) || ts.isAsExpression(node) || ts.isNonNullExpression(node)) {
      collect(node.expression ?? node.operand, acc);
      return;
    }
    acc.dynamic = true;
  };

  const visit = (node) => {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      for (const attr of node.attributes.properties) {
        if (!ts.isJsxAttribute(attr) || attr.name.getText(sf) !== "className") continue;
        if (!attr.initializer) continue;
        const acc = { literals: [], dynamic: false };
        collect(attr.initializer, acc);
        const classes = acc.literals
          .flatMap((s) => s.split(/\s+/))
          .filter(Boolean);
        if (classes.length)
          found.push({
            file,
            line: sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1,
            tag: node.tagName.getText(sf),
            classes,
            dynamic: acc.dynamic,
          });
      }
    }
    node.forEachChild(visit);
  };

  visit(sf);
  return found;
}

// ── the rule ──────────────────────────────────────────────────────────────
// A semantic class passes if it is declared as a hook, matched by a rule in the
// compiled CSS, or sits on an element that carries at least one utility.
// Elements whose className has a part we cannot resolve statically are skipped.
export function classify(els, styled, hookSet) {
  const defects = [];
  const usedHooks = new Set();
  let semanticSeen = 0;

  for (const el of els) {
    const semantic = el.classes.filter((c) => !UTILITY.test(c) && !EXTERNAL.test(c));
    const hasUtility = el.classes.some((c) => UTILITY.test(c));
    semanticSeen += semantic.length;
    for (const c of semantic) {
      if (hookSet.has(c)) {
        usedHooks.add(c);
        continue;
      }
      if (styled.has(c)) continue;
      if (hasUtility) continue;
      if (el.dynamic) continue;
      defects.push({ ...el, cls: c });
    }
  }
  return { defects, usedHooks, semanticSeen };
}

export function classesIn(source) {
  const sf = ts.createSourceFile(
    "t.tsx",
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const consts = new Map();
  constStrings(sf, consts);
  return elements(sf, "t.tsx", consts);
}

export { cssClasses };

// ── run ───────────────────────────────────────────────────────────────────
function main() {
  if (!existsSync(CSS)) {
    console.error(
      `verify-classes: ${path.relative(root, CSS)} not found — run \`pnpm build\` first.`,
    );
    process.exit(2);
  }

  const hooks = JSON.parse(readFileSync(HOOKS_FILE, "utf8")).hooks;
  const hookSet = new Set(Object.keys(hooks));
  const styled = cssClasses(readFileSync(CSS, "utf8"));

  const files = walk(SRC, (f) => f.endsWith(".tsx") && !/\.(stories|test)\.tsx$/.test(f));

  // Class-name constants are shared across files (`FLAVOUR` lives in classes.ts),
  // so build the map over every source before resolving any identifier.
  const consts = new Map();
  const parse = (f) =>
    ts.createSourceFile(
      f,
      readFileSync(f, "utf8"),
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX,
    );
  for (const f of walk(SRC, (f) => /\.tsx?$/.test(f) && !/\.test\.tsx?$/.test(f)))
    constStrings(parse(f), consts);

  const els = files.flatMap((f) => elements(parse(f), f, consts));
  const { defects, usedHooks, semanticSeen } = classify(els, styled, hookSet);
  const stale = Object.keys(hooks).filter((h) => !usedHooks.has(h));

  const rel = (f) => path.relative(root, f);
  console.log(
    `verify-classes: ${files.length} files · ${els.length} className elements · ` +
      `${semanticSeen} semantic classes · ${styled.size} classes in ${rel(CSS)} · ` +
      `${hookSet.size} declared hooks`,
  );

  if (defects.length) {
    console.error(
      `\n${defects.length} unstyled class(es) — no CSS rule, no utility on the element,`,
    );
    console.error(`not declared in ${rel(HOOKS_FILE)}:\n`);
    for (const d of defects) console.error(`  ${rel(d.file)}:${d.line}  <${d.tag}>  .${d.cls}`);
    console.error("");
  }

  if (stale.length) {
    console.error(`\n${stale.length} declared hook(s) no longer rendered — delete them from`);
    console.error(`${rel(HOOKS_FILE)}:\n`);
    for (const h of stale) console.error(`  .${h}`);
    console.error("");
  }

  if (defects.length || stale.length) process.exit(1);
  console.log("verify-classes: ok");
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
