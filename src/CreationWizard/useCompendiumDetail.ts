import { useEffect, useState } from "react";

export type Loaded<T> =
  { status: "loading" } | { status: "ready"; detail: T } | { status: "failed" };

type Load<T> = (name: string) => Promise<T>;

const resolved = new WeakMap<Load<unknown>, Map<string, unknown>>();

async function remember<T>(name: string, load: Load<T>): Promise<T> {
  const detail = await load(name);
  const details = resolved.get(load) ?? new Map<string, unknown>();
  resolved.set(load, details.set(name, detail));
  return detail;
}

export function warmCompendiumDetail<T>(name: string, load: Load<T>) {
  remember(name, load).catch(() => undefined);
}

export function useCompendiumDetail<T>(name: string, load: Load<T>) {
  const [state, setState] = useState<Loaded<T>>(() => {
    const details = resolved.get(load);
    return details?.has(name)
      ? { status: "ready", detail: details.get(name) as T }
      : { status: "loading" };
  });
  useEffect(() => {
    let live = true;
    remember(name, load).then(
      (detail) => live && setState({ status: "ready", detail }),
      () => live && setState({ status: "failed" }),
    );
    return () => {
      live = false;
    };
  }, [name, load]);
  return state;
}
