# Guide images

Screenshots referenced by the guide pages, to be captured by the e2e suite into `docs/guide/images/`. Use a level 3 Fighter ("test character") with a portrait, unless a row says otherwise. Default theme (Dark) and **Medium** font size unless stated.

| File | Page | Sheet state to capture |
| --- | --- | --- |
| `getting-started-sheet.png` | getting-started | Whole sheet window, wide layout, **Actions** tab, a freshly created character with class, scores and HP filled in. |
| `getting-started-layouts.png` | getting-started | Same character at three window widths side by side: narrow (bottom tab bar), medium (right tab rail), wide (left column with Saves/Exploration, tabs across the top). |
| `header-overview.png` | header-and-hit-points | Top bar and header only: level/XP bar part-way to next level, portrait, name, class line with title, INIT/HD/MOVE, HP below max, AC. |
| `header-hd-stamp.png` | header-and-hit-points | Close crop of INIT/HD/MOVE with the pointer hovering the **HD** stamp (roll affordance visible). |
| `header-edit-character.png` | header-and-hit-points | **Edit Character** window open, Identity & Vitals section, one field overridden so its reset link shows. |
| `abilities-plaques.png` | abilities-and-saves | The six ability plaques at the top of **Actions**; WIS modifier non-zero. |
| `abilities-saves.png` | abilities-and-saves | **Saving Throws** band on the **Actions** tab (medium width) with the **+1 vs Magic** tag visible. |
| `attacks-list.png` | attacks | **Attacks** section with two equipped weapons, one melee+missile (mode toggle visible), and a hostile token targeted so the heading shows its name and the clear (×) button. |
| `attacks-chat-cards.png` | attacks | Chat log, as GM: a **Hit** card showing **HIT** vs the target and a **Dmg** card with the **Apply N damage** button. |
| `inventory-overview.png` | inventory-and-encumbrance | Full **Inventory** tab, Detailed encumbrance: readout, collapsed Treasure bar, Equipped items tray with 3+ tiles, All Items with an expanded container holding 2 items and a stackable item showing use pips. |
| `inventory-equipped-tray.png` | inventory-and-encumbrance | **Equipped items** tray with the pointer hovering a weapon tile so its stats popover shows. |
| `inventory-treasure.png` | inventory-and-encumbrance | Treasure table open: gp, sp and cp coin rows plus one gem, totals row and **Done** button. |
| `inventory-encumbrance.png` | inventory-and-encumbrance | Encumbrance readout with a Lightly encumbered load, pointer hovering the movement rates so the Movement popover shows. |
| `spells-memorized.png` | spells | **Spells** tab, memorization mode, level 3 Magic-User: Level 1 with two memorized spells (one spent), Spellbook expanded showing **Memorize** buttons. |
| `spells-free-casting.png` | spells | **Spells** tab with **Disable spell memorization** on: Lv pills, Level 1 with one slot used, one spell starred as favorite. |
| `retainers-sheet.png` | retainers | Retainer character (teal accent) on **Actions**, showing the **Retainer** row with Loyalty and Wage set. |
| `exploration-checks.png` | exploration | **Exploration** list on the **Actions** tab (medium width) with one non-default chance, e.g. Find Secret Door 2-in-6. |
| `settings-preferences.png` | settings | **Preferences** window open from the cog: Theme, Font size, Spell images. |
| `faq-crash-screen.png` | faq-and-troubleshooting | Crash fallback screen triggered via `game.modules.get("osc-character-sheet").api.crashTest()`, showing **Reopen sheet** and **Use default sheet**. |
