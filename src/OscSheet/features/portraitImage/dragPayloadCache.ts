let payload: string | null = null;
let retainers = 0;

const remember = (event: DragEvent) => {
  payload = event.dataTransfer?.getData("text/plain") || null;
};

const forget = () => {
  payload = null;
};

export function cachedDragPayload(): string | null {
  return payload;
}

export function retainDragPayloadCache(): () => void {
  if (retainers++ === 0) {
    document.addEventListener("dragstart", remember);
    document.addEventListener("dragend", forget);
    document.addEventListener("drop", forget);
  }
  return () => {
    if (--retainers > 0) return;
    document.removeEventListener("dragstart", remember);
    document.removeEventListener("dragend", forget);
    document.removeEventListener("drop", forget);
    forget();
  };
}
