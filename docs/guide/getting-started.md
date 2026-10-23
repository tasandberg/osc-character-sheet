---
title: Getting started
order: 1
summary: Install and enable the module, use it as your character sheet, and set up your first character.
tags: [setup, install, enable, default sheet, first character, help]
---

# Getting started

The Enhanced Character Sheet replaces the Old-School Essentials (OSE) system's character sheet in Foundry VTT. It reads and writes the same actor data as the OSE sheet, so you can switch between them at any time without losing anything.

You need Foundry VTT v13 or later and the Old-School Essentials game system, version 2.2.2 or later.

## How do I install and enable the module?

1. In Foundry's setup screen, open **Add-on Modules** and choose **Install Module**.
2. Search for **Enhanced Character Sheet for Old-School Essentials** and install it.
3. Launch your OSE world, open **Game Settings → Manage Modules**, tick the module and save.

## How do I make it the sheet my characters use?

You don't have to do anything. Once the module is enabled, it registers itself as the default sheet:

- **Enhanced Character Sheet** for character and NPC actors.
- **Enhanced Monster Sheet** for monster actors.

Any sheet you open after enabling the module uses it.

To use a different sheet for one actor, open Foundry's sheet configuration from the window's header menu (⋮) and pick another sheet, such as the OSE system's own. TODO(verify): exact name of Foundry's sheet-configuration control in v13 and v14.

![The sheet open on a new character](images/getting-started-sheet.png)

## How do I set up my first character?

1. In the **Actors** sidebar, create an actor of type **Character** and open it.
2. Click **Edit** in the dark bar at the top of the sheet. The **Edit Character** window opens.
3. Fill in **Name**, **Level**, **Alignment** and your ability scores.
4. Choose a **Class**. Only a GM can set the class; if you're a player, ask your GM.
5. Once a class is set, the window shows that class's defaults next to **Hit Dice**, **Next Level**, **THAC0** (or **Attack Bonus**) and the saving throws. Enter **Max HP** yourself.
6. Close the window, then add equipment on the **Inventory** tab. Equip a weapon and it appears under **Attacks** on the **Actions** tab.

See [Header and hit points](header-and-hit-points.md) for everything in the Edit Character window.

If the OSR Character Builder module is active, a new character (Strength still 0) shows a **Character Builder** icon on its portrait. Click it to run the builder.

## How do I find my way around the sheet?

- The dark bar at the top shows your level and XP, plus the **Rest** and **Edit** buttons and a cog for your display preferences.
- Below it is the header: portrait, name, class line, **INIT**, **HD**, **MOVE**, **HP** and **AC**.
- The tabs are **Actions**, **Inventory**, **Spells** (casters only), **Abilities** and **Notes**.

The layout follows the window size:

- **Narrow:** the header compacts and the tabs move to a bar along the bottom.
- **Medium:** the tabs sit in a slim rail on the right edge. Once you scroll past your name, a small bar with your portrait, HP and AC stays pinned at the top.
- **Wide:** the header moves into a left column with **Saves** and **Exploration** below it, and the tabs run across the top.

![Narrow, medium and wide layouts side by side](images/getting-started-layouts.png)

## How do I open this guide?

TODO(verify): where the in-sheet help button lives once the help window ships.
