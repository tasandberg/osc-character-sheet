import { Monogram } from "./Monogram";

export default { title: "Display / Monogram" };

// `.ft-ic` is a standalone ink-stamp icon box (a real caller class) — Monogram
// only owns the image-or-letter branch; the box styling comes from className.
export const States = () => (
  <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
    <Monogram monogram="L" className="ft-ic" />
    <Monogram monogram="D" className="ft-ic" />
    <Monogram
      img={
        "data:image/svg+xml," +
        encodeURIComponent(
          `<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40'><rect width='40' height='40' fill='#3a5a58'/><text x='20' y='27' font-size='20' text-anchor='middle' fill='#e5dec8'>S</text></svg>`,
        )
      }
      monogram="S"
      className="ft-ic"
    />
  </div>
);
