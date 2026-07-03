# OSC Sheet Data Models

Reference for designers/prototypers. Describes the data the OSE character sheet renders so
mockups use real field names, value sets, and shapes. The game system is **OSE** (Old-School
Essentials), a B/X-style D&D ruleset — old-school, low numbers, ascending *and* descending AC.

**Data flow:** Foundry actor (`actor.system.*`, persistent) → **view-models** (derived, what the
UI actually consumes) → React components. Design against the view-models; they're the contract.

---

## Character identity

| Field | Type | Notes |
|---|---|---|
| `name` | string | character name |
| `img` | string | portrait image URL |
| `classLabel` | string | "Fighter", "Magic-User", "Cleric", "Thief", "Elf", "Dwarf"… |
| `level` | number | 1–14 typically |
| `alignment` | string | **Lawful / Neutral / Chaotic** (OSE uses 3, not 9) |
| `title` | string | level-based epithet (e.g. "Veteran", "Swordmaster") |

## Vitals (HP / AC / movement pill)

- `hp: { value, max }` — small numbers (1st level ≈ 1–8 HP)
- `ac: { ascending, descending }` — **both shown.** Ascending (AAC, base 10, higher = better) and
  descending (AC, base 9, lower = better). Same armor, two scales.
- `hd` — hit-dice formula string, e.g. `"1d8+1"`, `"3d6"`
- `initMod` — initiative modifier (small, ±2)
- `move` — base movement in **feet** per encounter (e.g. 120)
- `moveBands: { encounter, explore, travel }` — three speeds derived from base (encounter is
  fastest/combat, travel is overland). Drops as encumbrance rises.

---

## Ability scores

Six scores, fixed order/keys: **`str` `dex` `con` `int` `wis` `cha`**.

Per ability (`AbilityVM`): `value` (raw, 3–18), `mod` (derived −3…+3), `modLabel` (`"+1"`, `"−2"`,
`"+0"` — always signed), `label` (`"STR"`…), `key`.

Modifiers are sparse on the old-school curve: 3→−3, 4–5→−2, 6–8→−1, **9–12→0**, 13–15→+1, 16–17→+2,
18→+3. Most scores give **+0**. Design for a +0-heavy column, not a D&D-5e spread.

Score-specific extras (shown as sub-stats if surfaced): STR open-doors, INT literacy/languages,
DEX initiative, CHA loyalty / max-retainers / reaction.

## Saving throws

Five saves, fixed keys (`OSESave`): **`death` `wand` `paralysis` `breath` `spell`**.
Labels: Death, Wand, Paralysis, Breath, Spell. Each `SaveVM` has `target` (number to roll ≥ on
d20), `icon`, `label`. Targets come from class+level tables.

## Exploration skills

Six, keys: `ld` `od` `sd` `ft` `forage` `hunt`.
Labels: Listen at Door, Open Stuck Door, Find Secret Door, Find Trap, Forage, Hunt.
Each `ExplorationVM` has `inSix` — an **X-in-6** chance (e.g. `2` = 2-in-6). `simple: true` for
forage/hunt (plain d6); others are OSE-modeled. Display as "2-in-6" or pips out of 6.

---

## Attacks (equipped weapons)

`AttackVM` per equipped weapon: `name`, `img`, `qualities[] {label, icon}`, and `modes[]`.

A weapon can be **melee, missile, or both** — each is an `AttackMode`:
- `kind` / `kindLabel` — "melee" | "missile"
- `hitDisplay` — always-signed to-hit, e.g. `"+2"`, `"+0"`
- `hitTip` — full formula, e.g. `"1d20 + 1 (dex)"`
- `dmgDisplay` — damage, e.g. `"1d6+0"`
- `dmgTip` — `"1d6 + 1 (str)"`

Both hit and dmg are clickable roll pills. A bow shows two rows (melee+missile only if it has
both); most weapons show one.

## Spells

