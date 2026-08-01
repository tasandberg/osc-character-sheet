import { SectionTitle } from "@src/OscSheet/components/ui";
import { useOscSheetContext } from "@app/context";
import { selectExploration, setTargetUpdate } from "@features/actions/exploration";
import { ED_FIELD, LAB_SKILL } from "./classes";

const IN_SIX = [1, 2, 3, 4, 5, 6];

export function ExplorationSection() {
  const { actor, updateActor } = useOscSheetContext();

  return (
    <div className="ed-sec tw:flex tw:flex-col tw:gap-3">
      <SectionTitle hint="1-in-6 chances">Exploration</SectionTitle>
      <div className="ed-skills tw:grid tw:grid-cols-2 tw:gap-x-[14px] tw:gap-y-3 tw:@max-[520px]/fwin:grid-cols-1">
        {selectExploration(actor).map((skill) => (
          <label className={ED_FIELD} key={skill.key}>
            <span className={LAB_SKILL}>{skill.label}</span>
            <div className="ed-skill-target tw:flex tw:items-center tw:gap-2">
              <select
                className="input mono tw:min-w-0 tw:flex-1"
                value={skill.inSix}
                onChange={(e) =>
                  void updateActor(setTargetUpdate(actor, skill.key, Number(e.target.value)))
                }
              >
                {IN_SIX.map((x) => (
                  <option key={x} value={x}>
                    {x}-in-6
                  </option>
                ))}
              </select>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}
