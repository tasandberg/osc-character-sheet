import { Monogram } from "@ui/Monogram";

/** Inventory thumbnail: the item's art in an ink-black rounded square, or a
 *  monogram fallback. Shared by item rows and the wealth coin table so coins get
 *  identical treatment. Owns the `.osc-inv-img` box; routes the art-or-letter
 *  branch through Monogram. The inner <img> is `draggable={false}` so grabbing it
 *  doesn't start a native image-drag — the whole row owns the drag. */
export function ItemImage({ img, monogram }: { img: string; monogram: string }) {
  return (
    <span className="osc-inv-img" aria-hidden="true">
      <Monogram
        img={img}
        monogram={monogram}
        className={img ? "" : "mono"}
        draggable={false}
      />
    </span>
  );
}
