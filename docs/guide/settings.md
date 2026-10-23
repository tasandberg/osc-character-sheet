---
title: Settings
order: 9
summary: Module settings, the in-sheet Preferences window, theme and font size, and which settings are yours versus the world's.
tags: [settings, preferences, theme, dark, light, font size, spell images, memorization, prompt for target, portrait uploads, per-user, world]
---

# Settings

Some settings are yours alone; others apply to the whole world and only a GM can change them.

- **Your settings** follow your Foundry user account, so they apply on any device you log in from, and they don't affect anyone else.
- **World settings** apply to everyone in the world.

## How do I change the theme or text size?

Click the cog (Settings) at the right of the sheet's top bar. The **Preferences** window opens:

- **Theme:** **System** follows Foundry's own light or dark interface; **Dark** and **Light** always use that look. Applies to your sheets only.
- **Font size:** **Compact**, **Medium** or **Large**. Scales all the text on the sheet.
- **Spell images:** shows or hides spell icons in the spell lists.

Changes apply straight away to every Enhanced Character Sheet you have open. Anyone who can see the full sheet gets the cog, including players viewing someone else's sheet.

On a monster sheet, the same cog sets the monster sheet's own theme and font size. Tick **Same as character sheet** to keep them matched.

![Preferences window](images/settings-preferences.png)

## Where are the module settings?

Open **Game Settings → Configure Settings** and find **Enhanced Character Sheet for Old-School Essentials**.

| Setting | Who it affects | What it does |
| --- | --- | --- |
| **Sheet theme** | You | Same as **Theme** in Preferences. |
| **Sheet font size** | You | Same as **Font size** in Preferences. |
| **Show spell images** | You | Same as **Spell images** in Preferences. |
| **Monster sheet theme** | You | Theme for monster sheets, or **Same as character sheet**. |
| **Monster sheet font size** | You | Font size for monster sheets, or **Same as character sheet**. |
| **Disable spell memorization** | World | Switches every caster to free-casting. See [Spells](spells.md). |
| **Prompt for target** | World | Asks players to pick a target before rolling **Hit**, **Dmg** or **Attack** without one. See [Attacks](attacks.md). |
| **Portrait image uploads** | World | Lets players drop image files from their computer onto a portrait to upload them. |
| **Portrait upload folder** | World | Where those uploads are stored. Defaults to a folder inside the world. |

## Why can't I drop an image file onto my portrait?

Uploading needs three things:

1. The GM has turned on **Portrait image uploads**.
2. **Portrait upload folder** points to a folder.
3. Your Foundry user role is allowed to upload files.

If any of these is missing, the sheet tells you when you drag a file over it. Images dragged from Foundry's own file browser always work, because nothing needs uploading.

## Which OSE system settings change the sheet?

The sheet follows these OSE world settings (under the **Old-School Essentials** section of **Configure Settings**):

- **Encumbrance:** which encumbrance mode the inventory shows. See [Inventory and encumbrance](inventory-and-encumbrance.md).
- **Ascending Armor Class:** whether AC is ascending or descending, and whether the Edit Character window shows **Attack Bonus** or **THAC0**.
- **Invert Roll Ctrl/Meta-key:** whether a plain click or a Ctrl-click skips OSE's roll dialogs.
- **Globally Ignore Attack Bonus For Damage Rolls:** drops the weapon bonus from **Dmg** rolls.
- **Significant Treasure Weight:** used by Basic encumbrance.
