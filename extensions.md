# Extending the OSC Character Sheet

The sheet is React, so it owns its DOM and rebuilds it whenever state changes. A module can still decorate it: the sheet hands you an element that is yours to fill, and tells you when it has painted.

## `osc-character-sheet.renderItemMenu`

Fires after an item menu paints — both the row's ⋮ button and a right-click on a row, tray tile or treasure row.

```js
Hooks.on("osc-character-sheet.renderItemMenu", ({ actor, item, element, close }) => {
  element.replaceChildren();
  if (!item) return;

  const entry = document.createElement("div");
  entry.className = "menu-item";
  entry.setAttribute("role", "menuitem");
  entry.innerHTML = '<span class="ic"><i class="fa-solid fa-box"></i></span>';
  entry.append(`Stow ${item.name}`);
  entry.addEventListener("click", () => {
    stow(actor, item);
    close();
  });
  element.append(entry);
});
```

| Field | |
|---|---|
| `actor` | the OSE actor document whose sheet is open |
| `item` | the Foundry item document — `undefined` on a coin row |
| `element` | an empty `div.osc-item-menu-additions` at the end of the menu; yours |
| `close` | closes the menu |

Register at `init` or `ready`, before any sheet opens.

**Contract**

- **Nothing fires until someone listens.** With no listeners the host element isn't rendered and no hook is called.
- **It fires once per commit, not once per open.** React re-renders on its own — a quantity edit, an equip toggle — and each one fires this again. Call `element.replaceChildren()` before you fill it or your entries will stack.
- **The host is the contract; the rest of the menu is not.** React renders `.osc-item-menu-additions` empty and never reconciles its children, so what you put inside survives. Appending anywhere else in the menu does not.
- **Styling is mostly free.** You're inside the sheet's `.menu`, so `.menu-item`, `.menu-item.danger`, `.ic` and `.shortcut` render like the sheet's own entries and follow the user's theme.
- **Guard for `item` being undefined.** Coins are real Foundry items but aren't inventory nodes, so a coin row's menu passes no document.

There is no hook yet for inventory rows themselves, spell rows, ability rows or equipped-tray tiles, and no registration API — [open an issue](https://github.com/tasandberg/osc-character-sheet/issues) if you need one.
