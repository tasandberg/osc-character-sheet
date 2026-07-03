import { Pips } from "./Pips";

export default { title: "Display / Pips" };

// Cast dots (size="sm") — gold when a cast remains, soft when spent.
export const CastDots = () => (
  <div className="u-stack u-gap-3">
    <Pips total={4} filled={4} size="sm" role="img" aria-label="4 of 4 casts remaining" />
    <Pips total={4} filled={2} size="sm" role="img" aria-label="2 of 4 casts remaining" />
    <Pips total={4} filled={0} size="sm" role="img" aria-label="0 of 4 casts remaining" />
  </div>
);

// Slot pips (hollow) — the filled dots carry a diamond glyph.
export const SlotPips = () => (
  <div className="u-stack u-gap-3">
    <Pips total={3} filled={3} hollow aria-hidden="true" glyph={<i className="fa-solid fa-diamond" />} />
    <Pips total={3} filled={1} hollow aria-hidden="true" glyph={<i className="fa-solid fa-diamond" />} />
  </div>
);
