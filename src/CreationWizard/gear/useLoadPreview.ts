import { useEffect, useMemo, useState } from "react";
import type { CreationRules } from "../rules";
import { useCompendiumDetail } from "../useCompendiumDetail";
import { cartLines, type GearDraft } from "./gearDraft";
import type { LoadPreview } from "./gearTypes";

export function useLoadPreview({
  draft,
  rules,
}: {
  draft: GearDraft;
  rules: CreationRules;
}) {
  const catalog = useCompendiumDetail("gear", rules.loadGearCatalog);
  const [preview, setPreview] = useState<LoadPreview>();
  const { cart } = draft;
  const lines = useMemo(() => cartLines(cart), [cart]);
  useEffect(() => {
    if (catalog.status !== "ready") return;
    let live = true;
    rules.previewLoad(lines, catalog.detail).then(
      (next) => live && setPreview(next),
      () => undefined,
    );
    return () => {
      live = false;
    };
  }, [lines, catalog, rules]);
  return preview;
}
