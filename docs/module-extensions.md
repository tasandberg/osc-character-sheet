# Module extension points

The sheet is React and owns its DOM, so modules don't append nodes to it — they
hand it data and it renders them. One extension point exists today.

## `osc-character-sheet.getItemContextMenuEntries`

Fires when an inventory item's right-click menu opens. Push entries onto
`entries`; they render between "Consume one" and "Delete Item", in the order
pushed.

```js
Hooks.on("osc-character-sheet.getItemContextMenuEntries", ({ actor, item, canEdit, entries }) => {
  if (!canEdit) return;
  entries.push({
    label: item.getFlag("quartermaster", "wares") ? "Unmark as Wares" : "Mark as Wares",
    icon: "fa-solid fa-tags",
    onClick: (item, actor) => toggleWares(actor, item),
  });
});
```

| Payload | |
| --- | --- |
| `actor` | the OSE actor document |
| `item` | the Foundry item document for the clicked row |
| `canEdit` | false on read-only sheets — gate write actions on it |
| `entries` | the array to push onto |

| Entry | |
| --- | --- |
| `label` | required, plain text |
| `icon` | Font Awesome classes, e.g. `"fa-solid fa-tags"`; defaults to a puzzle piece |
| `disabled` | renders greyed and unclickable |
| `danger` | renders in the destructive (Delete Item) style |
| `onClick` | required, called with `(item, actor)`; the menu closes right after |

Register at `init` or `ready`. Entries missing a `label` or `onClick` are dropped.

## Contract

- **Entries are rebuilt every time a menu opens**, so a module registering after a
  sheet is open still shows up, and labels can reflect current item state.
- **Nothing fires until someone listens** — with no listeners the sheet does no
  extra work and renders no extra markup.
- **The sheet styles your entry**, so it matches the rest of the menu. You supply
  text, an icon class and behaviour; you don't supply DOM or CSS.
- **`onClick` closes the menu.** Do your own confirmation in a dialog of your own.

## Not covered

Spell, ability and equipped-tray rows have no context menu yet, so there is no
hook for them. Ask if you need one.
