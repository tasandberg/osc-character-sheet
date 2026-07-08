# OSE Level-Up Rules & Computed-vs-Stored Decisions (OSC-25)

Spec foundation for the Level Up project. Blocks OSC-46 (wizard UX), OSC-47
(`classRules`→`oseRules`), OSC-48 (calc module). This doc + the fixture table at
`src/OscSheet/domain/oseRules/__fixtures__/levelUp.fixtures.ts` are the contract the
OSC-48 calc must satisfy. **No app UI here** — advancement rules and the
computed-vs-stored map only.

## Source data

All progression ships as data in the `ose` system and is surfaced at runtime as
`CONFIG.OSE.classes.classic`:

- `ose-foundry-core/src/module/classes/classic-fantasy-classes.ts` — the 7 classic classes
  (Cleric, Dwarf, Elf, Fighter, Halfling, Magic-User, Thief).
- `ose-foundry-core/src/module/classes/types.ts` — the `OseClass` shape. Each
  `levels[level-1]` row = `{ xp, hd, thac0, saves[5], spells?[] }`.
- Saves array order is `[death, wand, paralysis, breath, spell]`
  (`src/OscSheet/domain/classRules.ts` `SAVE_ORDER`).

**Confirmed: the system ships NO `CONFIG.OSE.classes.advanced`.** `config.ts:41-43`
registers only `classic`. `classRules.ts` probes `advanced` defensively (for the Advanced
Fantasy tome, if ever installed) but it is absent today. Max level and all progression come
from `classic` only.

## Advancement model (settled — do not relitigate)

- **Class drives ALL progression** — XP thresholds, HD, saves, THAC0, prime-req, spell slots.
- **Max level = class table length** (`levels.length`). NO racial level limits, NO
  multiclass. (Halfling caps at 8, Elf at 10, Dwarf at 12, the rest at 14 — purely because
  that's how many rows each table ships.)
- **Prime-requisite XP bonus is DEFERRED to Character Creation.** `system.details.xp.bonus`
  stays a manual %. The wizard does not touch it.
- A thin `domain/oseRules/resolveAdvancementSource` stays CC/Rest-agnostic (collapses to
  "use the class") for reuse.

## The system automates nothing

`level`, `xp.*`, `hp.max/hd`, `saves.*`, `thac0.*`, `spells.<lvl>.max` are all **stored,
hand-typed** fields on `actor.system`. `prepareDerivedData` rebuilds only
scores/encumbrance/movement/ac and reshapes spells — never advancement stats
(`data-model-character.js`). The system's `rollHP()` (`entity.js:181`) re-rolls the *entire*
HD string and overwrites max, with no CON and no min-1 — the wrong primitive for a level-up
delta. So the wizard/calc owns the advancement math and writes the results.

## Fields the wizard writes (computed → stored)

One atomic `updateActor` diff (flat dot-paths). All are **source** paths (what you write);
some read back through derived data under a different shape (noted).

| Computed value | Write path | Source | Notes |
|---|---|---|---|
| New level | `system.details.level` | = `toLevel` | |
| XP-to-next | `system.details.xp.next` | `levels[toLevel].xp` | threshold for `toLevel+1`; **null/omit at max level** (`levels[toLevel]` undefined) |
| Hit-dice formula | `system.hp.hd` | `levels[toLevel-1].hd` | e.g. `"5d6"`, `"9d8+2"` |
| Max HP | `system.hp.max` | prev max + HP delta | delta rules below |
| Saves (×5) | `system.saves.{death,wand,paralysis,breath,spell}.value` | `levels[toLevel-1].saves[i]` | order `[death,wand,paralysis,breath,spell]` |
| THAC0 (descending) | `system.thac0.value` | `levels[toLevel-1].thac0` | |
| Base attack bonus (ascending) | `system.thac0.bba` | `19 - thac0` | canonical OSE relation, `entity.js:57,156` |
| Spell slots | `system.spells.<lvl>.max` | `levels[toLevel-1].spells[lvl-1]` | see spell-slot sourcing below |

**Not written:** `system.hp.value` (current HP — advancement raises max, not current, unless
the sheet chooses to also heal-to-full; that is a wizard UX call, not a rule),
`system.details.xp.value` (XP is awarded, not spent), `system.details.xp.bonus` (prime-req,
deferred to CC).

### THAC0 / bba

The table's `thac0` is the descending THAC0. The OSE actor stores both the descending value
and the ascending `bba`, always related by `bba = 19 - thac0` (`entity.js:57`, `:156`;
verified in `entity-actor.test.ts`). Write both from the single table value.

### Spell-slot sourcing

`levels[].spells` is an array indexed by spell level − 1: `spells[0]` = level-1 slots,
`spells[1]` = level-2 slots, … Magic-User rows carry **6** entries (spell levels 1-6);
Cleric and Elf carry **5** (levels 1-5). Map each entry to `system.spells.<lvl>.max`
(`lvl = index + 1`).

**Storage vs read shape:** you *write* `system.spells.<lvl>.max` (numeric level key at the
`spells` root — the source shape in `template.json` `spellcaster.spells`). The data model
rebuilds a *derived* `system.spells.slots.<n>.{used,max}` for display
(`data-model-character-spells.ts`); never write to `slots`. Non-casters (Fighter, Dwarf,
Halfling, Thief) have no `spells` array — write nothing.

Info-only: newly-available spell *levels* (a slot count going 0→N) can be surfaced as "new
at level N" text, but the wizard does **not** auto-add spell/ability Items — those live in
`classicfantasycompendium` and are added manually (settled scope).

## HP delta model

A level-up adds HP; it never re-rolls existing HD. Two regimes, split at the **name-level
threshold** (the last level at which the class gains a *new* full hit die).

**Below/at name level** (`toLevel <= nameLevel`, HD count increases):
- Gain **one new die** of the class's HD type + the character's **CON modifier**
  (`system.scores.con.mod`): `delta = dieResult + conMod`. **No min-per-level floor** —
  matches OSE system behavior (`rollHP` enforces none); a penalty CON can yield a small or
  negative delta.
- HP mode is a UX choice: **roll** the die, or take its **average**. Averaging rounding is
  an OSC-48 decision (flagged below) — this spec pins the roll path; fixtures cover roll +
  the flat path.

**Above name level** (`toLevel > nameLevel`, HD count capped):
- Gain a **flat** amount per level, **CON no longer applies**.
- The flat amount is the per-level increment of the HD string's constant term (e.g. Fighter
  `9d8` → `9d8+2` → `9d8+4` = +2/level). Enumerated per class below.

