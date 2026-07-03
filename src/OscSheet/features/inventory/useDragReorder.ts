// useDragReorder — lightweight drag-to-reorder on native HTML5 DnD, with an
// insertion-line affordance (before / after) AND container nesting (into).
//
// The "line" is never a real DOM node: rowClass() returns " drop-before" /
// " drop-after" / " drop-into" on the hovered row and CSS paints a 2px rule on
// the matching edge, so the list never reflows mid-drag. State updates fire only
// when the hovered target/edge actually changes — not every pointer frame.
//
// Reorders are constrained to a single `group` (items in different groups can't
// interleave); nesting (into / out of a container) is intentionally cross-group.
import { useState, type DragEvent } from "react";

export type DropWhere = "before" | "after" | "into";

type DragState = { group: string; idx: number };
type OverState = { group: string; idx: number; where: DropWhere };

export type ReorderArgs = { group: string; from: number; to: number; where: DropWhere; targetIdx: number; zone?: string };
export type NestArgs = { fromGroup: string; from: number; targetIdx: number; zone: string | null };

type RowOpts = {
  /** This row is also a drop-into target (a container). */
  container?: boolean;
  /** Container id reported back as the nest target's `zone`. */
  containerZone?: string;
  /** Group/zone label echoed back on reorder. */
  ownZone?: string;
  /** Accept a row dragged in from another group as a before/after drop here
   *  (used to un-nest: a nested row dropped among root rows routes through onNest
   *  with zone:null at this drop position). A predicate can restrict which source
   *  groups are accepted (e.g. exclude the equipped tray, whose drops are handled
   *  by a dedicated dropzone). */
  acceptCrossGroup?: boolean | ((fromGroup: string) => boolean);
  /** Edge-detection axis for before/after. 'y' (default) splits on clientY;
   *  'x' splits on clientX — for a horizontal (flex-wrap) row like the equipped tray. */
  axis?: "x" | "y";
  /** Override the `text/plain` drag payload (default `"<group>:<idx>"`). Used to
   *  write Foundry item drag-data so the row also drops onto the macro hotbar.
   *  Internal reorder reads its source from React state, not this, so it's safe. */
  dragPayload?: () => string | undefined;
  onStart?: () => void;
  onEnd?: () => void;
};

type Handlers = {
  draggable?: boolean;
  onDragStart?: (e: DragEvent<HTMLElement>) => void;
  onDragEnd?: (e: DragEvent<HTMLElement>) => void;
  onDragOver: (e: DragEvent<HTMLElement>) => void;
  onDrop: (e: DragEvent<HTMLElement>) => void;
};

export function useDragReorder(opts: {
  onReorder?: (a: ReorderArgs) => void;
  onNest?: (a: NestArgs) => void;
} = {}) {
  const { onReorder, onNest } = opts;
  const [drag, setDrag] = useState<DragState | null>(null);
  const [over, setOver] = useState<OverState | null>(null);
  const clear = () => { setDrag(null); setOver(null); };

  // before/after from the pointer's position within the hovered row, along `axis`
  const edgeWhere = (e: DragEvent<HTMLElement>, axis: "x" | "y"): DropWhere => {
    const r = e.currentTarget.getBoundingClientRect();
    return axis === "x"
      ? e.clientX < r.left + r.width / 2 ? "before" : "after"
      : e.clientY < r.top + r.height / 2 ? "before" : "after";
  };

  // Whether this row accepts a cross-group drop from `fromGroup`.
  const accepts = (o: RowOpts, fromGroup: string): boolean =>
    typeof o.acceptCrossGroup === "function" ? o.acceptCrossGroup(fromGroup) : !!o.acceptCrossGroup;

  // Draggable + droppable row.
  const rowProps = (group: string, idx: number, o: RowOpts = {}): Handlers => ({
    draggable: true,
    onDragStart: (e) => {
      setDrag({ group, idx });
      e.dataTransfer.effectAllowed = "move";
      const payload = o.dragPayload?.() ?? `${group}:${idx}`;
      try { e.dataTransfer.setData("text/plain", payload); } catch { /* IE guard */ }
      o.onStart?.();
    },
    onDragEnd: () => { clear(); o.onEnd?.(); },
    onDragOver: (e) => {
      if (!drag) return;
      const isSelf = drag.group === group && drag.idx === idx;
      const into = !!o.container && !isSelf; // a container accepts any item except itself
      const crossGroup = !into && drag.group !== group;
      // Reorder only within the same group, unless this row accepts a cross-group
      // drop (un-nest): then show a before/after line and route through onNest.
      if (crossGroup && !accepts(o, drag.group)) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      const where: DropWhere = into ? "into" : edgeWhere(e, o.axis ?? "y");
      if (!over || over.group !== group || over.idx !== idx || over.where !== where)
        setOver({ group, idx, where });
    },
    onDrop: (e) => {
      if (!drag) { clear(); return; }
      const isSelf = drag.group === group && drag.idx === idx;
      const into = !!o.container && !isSelf;
      const crossGroup = !into && drag.group !== group;
      if (crossGroup && !accepts(o, drag.group)) { clear(); return; }
      e.preventDefault();
      if (into) {
        onNest?.({ fromGroup: drag.group, from: drag.idx, targetIdx: idx, zone: o.containerZone ?? null });
      } else if (crossGroup) {
        // Un-nest: drop the foreign row among this group's rows at the drop edge.
        // No self-shift — the item leaves a different group, so `to` isn't perturbed.
        const where: DropWhere = over ? over.where : "after";
        const to = where === "after" ? idx + 1 : idx;
        onNest?.({ fromGroup: drag.group, from: drag.idx, targetIdx: to, zone: null });
      } else {
        const where: DropWhere = over ? over.where : "after";
        let to = where === "after" ? idx + 1 : idx;
        if (drag.idx < to) to -= 1; // account for the gap the removed item leaves
        onReorder?.({ group, from: drag.idx, to, where, targetIdx: idx, zone: o.ownZone });
      }
      clear();
    },
  });

  // Drop target for an empty container body (nest with no sibling rows to hover).
  const nestProps = (group: string, idx: number, zone: string | null): Pick<Handlers, "onDragOver" | "onDrop"> => ({
    onDragOver: (e) => {
      if (!drag) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      if (!over || over.group !== group || over.idx !== idx || over.where !== "into")
        setOver({ group, idx, where: "into" });
    },
    onDrop: (e) => {
      if (!drag) return;
      e.preventDefault();
      onNest?.({ fromGroup: drag.group, from: drag.idx, targetIdx: idx, zone });
      clear();
    },
  });

  // " dragging" on the source + " drop-before|after|into" on the hovered target.
  const rowClass = (group: string, idx: number): string => {
    let s = "";
    if (drag && drag.group === group && drag.idx === idx) s += " dragging";
    if (over && over.group === group && over.idx === idx)
      s += over.where === "after" ? " drop-after" : over.where === "into" ? " drop-into" : " drop-before";
    return s;
  };

  /** True when the given group/idx is the current "into" target (for container highlight). */
  const isInto = (group: string, idx: number) =>
    !!over && over.group === group && over.idx === idx && over.where === "into";

  return { drag, over, rowProps, nestProps, rowClass, isInto, clear };
}
