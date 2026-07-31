// Tailwind class strings for abilities markup rendered from more than one file.
// The semantic `osc-*` name leads each string and stays on the element.
//
// Every utility carries the `tw:` prefix — Foundry ships its own `.flex`,
// `.hidden` and `.active`, and an unprefixed utility both collides and fails to
// compile.

/** Italic serif aside — the INT literacy/spoken line and the "no abilities yet"
 *  placeholder are typographically the same thing. */
export const FLAVOUR =
  "osc-flavour tw:mt-3 tw:mb-0 tw:font-serif tw:text-sm tw:italic tw:leading-normal tw:text-text-mute";
