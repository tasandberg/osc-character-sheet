# Writing the user guide

The in-sheet guide is built from `docs/guide/*.md` at build time and ships inside each release, so it works offline and matches the installed version.

## Pages

- One page per file. The file name is the page id: `inventory.md` → `inventory`.
- `index.md` is the landing page.
- Front matter is required:

  ```yaml
  ---
  title: Inventory          # required; shown as the page heading
  order: 30                 # sidebar position, low first
  summary: One sentence.    # shown under the title
  tags: [items, weight]     # extra search words
  ---
  ```

- Don't write an `#` heading; the title comes from front matter. Start sections at `##`.

## Sections and links

- Section anchors are GitHub-style slugs of the heading: `## Equipping items` → `#equipping-items`. Renaming a heading changes its anchor, so keep headings the sheet links to (`GuideLink to="page#section"`) stable. `inventory#encumbrance` is linked from the sheet today.
- Link to another page with a relative path: `[Encumbrance](inventory.md#encumbrance)`. Same-page: `[Containers](#containers)`.
- External links must be `https:` or `mailto:`.
- Broken page or section links print a warning during `pnpm build`.

## Markdown

Plain CommonMark plus GFM tables, strikethrough, task lists and autolinks. Raw HTML is dropped. Images must be files inside `docs/guide/` (e.g. `![Load bar](images/load-bar.png)`); they are bundled into the release.

## Search

`##` and `###` headings split a page into search sections. Titles, headings, tags and body text are all searched.

## Previewing

`pnpm dev` hot-reloads the guide as you edit. Open it from the `?` button in the sheet header, or run `game.modules.get("osc-character-sheet").api.openGuide("inventory#encumbrance")` in the console.
