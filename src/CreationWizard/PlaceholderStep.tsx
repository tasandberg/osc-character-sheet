import { STEP_LABELS, type CreationStep } from "./steps";

type Props = { step: CreationStep; done: boolean; onToggleDone: () => void };

export function PlaceholderStep({ step, done, onToggleDone }: Props) {
  return (
    <section className="u-stack u-items-start">
      <h2 className="vm-heading">{STEP_LABELS[step]}</h2>
      <p className="vm-help">This step is on its way.</p>
      {step !== "review" && (
        <button
          type="button"
          className="vm-btn vm-btn-secondary"
          aria-pressed={done}
          onClick={onToggleDone}
        >
          {done ? "Marked done" : "Mark done"}
        </button>
      )}
    </section>
  );
}
