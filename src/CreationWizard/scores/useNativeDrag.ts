import { useRef, useState, type DragEvent } from "react";

type Options<T> = {
  onStart: (item: T) => void;
  onDrop: (item: T, target: string) => void;
  onCancel: () => void;
};

const GHOST_CLASS = "osc-creation-drag-ghost";

function setUnpressedDragImage(e: DragEvent<HTMLElement>) {
  const source = e.currentTarget;
  const rect = source.getBoundingClientRect();
  const clone = source.cloneNode(true) as HTMLElement;
  clone.classList.add(GHOST_CLASS);
  clone.setAttribute("aria-hidden", "true");
  clone.style.width = `${rect.width}px`;
  clone.style.height = `${rect.height}px`;
  (source.closest(".osc-creation-wizard-app") ?? document.body).appendChild(
    clone,
  );
  e.dataTransfer.setDragImage(
    clone,
    e.clientX - rect.left,
    e.clientY - rect.top,
  );
  requestAnimationFrame(() => clone.remove());
}

export function useNativeDrag<T>({ onStart, onDrop, onCancel }: Options<T>) {
  const [dragging, setDragging] = useState<T | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const dropped = useRef(false);

  const clear = () => {
    setDragging(null);
    setOver(null);
  };

  const dragProps = (item: T) => ({
    draggable: true,
    onDragStart: (e: DragEvent<HTMLElement>) => {
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", "");
      setUnpressedDragImage(e);
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
