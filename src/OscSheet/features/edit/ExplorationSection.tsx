import { useState } from "react";
import { IconButton, SectionTitle, ValidatedInput } from "@src/OscSheet/components/ui";
import { useOscSheetContext } from "@app/context";
import {
  addSkillUpdate,
  removeSkillUpdate,
  renameSkillUpdate,
  selectExploration,
  setTargetUpdate,
} from "@features/actions/exploration";
import { ED_FIELD, LAB_SKILL } from "./classes";

const IN_SIX = [1, 2, 3, 4, 5, 6];

export function ExplorationSection() {
  const { actor, updateActor } = useOscSheetContext();
  const [draft, setDraft] = useState("");

  const skills = selectExploration(actor);

  const add = () => {
    const label = draft.trim();
    if (!label) return;
    void updateActor(addSkillUpdate(actor, label));
    setDraft("");
  };

  return (
    <div className="ed-sec tw:flex tw:flex-col tw:gap-3">
      <SectionTitle hint="1-in-6 chances">Exploration</SectionTitle>
      <div className="ed-skills tw:grid tw:grid-cols-2 tw:gap-x-[14px] tw:gap-y-3 tw:@max-[520px]/fwin:grid-cols-1">
        {skills.map((skill) => {
          const Wrapper = skill.custom ? "div" : "label";
          return (
            <Wrapper className={ED_FIELD} key={skill.key}>
              <span className={LAB_SKILL}>
                {skill.custom ? (
                  <ValidatedInput
                    className="input ed-skill-name"
                    value={skill.label}
                    validate={(v) => (v ? null : "name can’t be empty")}
                    onCommit={(v) =>
                      void updateActor(renameSkillUpdate(actor, skill.key, v))
                    }
                  />
                ) : (
                  skill.label
                )}
              </span>
              <div className="ed-skill-target tw:flex tw:items-center tw:gap-2">
                <select
                  className="input mono tw:min-w-0 tw:flex-1"
                  value={skill.inSix}
                  onChange={(e) =>
                    void updateActor(
                      setTargetUpdate(actor, skill.key, Number(e.target.value)),
                    )
                  }
                >
                  {IN_SIX.map((x) => (
                    <option key={x} value={x}>
                      {x}-in-6
                    </option>
                  ))}
                </select>
                {skill.custom && (
                  <IconButton
                    variant="danger"
                    title={`Remove ${skill.label}`}
                    aria-label={`Remove ${skill.label}`}
                    onClick={() => void updateActor(removeSkillUpdate(actor, skill.key))}
                  >
                    <i className="fas fa-trash" aria-hidden="true" />
                  </IconButton>
                )}
              </div>
            </Wrapper>
          );
        })}
      </div>
      <div className="ed-skill-add tw:flex tw:items-center tw:gap-2">
        <input
          className="input tw:max-w-[220px] tw:min-w-0 tw:flex-1"
          type="text"
          placeholder="Add a skill…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
        />
        <IconButton
          variant="round"
          title="Add skill"
          aria-label="Add skill"
          disabled={!draft.trim()}
          onClick={add}
        >
          <i className="fas fa-plus" aria-hidden="true" />
        </IconButton>
      </div>
    </div>
  );
}
