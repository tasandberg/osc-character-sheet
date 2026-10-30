import { useEffect, useMemo, useState } from "react";
import type { CreationRules } from "../rules";
import { useCompendiumDetail } from "../useCompendiumDetail";
import { cartLines, type GearDraft } from "./gearDraft";
import type { LoadPreview } from "./gearTypes";
import type { AbilityScores } from "../scores/scoresDraft";

export function useLoadPreview({
  draft,
  rules,
  scores,
}: {
  draft: GearDraft;
  rules: CreationRules;
  scores: AbilityScores;
}) {
  const catalog = useCompendiumDetail("gear", rules.loadGearCatalog);
  const [preview, setPreview] = useState<LoadPreview>();
  const { cart } = draft;
  const lines = useMemo(() => cartLines(cart), [cart]);
  useEffect(() => {
    if (catalog.status !== "ready") return;
    let live = true;
    rules.previewLoad(lines, catalog.detail, scores).then(
      (next) => live && setPreview(next),
      () => undefined,
    );
    return () => {
      live = false;
    };
  }, [lines, catalog, rules, scores]);
  return preview;
}