Gated by `spells.enabled` (fighters/thieves have no spells — hide the tab). Organized **by level**
(1–6 typically). Per `SpellLevelVM`:
- `level`
- `slots: { used, max }` — `max` = capacity at this level; `used` = casts still ready
- `occupied` — filled slots (sum of memorized; persists across casting)
- `prepared: OseSpell[]` — memorized spells (incl. fully-spent ones, shown greyed)
- `spellbook: OseSpell[]` — all known spells at this level

A spell (`OseSpell.system`): `lvl`, `range` (`"150'"`, `"self"`), `duration` (`"1 turn"`,
`"permanent"`), `save` (`"vs spells"`), optional `damage`, `memorized` (count prepared),
`cast` (casts remaining, decrements). Vancian prep: prepare N copies, each cast spends one.

## Features / abilities

`FeatureVM` — class/race abilities (not items in inventory): `name`, `img`, `description` (HTML),
`requiresLabel` (e.g. "Elf", "Magic-User" — group by this), `rollable` + `rollTag`
(e.g. `"1d6 ≤2"` or `"1d6"`). Note: OSE has **no race/class split** — group by requirement slug.

---

## Inventory & items

Each `InventoryItemVM`:

| Field | Type | Notes |
|---|---|---|
| `name`, `img` | string | `monogram` = 2-letter fallback when no image |
| `category` | string | **"Weapon" / "Armour" / "Gear" / "Container"** |
| `categoryRank` | number | sort order: weapon 0, armour 1, gear 2, container 3 |
| `damage` | string | weapon die `"1d8"`; empty otherwise |
| `armorClass` | `{label, value}` \| null | armor items only |
| `tags` | `{label, icon}[]` | item tags (deduped) |
| `weight` | number | cumulative for containers |
| `cost` | number | in **gp** |
| `quantity` | `{value, max}` \| null | null when qty 1 and no max; else stack/charges |
| `equipped` | boolean \| null | null = type can't be equipped |
| `isContainer` | boolean | |
| `children` | `InventoryItemVM[]` | nested items (containers only) |

**Item types:** `weapon`, `armor`, `item` (gear), `treasure` (coins), `container`, `spell`,
`ability`.

**Structure:** flat list where containers carry nested `children` (one level of nesting via
`containerId`). A separate **equipped tray** shows `equipped === true` items, independently
orderable (`equippedSort`). Sortable by manual / category / name / weight.

### Coins

Denominations (`CoinVM.denom`): **PP, GP, EP, SP, CP** (platinum/gold/electrum/silver/copper).
Each has a `value` (qty). Coins are backed by treasure items and **count toward encumbrance**.

### Encumbrance (`EncumbranceVM`)

- `enabled` — may be off entirely
- `value` / `max` — current vs max carried weight
- `pct` — 0–1 for the bar
- `status` — **Unencumbered (0–50%) / Lightly encumbered (50–75%) / Heavily encumbered
  (75–100%) / Overloaded (>100%)**
- `move` — current movement (ft), reduced by encumbrance tier

Design the bar with four tiers/colors keyed to `status`.

---

## Tabs

| Tab | Renders |
|---|---|
| **Actions** | abilities (6 plaques), attacks table, prepared spells, saves grid, exploration grid |
| **Inventory** | equipped tray, full item list (containers + children), coins, encumbrance bar |
| **Spells** | per-level panels + spellbook (hidden when `spells.enabled` is false) |
| **Abilities** | features/class abilities grouped by requirement |
| **Notes** | biography / freeform notes |

---

## Design cues from the ruleset

- **Numbers are small.** AC ~ 9–19, HP ~ 1–40, to-hit ±0–3, saves 7–17. No big modifiers.
- **+0 is the norm** for ability mods — don't over-emphasize modifier columns.
- **Dual AC** (ascending + descending) is a real, both-shown OSE quirk.
- **3 alignments**, not 9. **X-in-6** skills, not percentages.
- Vancian spells: prepare-then-spend, slots per level.
