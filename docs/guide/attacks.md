---
title: Attacks
order: 4
summary: Get weapons onto the Attacks list, roll to hit and for damage, pick targets, and make full attack rolls.
tags: [attacks, weapons, hit, damage, target, targeting, attack roll, melee, missile, macro, hotbar, apply damage]
---

# Attacks

Your attacks are on the **Actions** tab, under **Attacks**. For the combat rules, see the [Old-School Essentials SRD](https://oldschoolessentials.necroticgnome.com/srd/).

![Attacks list with a targeted token](images/attacks-list.png)

## How do I get a weapon onto the Attacks list?

Equip it. Every equipped weapon that can be used in melee, as a missile, or both, gets a row. Equip weapons with the hand icon on the **Inventory** tab (see [Inventory and encumbrance](inventory-and-encumbrance.md)).

Each row shows the weapon's damage die and its qualities as tags. Click the weapon's name to open its item sheet.

## How do I choose melee or missile?

A weapon that works both ways (a dagger, say) shows two small icons: a sword for melee and a bow for missile. Click one to switch. **Hit**, **Dmg** and **Attack** then use that mode. Melee adds your Strength modifier to hit and damage; missile adds your Dexterity modifier to hit only.

## How do I roll to hit or for damage?

- Click **Hit** to roll a d20 with your modifiers. The number on the button is your total modifier.
- Click **Dmg** to roll the weapon's damage. The number on the button is your damage modifier.

Hover either button to see how the total breaks down, for example `1d20 + 1 (str) + 1 (weapon)`. The figures follow OSE's own attack maths, including the **Tweaks** melee and missile bonuses and the settings for ignoring the weapon bonus on damage.

Each roll posts a card to chat. These buttons roll straight away, with no dialog.

## How do I target someone?

Click **Target** in the **Attacks** heading. The **Choose a target** window lists the visible tokens in the current scene, hostile ones first, with each token's disposition. Click one to target it.

You can also target a token on the canvas the usual Foundry way. Either way, the heading then shows the target's name. Click **×** (Clear target) to drop it.

## What changes when I have a target?

- A **Hit** card says **HIT** or **MISS** against the target's AC. A natural 1 always misses and a natural 20 always hits.
- A **Dmg** card names the target and gives the GM an **Apply N damage** button. Clicking it takes that much HP off the target, once; the button then shows **Applied**. Players don't see the button.

Without a target, the cards just show the roll.

![Hit and damage chat cards against a target](images/attacks-chat-cards.png)

## What does the Attack button do?

**Attack** makes OSE's own attack roll for the weapon in its current mode, the same roll the OSE sheet makes. If you have more than one token targeted, OSE rolls once per target.

Hold Ctrl (Cmd on a Mac) as you click to skip OSE's dialog. The **Attack** button is grayed out if you can view the sheet but not edit it.

## What does "Prompt for target" do?

If the GM turns on the **Prompt for target** world setting, clicking **Hit**, **Dmg** or **Attack** with no target opens a window asking you to choose one first. Pick a token, or click **Roll … without target** to roll anyway.

## How do I make an attack macro?

Drag the weapon's image or its **Attack** button onto Foundry's macro hotbar. OSE creates an attack macro for that weapon, just as it does when you drag the item from the inventory.

## Where are my class abilities?

Abilities you favorite on the **Abilities** tab (with the star) appear on the **Actions** tab under **Abilities**. Click one to roll it, or to post it to chat if it has no roll.
