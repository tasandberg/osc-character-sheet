import { Pips } from "./Pips";

export default { title: "Display / Pips" };

// Cast dots (.sp-dots/.sp-dot) — gold when a cast remains, soft when spent.
export const CastDots = () => (
  <div className="u-stack u-gap-3">
    <Pips total={4} filled={4} className="sp-dots" dotClassName="sp-dot" role="img" aria-label="4 of 4 casts remaining" />
    <Pips total={4} filled={2} className="sp-dots" dotClassName="sp-dot" role="img" aria-label="2 of 4 casts remaining" />
    <Pips total={4} filled={0} className="sp-dots" dotClassName="sp-dot" role="img" aria-label="0 of 4 casts remaining" />
  </div>
);

// Slot pips (.slots/.rs-pip) — the filled dots carry a diamond glyph.
export const SlotPips = () => (
  <div className="u-stack u-gap-3">
    <Pips
      total={3}
      filled={3}
      className="slots"
      dotClassName="rs-pip"
      aria-hidden="true"
      glyph={<i className="fa-solid fa-diamond" />}
    />
    <Pips
      total={3}
      filled={1}
      className="slots"
      dotClassName="rs-pip"
      aria-hidden="true"
      glyph={<i className="fa-solid fa-diamond" />}
    />
  </div>
);