CON modifier thresholds (OSE `standardAttributeMods`,
`data-model-character-scores.ts:47`): 3→−3, 4-5→−2, 6-8→−1, 9-12→0, 13-15→+1, 16-17→+2,
18→+3.

### Per-class name-level thresholds (derived, NOT in `OseClass`)

`OseClass` does not carry a name-level field, so the sheet hardcodes this small table.
Derived directly from where each `hd` string stops adding dice and starts adding a flat pip:

| Class | HD | Name level (last die) | Max level | Flat HP/level after name level |
|---|---|:--:|:--:|:--:|
| Cleric | d6 | 9 | 14 | +1 |
| Dwarf | d8 | 9 | 12 | +3 |
| Elf | d6 | 9 | 10 | +2 |
| Fighter | d8 | 9 | 14 | +2 |
| Halfling | d6 | 8 | 8 | — (no flat region; name = max) |
| Magic-User | d4 | 9 | 14 | +1 |
| Thief | d4 | 9 | 14 | +2 |

Derivation (from `classic-fantasy-classes.ts`):
- Every class reaches `9d…` at level 9 except **Halfling**, whose table ends at `8d6`
  (level 8) — so Halfling never enters the flat regime; it gains a die every level up to its
  max. Its name level (8) equals its max level.
- Flat/level = constant-term increment past the cap: Cleric `9d6→9d6+1` (+1), Dwarf
  `9d8→9d8+3` (+3), Elf `9d6→9d6+2` (+2, single step to L10), Fighter `9d8→9d8+2` (+2),
  Magic-User `9d4→9d4+1` (+1), Thief `9d4→9d4+2` (+2).

**Suggested shape for the hardcoded table** (OSC-47/OSC-48 to place under `oseRules/`):

