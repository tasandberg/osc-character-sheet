# Visual regression harness

Drives the sheet in a **real Foundry world** and compares two builds. It exists
because the CSS conversion shipped several defects that every automated gate
passed: the unit tests assert behaviour, the e2e specs click controls and read
chat, and none of them looks at geometry.

Not wired into CI — it needs a live Foundry server. Run it before merging a
change that touches styling.

## Where this sits among the gates

| gate | in CI | catches |
| --- | --- | --- |
| `pnpm verify:classes` | yes | a rendered class with no CSS rule, no utility on its element and no declared hook — styling deleted and never replaced |
| `src/OscSheet/stories/tabs.smoke.test.tsx` | yes | a tab that throws or renders empty |
| Storybook (`Tabs / *`) | build only | how a whole tab *looks*, by eye, in both themes and all three font scales |
| this harness | no | geometry, against a real Foundry world |

`verify:classes` answers "is this class styled at all", not "is it styled
correctly" — it reads the compiled CSS statically and knows nothing about
whether a rule actually applies. Everything below is what covers that gap.

Storybook renders each tab inside a resizable `.osc-sheet-app`, so container-query
reflow and both themes are reachable there. The **font scale** toolbar control
sets `--fs-scale` the way `applyFontScale` does, so `compact` and `large` are
reachable too — but nothing *asserts* any of it. A story proves a tab renders;
only a person or this harness notices that it renders wrong.

## Read this first: three ways this harness lied

Each of these produced a **confident pass while testing nothing**. They are not
hypothetical; all three shipped in earlier versions of these scripts and two of
them were reported as evidence before being caught.

1. **Replacing the `dist` directory doesn't reach the container.** The compose
   file bind-mounts `dist/`, and the mount tracks the original directory inode.
   `mv dist dist.old && cp -R other/dist dist` leaves Foundry serving the *old*
   build, so a before/after diff compares a build against itself and comes back
   perfectly clean. **Write `main.css` and `main.js` in place.** Verify with
   `curl -s $URL/modules/osc-character-sheet/dist/main.css | wc -c` before
   trusting a run.

2. **`@import`ed stylesheets are not in `document.styleSheets`.** Foundry pulls
   nearly everything in through `@import`, and an imported sheet hangs off
   `CSSImportRule.styleSheet`. A walker that only iterates `document.styleSheets`
   never reaches the module's own CSS at all, and reports zero of everything.

3. **`CSSStyleRule.cssRules` is empty but truthy.** With nested-CSS support, a
   plain style rule exposes an empty `CSSRuleList`. The natural shape
   `if (r.cssRules) { descend; continue; }` therefore swallows **every style
   rule** before its selector is ever read. Length-check it.

A fourth, subtler one, which is why `computed.mjs` exists: **"count the CSS
rules whose selector matches this element" is not a measure of styling.** A
selector inside an unmatched `@container` still satisfies `el.matches()`, so an
element whose rule is not applying scores as styled. That check rated a
known-broken build as clean.

The general rule, and the reason every script here prints its counts:

> **A verification that cannot demonstrate it can fail is not evidence.**

Before trusting a green run, point the check at a build you *know* is broken and
confirm it goes red. `capture.mjs` and `computed.mjs` both emit the size of what
they examined — sheets reached, rules walked, selectors tested, elements
compared — so a run that examined nothing is visible instead of reassuring.

## Which check to use

Neither subsumes the other, so run both:

| | catches | misses |
| --- | --- | --- |
| `capture.mjs` + `diff.mjs` | anything visible, including modals and the chat card | nothing, but tells you *where* only via the first differing row |
| `computed.mjs` + `compare.mjs` | the exact property that moved, on the exact element | anything not open at capture time — **it never opens the modals** |

A real font-family regression in the edit modal was invisible to `computed.mjs`
and obvious to the pixel diff. A 14% font-size error across four stylesheets was
a vague blur in the pixel diff and a single unmistakable pattern in the computed
diff.

## Usage

```sh
# 0. A spare GM. NEVER the world's own Gamemaster: Foundry accepts a duplicate
#    join and kicks the existing session, so running this against a world
#    someone is using boots them. Defaults to "GM 3"; override with FOUNDRY_USER.

# 1. Capture the reference build.
git worktree add /tmp/pre <base-ref>
cd /tmp/pre && ln -s <repo>/node_modules node_modules && pnpm build
cp /tmp/pre/dist/main.css <repo>/dist/main.css     # IN PLACE — see above
cp /tmp/pre/dist/main.js  <repo>/dist/main.js
node tools/visual/capture.mjs  out/pre
node tools/visual/computed.mjs out/pre.json

# 2. Restore the build under test and capture it.
pnpm build
node tools/visual/capture.mjs  out/post
node tools/visual/computed.mjs out/post.json

# 3. Compare.
node tools/visual/diff.mjs    out/pre out/post
node tools/visual/compare.mjs out/pre.json out/post.json
```

`FOUNDRY_URL` overrides the server (default `http://localhost:30000`).

## What it covers

Five tabs × two themes × three tiers (920 / 560 / 390), driven by resizing the
**Foundry window** — the sheet's tiers are container queries on its own frame,
so the browser viewport is the wrong knob. Plus the collapsed minibar (medium
band only, and only once the header scrolls out), the edit and settings modals,
and a real chat card.

The chat card matters disproportionately: `chat.scss` styles the host's chat
`<li>` **on purpose**, so it is the one part of our CSS that legitimately applies
outside `.osc-sheet`. `capture.mjs` partitions scope matches into intentional
(`.osc-message` / `.osc-card`) and unexpected. Without a card in the DOM the
scope check silently never exercises that file.

## Scratch actor

Every run creates its own actor, drives it, and deletes it along with the chat
messages and hotbar macros it generated. Never point this at a real character —
and note that a run that crashes mid-way leaves the actor behind.

**`chat-card.png` is nondeterministic.** It contains a real attack roll, so the
numbers differ between runs — expect ~0.5% on that shot even between two
captures of the same build. Every other shot is deterministic; treat a non-zero
delta on any of them as real.

**Both sides of a comparison must be captured with the same actor definition.**
Item names change text widths, which changes wrapping, which changes both the
element count and every derived width — so a capture taken with a different
scratch actor reports dozens of "differences" that are really just different
content. If you edit `createScratchActor`, re-capture the reference. A tell-tale
sign is the two captures disagreeing on their element count.
