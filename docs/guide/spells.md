---
title: Spells
order: 6
summary: Turn on spellcasting, memorize and cast spells, set spell slots, and use free-casting mode.
tags: [spells, spellcasting, memorize, memorization, cast, slots, spellbook, free casting, spell points, study, rest, favorites]
---

# Spells

Casters get a **Spells** tab. How it works depends on the world's **Disable spell memorization** setting:

- **Memorization (the default):** you memorize spells into slots each day and cast each memorized copy once.
- **Free-casting:** you can cast any spell you know, as long as you have slots left at its level.

For the spellcasting rules, see the [Old-School Essentials SRD](https://oldschoolessentials.necroticgnome.com/srd/).

## Why don't I have a Spells tab?

The tab appears only when the character is marked as a spellcaster in OSE. Open the window's header menu (⋮), choose **Tweaks**, tick **Spellcaster** and save.

## How do I add spells?

- Drag spells from the sidebar or a compendium onto the sheet.
- Or click **+** (Add spell) next to the **Spells** heading. This creates a blank level 1 spell and opens its sheet.

## How do I read a spell level?

Each level has a heading such as **Level 1**, then how many casts are ready out of your slots (for example `1 / 2`), and a row of diamonds for the slots.

Under the heading are your memorized spells. Each shows its range, duration, save and any roll formula, with pips for how many casts of it are ready.

![Spells tab in memorization mode](images/spells-memorized.png)

## How do I memorize a spell?

Click **Spellbook (N)** under a level to open the list of every spell you know at that level, then click **Memorize** next to a spell. Each click memorizes another copy, using one slot. When the level's slots are full, **Memorize** is grayed out.

To free a slot, click the trash icon (Remove) next to a memorized spell. To delete a spell from your character altogether, use the trash icon in the spellbook list instead.

## How do I cast a spell?

Click **Cast** next to a memorized spell. OSE uses up one cast and posts the spell to chat, rolling its formula if it has one. When all casts of a spell are used, its button reads **Spent**.

Memorized spells also appear on the **Actions** tab under **Memorized Spells**, so you can cast them without switching tabs.

You can also click a spell's pips to set how many casts it has left, for example to correct a mistake.

## How do I get my spells back?

Either:

- Click **Reset** next to the **Spells** heading, or
- Click **Rest** in the top bar and then **Study**.

Both restore every memorized spell to full casts. Your choice of memorized spells stays the same.

## How do I change how many slots I have?

Slots come from your class and level. To override them, click the pencil (Edit Level N slots) next to a level's count. The **Level N spell slots** window shows your class default; enter a new number and click **Save**. To go back, click the default, then **Save**.

## How does free-casting mode work?

When the GM turns on **Disable spell memorization**:

- Pick a level with the **Lv** buttons at the top of the tab.
- Every spell you know at that level has a **Cast** button. Each cast uses one of that level's slots, whichever spell you cast.
- The diamonds show the slots left at that level. Click them to set the number directly.
- When a level runs out, its spells show **Spent**. **Reset** (or **Rest** → **Study**) refills every level.
- Click the star next to a spell to make it a favorite. Favorite spells appear on the **Actions** tab under **Spells**, with the slots left at their level, so you can cast them from there.

![Spells tab in free-casting mode](images/spells-free-casting.png)

## How do I hide spell icons?

Untick **Spell images** in your preferences (the cog in the top bar). See [Settings](settings.md).
