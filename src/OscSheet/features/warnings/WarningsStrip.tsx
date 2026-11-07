import { useOscSheetContext } from "@app/context";
import { IconButton } from "@ui/IconButton";
import { dismissWarning, selectWarnings } from "@domain/warnings";

export function WarningsStrip() {
  const { actor, items, canEdit } = useOscSheetContext();
  const warnings = selectWarnings(actor);
  if (!warnings.length) return null;
  const dismissLabel = game.i18n.localize("OSE.warnings.Dismiss");

  return (
    <section
      aria-label={game.i18n.localize("OSE.warnings.Title")}
      className="osc-warnings-strip u-px-4 u-py-1"
    >
      <ul className="tw:m-0 tw:list-none tw:p-0">
        {warnings.map((w) => (
          <li
            key={`${w.itemId}.${w.key}`}
            className="u-flex u-items-start u-gap-2 u-py-1 u-fs-sm u-text tw:font-sans tw:leading-snug"
          >
            <span className="u-inline-flex u-items-center u-flex-none tw:h-[1lh]">
              <i
                className="fas fa-triangle-exclamation u-text-warn"
                aria-hidden="true"
              />
            </span>
            <span className="u-flex-1">{w.text}</span>
            {canEdit && (
              <span className="u-inline-flex u-items-center u-flex-none tw:h-[1lh]">
                <IconButton
                  size="sm"
                  aria-label={dismissLabel}
                  title={dismissLabel}
                  onClick={() => void dismissWarning(actor, items, w)}
                >
                  <i className="fas fa-eye-slash" aria-hidden="true" />
                </IconButton>
              </span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
