# Old-School Chronicle Character Sheet [BETA]

A fresh, responsive character sheet for **[Old School Essentials](https://necroticgnome.com/)** in Foundry VTT — rebuilt in React for a faster, cleaner play experience.

> **Requires the [Old School Essentials](https://foundryvtt.com/packages/ose) game system.** Old-School Chronicle replaces the character sheet; your actors, items, and data are untouched.

![Foundry v13](https://img.shields.io/badge/Foundry-v13%E2%80%93v14-informational) ![System: OSE](https://img.shields.io/badge/system-OSE-orange)

---

## Install

Old-School Chronicle will be on the official Foundry package listing soon. Until then, install by manifest:

1. In Foundry, open **Add-on Modules → Install Module**.
2. Paste this **Manifest URL** into the bottom field:

   ```
   https://raw.githubusercontent.com/tasandberg/osc-character-sheet/main/module.json
   ```

3. Click **Install**.
4. Launch your OSE world, then enable **Old-School Chronicle Character Sheet** under **Game Settings → Manage Modules**.

Open any character actor — Old-School Chronicle takes over as the sheet automatically.

## Why Old-School Chronicle

### Responsive by design — reclaim your screen

The sheet adapts to whatever space you give it. Drag the window narrow and tabs collapse to the bottom with a compact stat minibar; widen it and navigation moves to a roomy side rail. Run a tight one-window-among-many table without sacrificing legibility, or stretch out when you've got the room.

<img width="55%" alt="image" src="https://github.com/user-attachments/assets/33cdf50c-8704-4c3e-b259-b65c2a00be41" />
<img width="35%"  alt="image" src="https://github.com/user-attachments/assets/90524bf5-29d3-445b-980d-282cdac848bf" />



### Pop out for the luxe experience

Send the sheet to its own browser window and treat it like a proper play surface — full-size on a second monitor or tablet while your map and tokens own the main screen. Same sheet, all the elbow room.

<img width="600" alt="image" src="https://github.com/user-attachments/assets/60320b54-3578-4eb4-8048-608dd1e17e71" />


### Built for OSE

Coins, encumbrance, weapon tags, attacks, and inventory are modeled on the OSE data system — drag an item to the macro hotbar to spin up an attack macro, equip from the inventory, and keep your numbers in sync with the actor.

## Compatibility

| | |
|---|---|
| **Foundry VTT** | v13 minimum · v14 verified |
| **Game system** | Old School Essentials (`ose`) |

## Feedback & issues

Bug reports and feature requests are welcome on the [issue tracker](https://github.com/tasandberg/osc-character-sheet/issues).

---

## Built with foundry-vtt-react

Old-School Chronicle is a React application mounted onto Foundry's ApplicationV2 via **[foundry-vtt-react](https://www.npmjs.com/package/foundry-vtt-react)** — a small framework for building React-powered sheets and apps that stay in sync with Foundry documents. If you're building your own React sheet, that's the place to start.

## Development

```bash
pnpm dev      # Vite dev server, hot-reloaded into local Foundry
pnpm build    # tsc -b && vite build → dist/
pnpm lint
pnpm test
```

**Release:** `pnpm build`, then `pnpm release --type=<patch|minor|major>` (add `--dry-run` to preview). The release script builds to `dist/`, bumps the version in `module.json`, commits, pushes, and cuts a tagged GitHub release.
