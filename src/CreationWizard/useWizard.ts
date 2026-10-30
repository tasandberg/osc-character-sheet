import { useMemo, useState } from "react";
import type { CreationFlow } from "./flow";
import { adjacentStep, firstIncompleteStep, type CreationStep } from "./steps";

export function useWizard<D>(flow: CreationFlow<D>) {
  const [state, setState] = useState(() => {
    const draft = flow.emptyDraft();
    return {
      step: firstIncompleteStep(flow.steps(draft), flow.status(draft)),
      draft,
    };
  });
  const statuses = useMemo(() => flow.status(state.draft), [flow, state.draft]);
  const steps = flow.steps(state.draft);

  const setStep = (step: CreationStep) => setState((s) => ({ ...s, step }));
  const goTo = (step: CreationStep) => {
    if (statuses[step].complete) setStep(step);
  };
  const next = adjacentStep(steps, state.step, 1);
  const previous = adjacentStep(steps, state.step, -1);

  return {
    step: state.step,
    steps,
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
