import { cx } from "@ui/cx";

export type PortraitDropIndicatorState = {
  readonly status: "ready" | "blocked";
  readonly message: string | null;
};

type Props = PortraitDropIndicatorState & {
  readonly testId?: string;
};

export function PortraitDropIndicator({
  status,
  message,
  testId = "portrait-drop-indicator",
}: Props) {
  return (
    <div
      data-testid={testId}
      className={cx(
        "osc-portrait-drop u-flex u-items-center u-justify-center",
        status === "blocked" && "is-blocked",
      )}
    >
      {status === "ready" ? (
        <span className="osc-portrait-drop-label u-p-1 u-fs-2xs">
          Drop image
        </span>
      ) : (
        <div
          role="status"
          className="osc-portrait-drop-message u-px-3 u-py-2 u-r-md u-bg-surface-2 u-border u-fs-xs u-text-dim"
        >
          {message}
        </div>
      )}
    </div>
  );
}
