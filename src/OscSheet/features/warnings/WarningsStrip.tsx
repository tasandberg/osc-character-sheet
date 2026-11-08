import type { ReactNode } from "react";
import { useOscSheetContext } from "@app/context";
import { IconButton } from "@ui/IconButton";
import { InlineButton } from "@ui/InlineButton";
import {
  dismissWarning,
  selectMigrationWarning,
  selectWarnings,
} from "@domain/warnings";

const SLOT = "u-inline-flex u-items-center u-flex-none tw:h-[1lh]";

function WarningLine({
  children,
  action,
}: {
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <li className="u-flex u-items-start u-gap-2 u-py-1 u-fs-sm u-text tw:font-sans tw:leading-snug">
      <span className={SLOT}>
        <i
          className="fas fa-triangle-exclamation u-text-warn"
          aria-hidden="true"
        />
      </span>
      <span className="u-flex-1">{children}</span>
      {action && <span className={SLOT}>{action}</span>}
    </li>
  );
}

export function WarningsStrip() {
  const { actor, items, canEdit } = useOscSheetContext();
  const warnings = selectWarnings(actor);
  const migration = selectMigrationWarning(actor);
  if (!warnings.length && !migration) return null;
  const dismissLabel = game.i18n.localize("OSE.warnings.Dismiss");

  return (
    <section
      aria-label={game.i18n.localize("OSE.warnings.Title")}
      className="osc-warnings-strip u-px-4 u-py-1"
    >
      <ul className="tw:m-0 tw:list-none tw:p-0">
        {migration && (
          <WarningLine>
            {migration.text}{" "}
            <InlineButton variant="link" onClick={migration.open}>
              Open Migration Adjustments
            </InlineButton>
          </WarningLine>
        )}
        {warnings.map((w) => (
          <WarningLine
            key={`${w.itemId}.${w.key}`}
            action={
              canEdit && (
                <IconButton
                  size="sm"
                  aria-label={dismissLabel}
                  title={dismissLabel}
                  onClick={() => void dismissWarning(actor, items, w)}
                >
                  <i className="fas fa-eye-slash" aria-hidden="true" />
                </IconButton>
              )
            }
          >
            {w.text}
          </WarningLine>
        ))}
      </ul>
    </section>
  );
}
