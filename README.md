# Old-School Chronicle: Character Sheet

A fresh, responsive character sheet for **[Old School Essentials](https://necroticgnome.com/)** in Foundry VTT — rebuilt in React for a faster, cleaner play experience.

> **Requires the [Old School Essentials](https://foundryvtt.com/packages/ose) game system.** The OSC Character Sheet replaces the default sheet; your actors, items, and data are untouched.

![Foundry v13](https://img.shields.io/badge/Foundry-v13%E2%80%93v14-informational) ![System: OSE](https://img.shields.io/badge/system-OSE-orange)

Part of the **Old-School Chronicle** toolset, more to come on that soon!

---

## Install

In Foundry, open **Add-on Modules → Install Module**, search **Old-School Chronicle: Character Sheet**, and click **Install**. Then launch your OSE world and enable it under **Game Settings → Manage Modules**.

Character and NPC actors use the OSC Character Sheet by default.

**Beta channel (recommended for developers only):**

Install from the rolling beta manifest (Foundry auto-updates through every build):

```
https://github.com/tasandberg/osc-character-sheet/releases/download/beta/module.json
```

Paste it into the **Manifest URL** field of the Install Module dialog. It installs as **… [Beta]** and shares the stable module's id, so run one or the other — never both.

## Why OSC Character Sheet

### Responsive by design — reclaim your screen

The sheet adapts to whatever space you give it. Drag the window narrow and tabs collapse to the bottom with a compact stat minibar; widen it and navigation moves to a roomy side rail. Run a tight one-window-among-many table without sacrificing legibility, or stretch out when you've got the room.

<img width="55%" src="https://github.com/user-attachments/assets/2b53ccd9-cae4-4b55-b2d4-bc003fdafa6f" />
<img  alt="image" width="35%" src="https://github.com/user-attachments/assets/2c4ac83b-33b1-4e0e-853a-782d1340a8ed" />




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

## Bug reports (manual, anonymous)

If the sheet ever crashes, an error boundary catches it and shows a recovery screen — your actor data is never at risk, and you can reopen the sheet or fall back to the default OSE sheet.

The crash screen offers a **Send bug report** button. Nothing is ever sent automatically and there is no setting to enable — a report goes out only when you press the button. It contains the error message, stack trace, and module/Foundry/OSE versions, nothing else: actor names, user names, and document ids are scrubbed on your machine first, and a "see what's included" disclosure on the crash screen shows the exact payload before you send. The reporting code isn't even downloaded until the button is pressed.

For maintainers: reports use the Sentry protocol. The endpoint is baked in at build time via the `VITE_SENTRY_DSN` env var (e.g. in `.env.local`); a build without a DSN replaces the send button with "Copy error details" for pasting into a GitHub issue.

---

## Built with foundry-vtt-react

The OSC Character Sheet is a React application mounted onto Foundry's ApplicationV2 via **[foundry-vtt-react](https://www.npmjs.com/package/foundry-vtt-react)** — a small framework for building React-powered sheets and apps that stay in sync with Foundry documents. If you're building your own React sheet, that's the place to start.

## Development

```bash
pnpm dev      # Vite dev server, hot-reloaded into local Foundry
pnpm build    # tsc -b && vite build → dist/
pnpm lint
pnpm test
```

**Release:** `pnpm build`, then `pnpm release --type=<patch|minor|major>` (add `--dry-run` to preview). The release script builds to `dist/`, bumps the version in `module.json`, commits, pushes, and cuts a tagged GitHub release.
