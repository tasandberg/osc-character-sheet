---
title: Header and hit points
order: 2
summary: Name, class and level, XP, HP, AC, the HD stamp, and the Edit Character window.
tags: [header, name, class, level, xp, hp, hit points, ac, armor class, hit dice, hd, initiative, movement, edit, portrait]
---

# Header and hit points

The top of the sheet shows who your character is and how they're holding up. Most of it is read-only at a glance; you change the underlying values in the **Edit Character** window.

![Sheet header with level bar, portrait, HP and AC](images/header-overview.png)

## How do I read the header?

- **Top bar:** **Lv** and your current level, your XP with a progress bar, and the next level with the XP it needs.
- **Name and class line:** your class, level, title (if you set one) and alignment.
- **INIT:** your initiative modifier.
- **HD:** your Hit Dice formula, such as `3d8`.
- **MOVE:** your base movement. Hover it to see your **Encounter**, **Explore** and **Travel** rates, plus your encumbrance level when encumbrance is on.
- **HP:** current hit points, with **Max** beneath.
- **AC:** your Armor Class. The label beneath reads **Ascending** or **Descending**, following OSE's **Ascending Armor Class** world setting.

## How do I change my hit points?

Use the **−** and **+** buttons either side of the HP number to lose or heal 1 HP. In a narrow window the number becomes a field instead: type the new value and press Enter.

HP can't go below 0 or above your maximum. To change the maximum, use **Max HP** in the Edit Character window.

When the small pinned bar is showing (medium-width window, scrolled down), hover its HP to get the same − and + buttons.

## How do I roll my Hit Dice?

Click the **HD** stamp. OSE rolls your Hit Dice to chat, adding your Constitution modifier for each level, with at least 1 hit point per die.

The roll only goes to chat; it doesn't change your HP. Enter the result yourself as **Max HP** (and **Current HP**) in the Edit Character window.

![HD stamp hover state](images/header-hd-stamp.png)

## Why is my AC what it is?

The sheet doesn't calculate AC itself: OSE does, from your equipped armor, your Dexterity and any Armor Class bonus set in OSE's **Tweaks**. Equip or unequip armor on the [Inventory](inventory-and-encumbrance.md) tab and the AC updates straight away.

## How do I edit my character?

Click **Edit** in the top bar. In a narrow window, open the **⋮** (More actions) menu first. The **Edit Character** window saves each field as soon as you leave it; there is no separate save button. Click **Close** when you're done.

![Edit Character window](images/header-edit-character.png)

The window has these sections:

- **Identity & Vitals:** **Name**, **Class**, **Level**, **Title**, **Alignment**, **Current XP**, **Next Level**, **Hit Dice**, **Current HP**, **Max HP**, **Initiative Mod**, **THAC0** (or **Attack Bonus** with ascending AC), **Base Movement**, and the **Retainer** checkbox.
- **Ability Scores:** the six raw scores, each showing its modifier. A score below your class's minimum is flagged with "needs N+".
- **Saving Throws:** your five save targets.
- **Exploration:** your x-in-6 chances. See [Exploration](exploration.md).

Some notes:

- **Class** can only be changed by a GM. Pick a class from the list (each is tagged **SRD**, **ADV** or **CUS** for custom), or type a name to set a custom class.
- **Alignment** offers Lawful, Neutral and Chaotic, or type your own.
- Fields with a class or rule default show it underneath. If you've changed the value, the default turns into a link: click it to reset, then confirm.
- **Hit Dice** has a small d20 button that rolls the formula as written to chat, without the Constitution bonus.
- **Base Movement** is locked while **Auto-calculate movement** is ticked, because OSE works it out from your encumbrance. Untick it to enter your own.
- **Initiative Mod** shows the total including Dexterity. Your entry is stored as a bonus on top of Dexterity.

## Is there an edit mode?

No. Everyday changes happen directly on the sheet (HP, coins, equipping, spell casts), and everything else is in the Edit Character window. A few OSE options, such as **Spellcaster** and the attack and AC bonuses, live in OSE's **Tweaks** dialog: open the window's header menu (⋮) and choose **Tweaks**.

## How do I change my XP or level?

Open the Edit Character window and change **Current XP** or **Level**. **Next Level** shows your class's XP-table value as its default. There's no level-up flow yet, so you change these by hand.

## How do I change my portrait?

Click the portrait to open the **Portrait & token image** window. Choose an image for the portrait and token together, or untick **Use same image for portrait and token** to set them separately. Tick **Update tokens already on scenes** if placed tokens should change too, then click **Save**.

You can also drag an image from Foundry's file browser and drop it on the sheet; the same window opens with that image ready. Dropping image files from your computer works only when the GM has turned on **Portrait image uploads** (see [Settings](settings.md)).

If the Token Variant Art module is active, right-click the portrait to open its art picker.

## How do I rest and recover?

Click **Rest** in the top bar. The **Rest** window has three parts, each done by hand:

- **Provisions:** **Eat Ration** removes one ration from your inventory (any item with "ration" in its name). It also shows how many days of rations you have left and how long since you last ate.
- **Rest:** **Roll 1d3** rolls the recovery die for a full day's rest and adds it to your HP, up to your maximum.
- **Study:** for casters, **Study** restores your spells (see [Spells](spells.md)).
