---
title: FAQ and troubleshooting
order: 10
summary: Answers to common questions, what to do if the sheet breaks, and where to report bugs.
tags: [faq, troubleshooting, help, bugs, issues, crash, permissions, level up, default sheet, github]
---

# FAQ and troubleshooting

## Will switching sheets lose my character's data?

No. The sheet reads and writes the same OSE actor data as the system's own sheet. You can switch back and forth freely.

## How do I go back to the OSE sheet?

For one actor, open Foundry's sheet configuration from the window's header menu (⋮) and choose the OSE sheet. To stop using this sheet everywhere, disable the module in **Manage Modules**. TODO(verify): exact name of Foundry's sheet-configuration control in v13 and v14.

## Why can't I change my class?

Only a GM can set a character's class. Ask your GM to pick it in the Edit Character window.

## Where's the Level Up button?

It isn't available yet. To level up, raise **Level** in the Edit Character window. The window then shows your class's defaults for the new level beside **Next Level**, **Hit Dice**, **THAC0** and the saves; where your value differs, click the default to apply it. Roll your new hit points with the **HD** stamp and update **Max HP** yourself.

## Why don't I have a Spells tab?

Your character isn't marked as a spellcaster. Open the window's header menu (⋮), choose **Tweaks** and tick **Spellcaster**.

## Why isn't my weapon in the Attacks list?

Only equipped weapons appear there. Equip it on the **Inventory** tab with the hand icon.

## Why does my Hit roll not say HIT or MISS?

You don't have a target. Target a token (or use **Target** in the **Attacks** heading) and roll again.

## Why can't I see the Apply damage button?

Only a GM sees **Apply N damage** on damage cards, and only when the roll had a target.

## Why is Send Item missing from the menu?

**Send Item** needs a GM to be logged in. It also doesn't appear if you can view the sheet but not edit it.

## Why can I see another character's sheet but not change anything?

Foundry's ownership levels decide what you get:

- **Owner:** the full sheet, fully editable.
- **Observer:** the full sheet, read-only. Rolls that only post to chat (checks, saves, **Hit**, **Dmg**) still work; the **Attack** button and editing controls don't.
- **Limited:** just the name, portrait and **Biography**.

## What happens if the sheet crashes?

You'll see a "Well, this is embarrassing" screen in place of the sheet. Your character's data is not affected. From there you can:

- Click **Reopen sheet** to try again.
- Click **Use default sheet** to switch this actor to the OSE sheet.
- Click **Send bug report** to send an anonymous report. Nothing is sent unless you click it, and you can see exactly what's included first. In builds without reporting, **Copy error details** copies the error for you to paste into an issue.

![Crash screen](images/faq-crash-screen.png)

## Where do I report a bug or ask for a feature?

Open an issue on GitHub: [github.com/tasandberg/osc-character-sheet/issues](https://github.com/tasandberg/osc-character-sheet/issues).

It helps to include:

- Your Foundry version, OSE system version and this module's version.
- What you did, what you expected, and what happened instead.
- A screenshot, and any red errors from the browser console (F12).
