let payload: string | null = null;
let retainers = 0;
let readers: AbortController | null = null;

const read = (event: Event) => {
  const data = (event as DragEvent).dataTransfer?.getData("text/plain");
  if (data) payload = data;
};

const forget = () => {
  payload = null;
  readers?.abort();
  readers = null;
};

const remember = (event: DragEvent) => {
  forget();
  readers = new AbortController();
  for (const node of event.composedPath())
    node.addEventListener("dragstart", read, { signal: readers.signal });
};

export function cachedDragPayload(): string | null {
  return payload;
}

export function retainDragPayloadCache(): () => void {
  if (retainers++ === 0) {
    document.addEventListener("dragstart", remember, { capture: true });
    document.addEventListener("dragend", forget, { capture: true });
    document.addEventListener("drop", forget);
  }
  return () => {
    if (--retainers > 0) return;
    document.removeEventListener("dragstart", remember, { capture: true });
    document.removeEventListener("dragend", forget, { capture: true });
    document.removeEventListener("drop", forget);
    forget();
  };
}
