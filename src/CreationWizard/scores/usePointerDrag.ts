import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type MouseEvent as ReactMouseEvent,
} from "react";

const DRAG_THRESHOLD = 6;

type Pending<T> = {
  item: T;
  pointerId: number;
  startX: number;
  startY: number;
  source: HTMLElement;
};

export type DragGhost = { x: number; y: number };

type Options<T> = {
  onStart: (item: T) => void;
  onDrop: (item: T, target: string) => void;
  onCancel: () => void;
};

const targetAt = (x: number, y: number) =>
  document
    .elementsFromPoint(x, y)
    .map((el) => el.closest<HTMLElement>("[data-drop-target]"))
    .find((el): el is HTMLElement => !!el)?.dataset.dropTarget ?? null;

export function usePointerDrag<T>({ onStart, onDrop, onCancel }: Options<T>) {
  const pending = useRef<Pending<T> | null>(null);
  const active = useRef(false);
  const suppressClick = useRef(false);
  const [dragging, setDragging] = useState<T | null>(null);
  const [ghost, setGhost] = useState<DragGhost | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const overRef = useRef<string | null>(null);

  const finish = useCallback(() => {
    pending.current = null;
    active.current = false;
    overRef.current = null;
    setDragging(null);
    setGhost(null);
    setOver(null);
  }, []);

  useEffect(() => {
    if (dragging === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      e.stopPropagation();
      suppressClick.current = true;
      finish();
      onCancel();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [dragging, finish, onCancel]);

  const dragProps = (item: T) => ({
    onPointerDown: (e: ReactPointerEvent<HTMLElement>) => {
      if (e.button !== 0 || pending.current) return;
      pending.current = {
        item,
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        source: e.currentTarget,
      };
    },
    onPointerMove: (e: ReactPointerEvent<HTMLElement>) => {
      const p = pending.current;
      if (!p || p.pointerId !== e.pointerId) return;
      if (!active.current) {
        if (
          Math.hypot(e.clientX - p.startX, e.clientY - p.startY) <
          DRAG_THRESHOLD
        )
          return;
        active.current = true;
        p.source.setPointerCapture(e.pointerId);
        setDragging(p.item);
        onStart(p.item);
      }
      setGhost({ x: e.clientX, y: e.clientY });
      const target = targetAt(e.clientX, e.clientY);
      if (target !== overRef.current) {
        overRef.current = target;
        setOver(target);
      }
    },
    onPointerUp: (e: ReactPointerEvent<HTMLElement>) => {
      setTimeout(() => {
        suppressClick.current = false;
      });
      const p = pending.current;
      if (!p || p.pointerId !== e.pointerId) return;
      if (!active.current) {
        pending.current = null;
        return;
      }
      suppressClick.current = true;
      const target = targetAt(e.clientX, e.clientY);
      finish();
      if (target === null) onCancel();
      else onDrop(p.item, target);
    },
    onPointerCancel: () => {
      const wasActive = active.current;
      finish();
      if (wasActive) onCancel();
    },
    onClickCapture: (e: ReactMouseEvent<HTMLElement>) => {
      if (!suppressClick.current) return;
      suppressClick.current = false;
      e.preventDefault();
      e.stopPropagation();
    },
  });

  return { dragProps, dragging, ghost, over };
}
