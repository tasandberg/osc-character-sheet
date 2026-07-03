import { useMemo, useState } from "react";
import { useReactorSheetContext } from "@app/context";
import { SectionHeader } from "@ui/SectionHeader";
import { IconButton } from "@ui/IconButton";
import { Tag } from "@ui/Tag";
import { cx } from "@ui/cx";

/** INT literacy/spoken mods resolve to localized labels on the actor; compose a flavour line. */
function useFlavour(): string | null {
  const { actor } = useReactorSheetContext();
  const int = actor.system.scores?.int as
    | { literacy?: string; spoken?: string }
    | undefined;
  const literacy = int?.literacy ? game.i18n.localize(int.literacy) : "";
  const spoken = int?.spoken ? game.i18n.localize(int.spoken) : "";
  const parts = [literacy, spoken].filter(Boolean);
  return parts.length ? parts.join(". ") + "." : null;
}

/**
 * Languages as ink-stamp chips with an inline edit mode (local toggle; also
 * driven by the optional `editing` prop so a host edit mode can force it on).
 * Edit mode: remove via the chip ×, add from CONFIG.OSE choices not already
 * present, or type a custom language. Persists to `system.languages.value`.
 */
export function LanguagesSection({ editing: forced }: { editing?: boolean }) {
  const { actor, updateActor } = useReactorSheetContext();
  const [localEditing, setLocalEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const editing = forced || localEditing;

  const current = actor.system.languages.value;
  const flavour = useFlavour();

  const choices = useMemo(() => {
    const all = CONFIG.OSE?.languages ?? [];
    return all.filter((l) => !current.includes(l));
  }, [current]);

  const persist = (next: string[]) =>
    updateActor({ "system.languages.value": next });

  const add = (lang: string) => {
    const value = lang.trim();
    if (!value || current.includes(value)) return;
    persist([...current, value]);
    setDraft("");
  };

  const remove = (lang: string) =>
    persist(current.filter((l) => l !== lang));

  return (
    <section className="rs-section rs-lang-sec">
      <SectionHeader
        title="Languages"
        controls={
          !forced && (
            <IconButton
              variant="accent"
              on={editing}
              title={editing ? "Done editing languages" : "Edit languages"}
              aria-label={editing ? "Done editing languages" : "Edit languages"}
              aria-pressed={editing}
              onClick={() => setLocalEditing((e) => !e)}
            >
              <i
                className={cx("fas", editing ? "fa-check" : "fa-pen")}
                aria-hidden="true"
              />
            </IconButton>
          )
        }
      />

      <div className="rs-langs">
        {current.length === 0 && !editing && (
          <span className="rs-langs-empty">None</span>
        )}
        {current.map((lang) => (
          <Tag key={lang}>
            {lang}
            {editing && (
              <button
                type="button"
                className="rs-lang-x"
                title={`Remove ${lang}`}
                aria-label={`Remove ${lang}`}
                onClick={() => remove(lang)}
              >
                <i className="fas fa-xmark" aria-hidden="true" />
              </button>
            )}
          </Tag>
        ))}
      </div>

      {editing && (
        <div className="rs-lang-add">
          <input
            className="rs-lang-input"
            type="text"
            list="rs-lang-choices"
            placeholder="Add a language…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                add(draft);
              }
            }}
          />
          <datalist id="rs-lang-choices">
            {choices.map((l) => (
              <option key={l} value={l} />
            ))}
          </datalist>
          <IconButton
            variant="round"
            title="Add language"
            aria-label="Add language"
            disabled={!draft.trim()}
            onClick={() => add(draft)}
          >
            <i className="fas fa-plus" aria-hidden="true" />
          </IconButton>
        </div>
      )}

      {flavour && <p className="rs-flavour">{flavour}</p>}
    </section>
  );
}
