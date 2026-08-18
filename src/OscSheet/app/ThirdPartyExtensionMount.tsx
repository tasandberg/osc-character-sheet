import { useEffect, useRef } from "react";
import { fireHook, hasListeners } from "@domain/extensions";

/** An empty element handed to third-party modules, plus the hook that tells them
 *  it exists. React renders it empty and never reconciles its children, so DOM a
 *  module appends here survives re-renders — anywhere else in the tree does not.
 *  Renders nothing at all when no module is listening. */
export function ThirdPartyExtensionMount({
  hook,
  payload,
  className,
}: {
  hook: string;
  /** Merged with `element` (this mount's node) and passed to the listeners. */
  payload: object;
  className: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const listening = hasListeners(hook);
  // No dep array: the contract is one fire per commit, so a module can re-apply
  // its DOM whenever the sheet repaints.
  useEffect(() => {
    if (!ref.current) return;
    fireHook(hook, { ...payload, element: ref.current });
  });
  if (!listening) return null;
  return <div className={className} ref={ref} />;
}
