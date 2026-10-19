import { useEffect, useState } from "react";

export type Loaded<T> =
  { status: "loading" } | { status: "ready"; detail: T } | { status: "failed" };

export function useCompendiumDetail<T>(
  name: string,
  load: (name: string) => Promise<T>,
) {
  const [state, setState] = useState<Loaded<T>>({ status: "loading" });
  useEffect(() => {
    let live = true;
    load(name).then(
      (detail) => live && setState({ status: "ready", detail }),
      () => live && setState({ status: "failed" }),
    );
    return () => {
      live = false;
    };
  }, [name, load]);
  return state;
}
