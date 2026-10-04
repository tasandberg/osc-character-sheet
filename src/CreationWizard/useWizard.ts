import { useEffect, useMemo, useRef, useState } from "react";
import type { CreationFlow } from "./flow";
import type { DraftStore } from "./draftStore";
import { adjacentStep, firstIncompleteStep, type CreationStep } from "./steps";

export function useWizard<D>(flow: CreationFlow<D>, store: DraftStore) {
  const [state, setState] = useState(() => {
    const saved = store.load();
    const draft = saved && flow.parseDraft(saved.draft);
    if (saved && draft) return { step: saved.step, draft };
    const empty = flow.emptyDraft();
    return { step: firstIncompleteStep(flow.status(empty)), draft: empty };
  });
  const statuses = useMemo(() => flow.status(state.draft), [flow, state.draft]);

  const skipInitialSave = useRef(true);
  useEffect(() => {
    if (skipInitialSave.current) {
      skipInitialSave.current = false;
      return;
    }
    store.save(state);
  }, [store, state]);

  const setStep = (step: CreationStep) => setState((s) => ({ ...s, step }));
  const goTo = (step: CreationStep) => {
    if (statuses[step].complete) setStep(step);
  };
  const next = adjacentStep(state.step, 1);
  const previous = adjacentStep(state.step, -1);

  return {
    step: state.step,
    draft: state.draft,
    statuses,
    next,
    previous,
    goTo,
    summary: (step: CreationStep) => flow.summary(state.draft, step),
    goNext: () => {
      if (statuses[state.step].complete && next) setStep(next);
    },
    goBack: () => {
      if (previous) setStep(previous);
    },
    setDraft: (update: (draft: D) => D) =>
      setState((s) => ({ ...s, draft: update(s.draft) })),
  };
}
