# Module extension points

The sheet is React, so it owns its DOM and rebuilds it whenever state changes. A
module can still decorate it — the sheet tells you when it has painted, and
guarantees a set of anchors you can find your way around by. What you put in the
page after that is yours.

## `osc-character-sheet.renderSheet`

```js
Hooks.on("osc-character-sheet.renderSheet", ({ sheet, actor, element }) => {
  for (const row of element.querySelectorAll(".osc-inv-row[data-item-id]")) {
    row.querySelector(":scope > .qm-controls")?.remove();
    const item = actor.items.get(row.dataset.itemId);
    const controls = document.createElement("span");
    controls.className = "qm-controls";
    controls.append(stowButton(actor, item));
    row.append(controls);
  }
});
```

| Field | |
| --- | --- |
| `sheet` | the `OscSheet` ApplicationV2 instance |
| `actor` | the OSE actor document |
| `element` | `.osc-sheet-app`, the React root — query your anchors under it |

Register at `init` or `ready`, before any sheet opens.

## Anchors

Stable, and safe to query. Anything else in the tree is an implementation detail
that will change without notice.

| Anchor | |
| --- | --- |
| `.osc-sheet-app` | the React root; `data-theme` and `.is-readonly`/`.is-limited` live here |
| `.osc-inv-row[data-item-id]` | one per inventory row, nested container rows included |
| `.osc-inv-container` | wraps a container row and its children |
| `.osc-portrait-wrap` | the portrait; `.modifiers-btn` inside it is the established overlay slot |

## Contract

- **It fires after every commit, not every Foundry render.** React re-renders on
  its own — equipping an item, editing a quantity, switching tabs — and Foundry's
  `_onRender` never sees those. Every one of them fires this hook.
- **Re-apply your DOM every time, and dedupe.** React reconciles away foreign
  nodes among children it rendered, so treat each fire as "the sheet may have
  thrown your work away." Remove your own nodes before appending them again;
  that is also what keeps them from stacking.
- **Nothing fires until someone listens.** With no listeners the sheet does no
  extra work at all.
- **Styling is yours.** The sheet ships no CSS for module-injected nodes and makes
  no room for them. You are inside `.osc-sheet`, where an `all: unset` reset
  applies to `button`/`input`, and inventory rows are a fixed-track grid — an
  appended child lands in an implicit track. Set your own box, and scope your
  selectors so you don't bleed into the sheet's own styles.
- **Anchors are the compatibility surface.** They will not be renamed casually,
  but they are classnames, not an API — pin your module to a sheet version if
  that matters to you.

## Not covered

There is no per-widget hook and no registration API. Spell rows, ability rows and
equipped-tray tiles carry no id attribute yet; ask if you need one.
