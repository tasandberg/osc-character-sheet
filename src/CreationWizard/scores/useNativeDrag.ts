import { useEffect, useRef, useState, type DragEvent } from "react";

type Options<T> = {
  onStart: (item: T) => void;
  onDrop: (item: T, target: string) => void;
  onCancel: () => void;
};

const GHOST_CLASS = "osc-creation-drag-ghost";

const blankImage = () => {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  return canvas;
};

export function useNativeDrag<T>({ onStart, onDrop, onCancel }: Options<T>) {
  const [dragging, setDragging] = useState<T | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const dropped = useRef(false);
  const ghost = useRef<(() => void) | null>(null);

  const removeGhost = () => {
    ghost.current?.();
    ghost.current = null;
  };

  useEffect(() => removeGhost, []);

  const showGhost = (source: HTMLElement, e: DragEvent<HTMLElement>) => {
    removeGhost();
    const rect = source.getBoundingClientRect();
    const dx = e.clientX - rect.left;
    const dy = e.clientY - rect.top;
    const clone = source.cloneNode(true) as HTMLElement;
    clone.classList.add(GHOST_CLASS);
    clone.setAttribute("aria-hidden", "true");
    clone.style.width = `${rect.width}px`;
    clone.style.height = `${rect.height}px`;
    const place = (x: number, y: number) => {
      clone.style.transform = `translate(${x - dx}px, ${y - dy}px)`;
    };
    place(e.clientX, e.clientY);
    const follow = (ev: globalThis.DragEvent) => place(ev.clientX, ev.clientY);
    document.addEventListener("dragover", follow, true);
    (source.closest(".osc-creation-wizard-app") ?? document.body).appendChild(
      clone,
    );
    ghost.current = () => {
      document.removeEventListener("dragover", follow, true);
      clone.remove();
    };
  };

  const clear = () => {
    removeGhost();
    setDragging(null);
    setOver(null);
  };

  const dragProps = (item: T) => ({
    draggable: true,
    onDragStart: (e: DragEvent<HTMLElement>) => {
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", "");
      e.dataTransfer.setDragImage(blankImage(), 0, 0);
      showGhost(e.currentTarget, e);
      dropped.current = false;
      setDragging(item);
      onStart(item);
    },
    onDragEnd: () => {
      if (!dropped.current) onCancel();
      clear();
    },
  });

  const dropProps = (target: string) => ({
    onDragOver: (e: DragEvent<HTMLElement>) => {
      if (dragging === null) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      if (over !== target) setOver(target);
    },
    onDragLeave: (e: DragEvent<HTMLElement>) => {
      if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
      if (over === target) setOver(null);
    },
    onDrop: (e: DragEvent<HTMLElement>) => {
      if (dragging === null) return;
      e.preventDefault();
      e.stopPropagation();
      dropped.current = true;
      onDrop(dragging, target);
      clear();
    },
  });

  return { dragProps, dropProps, dragging, over };
}
