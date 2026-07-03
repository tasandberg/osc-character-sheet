import { useEffect, useRef } from "react";

type Props = {
  /** Form field path, e.g. `system.details.notes`. */
  name: string;
  /** Raw HTML source the editor edits. */
  value: string;
  /** Enriched HTML shown in view mode (links/rolls/embeds resolved). */
  enriched: string;
  /** `true` (default) = view with an edit toggle; `false` = always-on editor. */
  toggled?: boolean;
  /** Owning document UUID (e.g. `actor.uuid`); required for collaborative edits. */
  documentUUID: string;
  /** Enable collaborative editing. Off by default. */
  collaborate?: boolean;
  /** Fired with the new source HTML when the user saves. */
  onSave: (value: string) => void;
};

/**
 * React wrapper around Foundry's `<prose-mirror>` custom element. We mint the
 * element through `HTMLProseMirrorElement.create()` (real properties, no
 * attribute-string interpolation) and own its mount/unmount + `save` event.
 * Recreated only when `value`/`enriched` change — never mid-edit, since local
 * typing doesn't touch the props.
 */
export function ProseMirrorEditor({
  name,
  value,
  enriched,
  toggled = true,
  documentUUID,
  collaborate = false,
  onSave,
}: Props) {
  const host = useRef<HTMLDivElement>(null);
  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;

  useEffect(() => {
    const el = foundry.applications.elements.HTMLProseMirrorElement.create({
      name,
      value,
      enriched,
      toggled,
      collaborate,
      compact: false,
      documentUUID,
    });

    const handleSave = (e: Event) =>
      onSaveRef.current((e.target as HTMLElement & { value: string }).value);
    el.addEventListener("save", handleSave);
    host.current?.replaceChildren(el);

    return () => {
      el.removeEventListener("save", handleSave);
      el.remove();
    };
  }, [name, value, enriched, toggled, collaborate, documentUUID]);

  return <div ref={host} className="osc-prosemirror" />;
}
