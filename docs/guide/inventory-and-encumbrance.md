---
title: Inventory and encumbrance
order: 5
summary: Add, equip, sort and nest items, track coins and treasure, read encumbrance and movement, and pass items to other characters.
tags: [inventory, items, equip, containers, drag and drop, coins, treasure, gems, encumbrance, movement, slots, send item, item piles, consume, rations]
---

# Inventory and encumbrance

Everything your character carries is on the **Inventory** tab. From top to bottom it shows the encumbrance readout, **Treasure**, **Equipped items** and **All Items**.

![Inventory tab overview](images/inventory-overview.png)

## How do I add an item?

- **From the sidebar or a compendium:** drag the item onto the sheet.
- **A whole folder:** drag an Item folder from the sidebar onto the sheet to add every item in it, including subfolders.
- **A new blank item:** click **+** (Add item) in the **All Items** heading and choose **Weapon**, **Armor**, **Item** or **Container**. The new item's sheet opens so you can fill it in.

## How do I open, use or delete an item?

- Click an item's name to open its item sheet.
- Right-click an item for its menu: **View Item**, **Send Item**, **Unequip**, **Consume one** and **Delete Item**. Only the entries that apply to that item appear.
- Items with a quantity, such as arrows or torches, show a row of pips under the name. Click the pips or **Use** to use one. The quantity never goes below 0.

Deleting a container doesn't delete what's inside it; its contents move to the top level.

## How do I equip and unequip?

- Click the hand icon in the **Equip** column. An outlined hand means unequipped; a filled hand means equipped.
- Or drag an item from **All Items** up into the **Equipped items** tray.

To unequip, click the hand again, right-click the item and choose **Unequip**, or drag its tile out of the tray and down into the list.

Equipped items appear as tiles in the **Equipped items** tray. Hover a tile to see the item's stats; click it to open the item sheet. Drag tiles sideways to reorder the tray.

Equipping an item that's inside a container takes it out of the container. Putting an equipped item into a container unequips it. A message tells you when either happens.

![Equipped items tray with a tile hovered](images/inventory-equipped-tray.png)

## How do I reorder and sort the list?

Drag an item by its row. A line shows where it will land; let go to drop it there.

To sort, click a column heading: **Item**, **Type**, or **Wt** (**Slots** with item-based encumbrance). Click the same heading again to reverse the order. Sorting rearranges your saved order, so you can still drag items afterwards and they stay where you put them.

## How do I use containers?

- Drag an item onto a container's row to put it inside.
- Click the arrow on the container's row to show or hide its contents. Containers start collapsed. The number next to the name is how many items are inside.
- To take an item out, drag it from inside the container onto a row at the top level.

## How do I track coins and treasure?

The **Treasure** bar shows colored coin markers, your total wealth in gp, and how much it weighs (or how many slots it takes). Click it to open the treasure table, and **Done** to close it.

- **Coins:** type a new amount in the **Qty** field and press Enter or click away.
- **Gems, jewelry and other valuables:** the quantity is read-only here. Click the name to change it in the item sheet.
- Click a column heading (**Item**, **Qty**, **Weight (cn)** or **Slots**, **Value (gp)**) to sort. Drag rows to reorder them.

Any item marked as treasure in OSE lands here instead of in **All Items**. The sheet recognizes coins by name, for example "GP", "Gold (gp)" or "Gold Pieces". If you have no treasure yet, the section invites you to drop some in.

![Treasure table open with coins and a gem](images/inventory-treasure.png)

## How do I read encumbrance?

When encumbrance is on (OSE's **Encumbrance** world setting is anything but **Disabled**), a readout sits next to the **Inventory** heading:

- On the left, your movement rates for encounter, exploration and travel, colored by how encumbered you are.
- On the right, your load against your limit, for example `400 / 1600 cn`.

The line under the heading doubles as a load bar, changing color as you cross each threshold. Hover the movement rates to see the **Encounter**, **Explore** and **Travel** rates with your encumbrance level: **Unencumbered**, **Lightly encumbered**, **Heavily encumbered**, **Severely encumbered** or **Overloaded**. The same breakdown appears when you hover **MOVE** in the header.

The sheet uses OSE's own encumbrance calculation, so it follows whichever mode the GM has chosen:

- **Basic:** only treasure and armor slow you down. The hover breakdown also shows your armor as **Light** or **Heavy**.
- **Detailed** and **Complete:** your load is measured in coins of weight (cn).
- **Item-based:** items take slots instead of weight. Coins and gems count 100 to a slot across your whole hoard, so their rows show a dash. The **Equipped items** heading shows your equipped slots against the equipped limit.

For what each mode means, see the [Old-School Essentials SRD](https://oldschoolessentials.necroticgnome.com/srd/).

![Encumbrance readout with movement hover](images/inventory-encumbrance.png)

## Why isn't my movement changing with my load?

OSE only works out movement from encumbrance when **Auto-calculate movement** is ticked. Find it under **Base Movement** in the Edit Character window (click **Edit** in the top bar).

## How do I give an item to another character?

Right-click the item and choose **Send Item**. A **Send** window opens for that item, listing the characters whose tokens are visible in the current scene and aren't hostile.

1. For a stack, choose how many to send.
2. Click the character to send to, then **Send**.

Sending a container sends everything inside it too. Sending to a character you don't own goes through the GM, so a GM must be logged in; **Send Item** doesn't appear in the menu when no GM is connected.

## Does it work with Item Piles?

Rows in **All Items**, the **Equipped items** tray and the **Treasure** table carry standard Foundry item data when you drag them, so you can drag them into Item Piles. TODO(verify): which Item Piles drop targets (pile token, canvas, trade window) work, and whether the item leaves the sheet.

## How do I make an item macro?

Drag the item's row onto Foundry's macro hotbar. OSE creates a macro for it.