```ts
// keyed by canonical class name
const NAME_LEVELS: Record<string, { nameLevel: number; flatHpPerLevel: number }> = {
  Cleric:       { nameLevel: 9, flatHpPerLevel: 1 },
  Dwarf:        { nameLevel: 9, flatHpPerLevel: 3 },
  Elf:          { nameLevel: 9, flatHpPerLevel: 2 },
  Fighter:      { nameLevel: 9, flatHpPerLevel: 2 },
  Halfling:     { nameLevel: 8, flatHpPerLevel: 0 }, // no flat region within cap
  "Magic-User": { nameLevel: 9, flatHpPerLevel: 1 },
  Thief:        { nameLevel: 9, flatHpPerLevel: 2 },
};
```

The flat amount is also recoverable from the table at runtime (diff the constant terms of
`levels[toLevel-1].hd` vs `levels[toLevel-2].hd`), so OSC-48 may compute it instead of
hardcoding — but `nameLevel` is not derivable without inspecting the whole HD column, so at
minimum `nameLevel` is hardcoded. Recommendation: hardcode both for clarity; the fixtures
assert the flat values regardless of source.

## XP thresholds

- `xp.next` after leveling = `levels[toLevel].xp` (the row *after* the new level = XP to
  reach `toLevel+1`). Matches `classRules.selectClassDefaults` (`nextRow = def.levels[level]`)
  and `EditModal`'s `nextXp`.
- At **max level** (`toLevel === levels.length`), `levels[toLevel]` is undefined → `xp.next`
  has no meaningful value. The calc should leave it unchanged or clear it (represented as
  `null` in fixtures). Flagged below.

## Unmatched free-text class → manual HP-only degradation

`system.details.class` is free text; there is no class Item. `classRules.findClass` fuzzy-
matches (canonicalized, hyphen/space-insensitive) against `CONFIG.OSE.classes.*`. On **no
match** (`matched: false`):

- The calc **cannot** source HD/saves/THAC0/spells. It degrades to **HP-only, manual**: the
  wizard writes `system.details.level` (incremented) and `system.hp.max` (a value the user
  enters — no die is known), and writes nothing else.
- `hd`, `saves.*`, `thac0.*`, `spells.*` are left untouched.
- Fixture `mu → unmatched (Bard)` documents this contract.

## OSE-rules decisions & open questions

1. **Min-per-level HP floor — SETTLED: none.** No min-per-level floor — matches OSE system
   behavior (`rollHP` enforces none). Delta is raw `die + conMod`, which a penalty CON can
   drive small or negative. Fixture `mu-2-3-neg-con` exercises a negative-CON delta.
2. **`xp.next` at max level — SETTLED: `null`.** `levels[toLevel]` is undefined at max level
   → write/represent `null`.
3. **Average-HP rounding (open).** If the wizard offers "take average" instead of rolling,
   the average of a dN (e.g. d6 → 3.5) needs a rounding rule (round up? standard B/X uses
   round-down-with-min? OSE tables sometimes assume `(max/2)+1`). Left to OSC-48; fixtures
   only pin the **roll** and **flat** paths to avoid prejudging. Pick a rule when OSC-48
   lands.
4. **Elf single flat step (noted).** Elf's table has exactly one post-name-level row (`9d6+2` at
   L10, its max). +2 is asserted from that single step; there is no second row to confirm the
   per-level cadence. Consistent with the class's design (max 10).
5. **Current HP on level-up (noted).** Rules raise `hp.max` only. Whether to also bump
   `hp.value` (heal the new HP, or heal to full) is a wizard UX choice, not a rule — left to
   OSC-46. Fixtures assert `hp.max` only.

## References

- `ose-foundry-core/src/module/classes/classic-fantasy-classes.ts` — class tables
- `ose-foundry-core/src/module/classes/types.ts` — `OseClass` shape
- `ose-foundry-core/src/module/config.ts:41-43` — only `classic` registered
- `ose-foundry-core/src/module/actor/entity.js:57,156,181` — `bba = 19 - thac0`; `rollHP`
- `ose-foundry-core/src/module/actor/data-model-classes/data-model-character-spells.ts` — derived slots shape
- `ose-foundry-core/src/module/actor/data-model-classes/data-model-character-scores.ts:47` — CON mod table
- `src/OscSheet/domain/classRules.ts` — fuzzy match, `SAVE_ORDER`, `selectClassDefaults`
- `src/OscSheet/features/edit/EditModal.tsx` — default/override UX the wizard extends
- `src/OscSheet/domain/types.ts` — `OSEActor.system` field shapes
- Fixtures: `src/OscSheet/domain/oseRules/__fixtures__/levelUp.fixtures.ts`
